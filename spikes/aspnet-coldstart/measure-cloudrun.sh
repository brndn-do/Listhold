#!/usr/bin/env bash
# True worst-case cold start on Cloud Run: image pull + sandbox start + runtime
# start + first request. Each iteration deploys a NEW revision, which guarantees
# a cold instance rather than waiting ~15 min for idle scale-down.
set -uo pipefail

URL="${URL:?set URL=https://... (from deploy-cloudrun.sh)}"
SERVICE="${SERVICE:-coldstart-probe}"
REGION="${REGION:-us-central1}"
PROJECT="${PROJECT:?set PROJECT}"
RUNS="${RUNS:-5}"
ENDPOINT="${ENDPOINT:-/probe/query}"

echo "url=$URL runs=$RUNS endpoint=$ENDPOINT"
results=()

for i in $(seq 1 "$RUNS"); do
  # New revision => guaranteed cold instance, including a fresh image pull
  # unless Cloud Run has the image cached on the host.
  gcloud run services update "$SERVICE" --region "$REGION" --project "$PROJECT" \
    --update-env-vars "COLD_RUN_MARKER=$(date +%s)-$i" --quiet >/dev/null 2>&1

  sleep 3   # let the new revision become the traffic target

  t=$(curl -s -o /tmp/cr_body.json -w '%{time_total}' --max-time 120 "${URL}${ENDPOINT}")
  ms=$(python3 -c "print(int(float('$t')*1000))")
  results+=("$ms")

  internal=$(python3 -c "
import json
try:
    d=json.load(open('/tmp/cr_body.json'))
    ph={p['name']:p['atMs'] for p in d.get('phases',[])}
    ef=d.get('ef',{})
    print(f\"cold={d.get('isColdStart')} listen={ph.get('listening',0):.0f} model={ef.get('modelBuildMs',0):.0f} compile={ef.get('queryCompileMs',0):.0f} inProcess={d.get('processUptimeMsAtRequestEnd',0):.0f}\")
except Exception as e: print('(no json)')
" 2>/dev/null)
  printf 'run %2d: %6d ms wall   %s\n' "$i" "$ms" "$internal"
done

printf '%s\n' "${results[@]}" | python3 -c "
import sys,statistics
v=sorted(int(x) for x in sys.stdin if x.strip())
if v: print(f'\n  n={len(v)} min={v[0]} median={statistics.median(v):.0f} max={v[-1]} (ms)')
"
echo
echo "wall - inProcess  ~=  image pull + sandbox start (the part the app cannot see)"
