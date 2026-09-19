# Deploying the probe to Cloud Run

Step by step: create the service, deploy the container, scale to zero, make it
publicly reachable, get a URL, and measure the cold start.

Everything here uses the `gcloud` CLI. Nothing needs the Cloud Console.

---

## 0. Prerequisites

- A GCP project with **billing enabled** (Cloud Run has a free tier, but the
  project still needs billing attached).
- `gcloud` installed and authenticated:

```bash
gcloud auth login
gcloud auth configure-docker   # run again per-region in step 3
```

- Docker, for building the image locally. (Step 4 shows a no-Docker alternative.)

---

## 1. Set your variables

```bash
export PROJECT=your-gcp-project-id
export REGION=us-central1          # pick the region closest to your users
export REPO=spikes                 # Artifact Registry repository name
export SERVICE=coldstart-probe     # Cloud Run service name

gcloud config set project "$PROJECT"
```

> Keep Artifact Registry in the **same region** as the Cloud Run service.
> A cross-region pull adds meaningful time to every cold start.

---

## 2. Enable the APIs

```bash
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com
```

First run takes a minute or two.

---

## 3. Create an Artifact Registry repository

This is where the container image lives.

```bash
gcloud artifacts repositories create "$REPO" \
  --repository-format=docker \
  --location="$REGION" \
  --description="Throwaway spike images"

# Let Docker push to this region's registry
gcloud auth configure-docker "${REGION}-docker.pkg.dev"
```

---

## 4. Build and push the image

```bash
export IMAGE="${REGION}-docker.pkg.dev/${PROJECT}/${REPO}/${SERVICE}:r2r"

# ReadyToRun + chiseled — the fastest-starting variant (see README.md)
docker build \
  --build-arg RUNTIME_IMAGE=mcr.microsoft.com/dotnet/aspnet:10.0-noble-chiseled \
  --build-arg RESTORE_ARGS="-r linux-x64 -p:PublishReadyToRun=true" \
  --build-arg PUBLISH_ARGS="-r linux-x64 --self-contained false -p:PublishReadyToRun=true" \
  -t "$IMAGE" .

docker push "$IMAGE"
```

**No Docker locally?** Build in the cloud instead — but note this builds the
plain JIT variant, since build args are awkward to pass this way:

```bash
gcloud builds submit --tag "$IMAGE" .
```

---

## 5. Deploy to Cloud Run

This is the step that sets scale-to-zero and public access.

```bash
gcloud run deploy "$SERVICE" \
  --image="$IMAGE" \
  --region="$REGION" \
  --platform=managed \
  --port=8080 \
  --min-instances=0 \
  --max-instances=1 \
  --cpu=1 \
  --memory=512Mi \
  --cpu-boost \
  --execution-environment=gen2 \
  --allow-unauthenticated \
  --set-env-vars="DB_MODE=npgsql,WARM_EF=0"
```

What each flag does, and why:

| Flag | Why |
| :--- | :--- |
| `--min-instances=0` | **Scale to zero.** No instance runs when idle, so you pay nothing — and every request after an idle period is a cold start. This is the setting under test. |
| `--max-instances=1` | Keeps the spike from fanning out and muddying measurements. |
| `--allow-unauthenticated` | **Public internet access.** Grants `roles/run.invoker` to `allUsers`. Without it every request returns 403. |
| `--port=8080` | Port Cloud Run sends traffic to. The app reads `$PORT` and binds `0.0.0.0`, so this matches. |
| `--cpu-boost` | Extra CPU during container startup. Free, and it directly targets cold start. |
| `--execution-environment=gen2` | microVM rather than gen1's gVisor syscall interception; generally better for startup-heavy workloads. |
| `--cpu=1 --memory=512Mi` | Cloud Run defaults. Measurements showed more vCPU does not help — startup is largely sequential. |

---

## 6. Get the URL

The deploy command prints it, or fetch it any time:

```bash
export URL=$(gcloud run services describe "$SERVICE" \
  --region="$REGION" --format='value(status.url)')
echo "$URL"
```

Looks like `https://coldstart-probe-abc123def-uc.a.run.app`.

Confirm it is genuinely public — this should return 200 with no credentials:

```bash
curl -si "$URL/healthz" | head -1
```

---

## 7. Confirm it scales to zero

Cloud Run terminates idle instances after roughly **15 minutes** with
`--min-instances=0`. To check the instance count:

```bash
gcloud monitoring time-series list \
  --filter='metric.type="run.googleapis.com/container/instance_count"
            AND resource.labels.service_name="'"$SERVICE"'"' \
  --format='value(points[0].value.int64Value)' 2>/dev/null | head -1
```

In practice the simplest confirmation is the probe itself: if the response says
`"isColdStart": true`, that process had never served a request before, which
means the instance was created for your request.

---

## 8. Measure the cold start

```bash
# Single cold measurement of an already-idle service
./measure-coldstart.sh "$URL" -e /probe/query

# Five cold measurements, forcing a cold instance between each (fast: deploys a
# new revision rather than waiting 15 minutes for idle scale-down)
SERVICE="$SERVICE" REGION="$REGION" PROJECT="$PROJECT" \
  ./measure-coldstart.sh "$URL" -e /probe/query -n 5 -f -o results.csv

# Five cold measurements the honest slow way (true idle scale-down between runs)
./measure-coldstart.sh "$URL" -e /probe/query -n 5 -w 900
```

Reading the output:

```
COLD   http=200  wall=  2310.4 ms  [dns 12.1 | tcp 18.4 | tls 44.9 | server-wait 2231.0]
       app: coldStart=True  in-process=1402 ms  (listening 338 ms, ef-model 570 ms, ef-compile 323 ms)
       => pull + sandbox + routing ~= 908 ms  (wall minus in-process)
WARM   http=200  wall=    78.2 ms  [dns  0.2 | tcp  0.1 | tls  0.0 | server-wait   76.8]
       cold-start penalty ~= 2232 ms
```

- **server-wait** is the cold start. Cloud Run accepts the TCP connection
  immediately and holds it while the container starts, so startup time appears
  as time-to-first-byte, never as connect time.
- **in-process** is what the app itself can see, from OS process start.
- **wall − in-process** is everything the app *cannot* see: image pull, sandbox
  creation, and request routing. This is the number no local benchmark gives you.

---

## 9. Comparing configurations

Redeploy with different settings and re-measure:

```bash
# Warm EF Core during startup (uses the startup CPU boost window)
gcloud run services update "$SERVICE" --region="$REGION" \
  --update-env-vars="WARM_EF=1"

# Turn the boost off, to see what it is worth
gcloud run services update "$SERVICE" --region="$REGION" --no-cpu-boost

# Eliminate cold starts entirely (costs money — an instance always runs)
gcloud run services update "$SERVICE" --region="$REGION" --min-instances=1
```

---

## 10. Clean up

Cloud Run at `--min-instances=0` costs nothing while idle, but the image does
accrue storage charges.

```bash
gcloud run services delete "$SERVICE" --region="$REGION" --quiet
gcloud artifacts repositories delete "$REPO" --location="$REGION" --quiet
```

---

## Troubleshooting

**`--allow-unauthenticated` fails with a policy error.**
Your organization likely enforces Domain Restricted Sharing
(`constraints/iam.allowedPolicyMemberDomains`), which forbids granting access to
`allUsers`. An org admin has to add an exception for the project. You can retry
the binding separately to see the exact error:

```bash
gcloud run services add-iam-policy-binding "$SERVICE" \
  --region="$REGION" --member="allUsers" --role="roles/run.invoker"
```

**"The user-provided container failed to start and listen on the port."**
The container must listen on `$PORT` (not a hard-coded port) and on `0.0.0.0`
(not `localhost`). This app does both in `Program.cs`. Check logs:

```bash
gcloud run services logs read "$SERVICE" --region="$REGION" --limit=50
```

**Every request looks cold.** With `--max-instances=1` and low traffic that is
expected. Confirm with `isColdStart` in the response — it is `false` on the
second request to the same instance.

**Cold starts seem slower than the README's local numbers.** They should be:
local numbers exclude image pull and sandbox creation. That gap is exactly what
`wall − in-process` measures.

**404 instead of 200.** First check who sent it:

```bash
curl -sI "$URL" | grep -i '^server:'
```

`Server: Kestrel` means your app started and routed the request but no route
matched — a path problem. Valid paths are `/`, `/healthz`, `/probe/ping` and
`/probe/query`; remember the leading slash in `-e /probe/query`. `Server: Google
Frontend` means Cloud Run has no service at that URL — check the region, the
project, and that the URL is current (deleting and recreating a service changes
its hostname). A Kestrel 404 shows up in `gcloud run services logs read`; a
Google Frontend 404 does not. Also confirm the deployed image is the one you
expect:

```bash
gcloud run services describe "$SERVICE" --region="$REGION" \
  --format='value(spec.template.spec.containers[0].image)'
```

**403 on every request.** The service is private. Re-run the deploy with
`--allow-unauthenticated`, or check `gcloud run services get-iam-policy "$SERVICE" --region="$REGION"`.
