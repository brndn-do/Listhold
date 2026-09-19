# ASP.NET Core cold-start probe

A throwaway spike to answer one question: **if the Listhold backend were
ASP.NET Core (controllers + System.Text.Json + EF Core, plain JIT), how slow is
a Cloud Run cold start with scale-to-zero?**

Not production code. Delete it once the decision is made.

## What it measures

The app instruments its own startup and reports a timeline with the first
response, so a single request decomposes cold start into phases:

```
process start ─► main entered ─► services configured ─► host built ─► listening ─► first request ─► response
```

Endpoints:

| Route | What it exercises |
| :--- | :--- |
| `GET /probe/ping` | ASP.NET Core pipeline + JSON only — **the floor**, no EF |
| `GET /probe/query` | EF model build + query compilation + JSON — **the realistic first request** |
| `GET /healthz` | liveness |

## EF Core without a real database

The probe uses the **real Npgsql provider** with a connection string pointing at
a host that does not exist, and never opens a connection. It still pays the two
costs that actually matter on a cold start:

1. **Model building** — first touch of `DbContext.Model` builds the whole model:
   conventions, 8 entity types, 14 indexes, relationships, value converters.
2. **Query compilation** — `ToQueryString()` runs the entire LINQ → SQL pipeline
   (compilation, shaper, SQL generation) *without a connection*.

So the numbers reflect production's provider with zero infrastructure. Set
`DB_MODE=sqlite` to additionally execute and materialise against a local SQLite
file, if you want the materialisation cost too.

The model is deliberately non-trivial — it mirrors the real Listhold schema.
A one-entity model would understate EF's cold-start cost several-fold.

## Measured results

Host: 4 vCPU, container pinned to `--cpus=1` (Cloud Run's default), **image
already local**. Median of 6–8 fresh containers, `docker run` → first HTTP 200.

| Variant | Median | Model build | Query compile | Image |
| :--- | ---: | ---: | ---: | ---: |
| JIT, no EF (`/ping`) — floor | **628 ms** | – | – | 110 MB |
| **JIT, EF lazy (baseline)** | **1524 ms** | 557 ms | 320 ms | 110 MB |
| JIT, EF warmed at startup | 1582 ms | 12 ms | 70 ms | 110 MB |
| Chiseled base, EF lazy | 1526 ms | 555 ms | 322 ms | **71 MB** |
| **ReadyToRun + chiseled** | **946 ms** | 243 ms | 100 ms | **61 MB** |
| ReadyToRun + warmed EF | 983 ms | 12 ms | 21 ms | 61 MB |
| ReadyToRun, no EF (`/ping`) | 580 ms | – | – | 61 MB |

### What this says

1. **EF Core is ~58% of the cold start.** 877 ms of the 1524 ms baseline is
   model building plus query compilation. The ASP.NET Core floor is only 628 ms.
2. **ReadyToRun is the single biggest lever: −38%** (1524 → 946 ms). It is still
   CoreCLR — assemblies are pre-compiled to native code but the JIT is fully
   available, so this is not NativeAOT and costs no compatibility. It also
   shrinks the image. There is no reason not to use it.
3. **Chiseled changes nothing at runtime** but cuts the image 110 → 71 MB
   (61 MB with R2R), which is pull time — the part the local harness can't see.
4. **Warming EF at startup does not reduce total work locally** — it moves it
   from the first request into startup (`listening` goes 325 → 1300 ms). This is
   still worth doing on Cloud Run, because **startup CPU boost** gives more CPU
   during container start than during request handling. Verify on real Cloud Run.
5. **`--cpus=1` ≈ 4 vCPU.** Startup is largely sequential, so Cloud Run's
   1-vCPU default is not the bottleneck. Paying for more vCPU will not fix this.

## Estimating the true Cloud Run worst case

The table above **excludes image pull and sandbox provisioning**, which the
local harness cannot measure. Worst case on Cloud Run is roughly:

```
image pull (61–110 MB, cold)   ~0.5–2 s   ← not measured here
sandbox / instance start       ~0.2–0.5 s ← not measured here
runtime + host start            ~0.35 s   ← measured
first request (EF + JIT)        ~0.6–1.2 s← measured
                               ─────────
                                ~1.7–4 s
```

**Treat the first two rows as estimates, not measurements.** Run
`measure-cloudrun.sh` to get the real figure — it deploys a new revision per
iteration, which guarantees a cold instance rather than waiting ~15 minutes for
idle scale-down. `wall − inProcess` in its output is exactly the pull + sandbox
time the app cannot observe.

## Running it

```bash
# local
docker build -t coldstart-probe:jit .
./measure-local.sh coldstart-probe:jit 10 /probe/query "--cpus=1"

# ReadyToRun + chiseled (recommended config)
docker build \
  --build-arg RUNTIME_IMAGE=mcr.microsoft.com/dotnet/aspnet:10.0-noble-chiseled \
  --build-arg RESTORE_ARGS="-r linux-x64 -p:PublishReadyToRun=true" \
  --build-arg PUBLISH_ARGS="-r linux-x64 --self-contained false -p:PublishReadyToRun=true" \
  -t coldstart-probe:r2r .

# Cloud Run
PROJECT=my-project VARIANT=r2r ./deploy-cloudrun.sh
PROJECT=my-project URL=https://... ./measure-cloudrun.sh
```

Note: `RESTORE_ARGS` must carry both the RID **and** `PublishReadyToRun=true`,
or publish fails with `NETSDK1094` — restore has to fetch crossgen2.

## Cloud Run settings that matter

- `--cpu-boost` — extra CPU during startup. Free win; combine with `WARM_EF=1`.
- `--execution-environment=gen2` — microVM rather than gVisor; generally better
  for startup-heavy workloads than gen1's syscall interception.
- Artifact Registry **in the same region** as the service, or pull dominates.
- `--min-instances=1` eliminates cold starts entirely, at the cost of
  scale-to-zero. This is the real decision the spike exists to inform.

## Sandbox note

`Dockerfile` contains a `BUILD_PROXY` arg and an optional `ca-bundle.crt` copy,
needed only because this sandbox routes egress through a TLS-terminating proxy.
Both are no-ops when the file is absent (the `ca-bundle.cr[t]` glob), so the
Dockerfile works unchanged elsewhere. Nothing lands in the runtime image.
