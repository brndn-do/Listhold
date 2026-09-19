#!/usr/bin/env bash
# Measures container-create -> first HTTP 200, over N fresh containers.
# NOTE: the image is already local, so this EXCLUDES image pull. Pull is the
# other half of a Cloud Run cold start — see README.
set -uo pipefail

IMAGE="${1:-coldstart-probe:jit}"
RUNS="${2:-10}"
ENDPOINT="${3:-/probe/query}"
EXTRA_ENV="${4:-}"

NAME="probe-m-$$"
PORT=$(( 18000 + (RANDOM % 900) ))

printf '%s\n' "image=$IMAGE runs=$RUNS endpoint=$ENDPOINT env=[$EXTRA_ENV]"
cleanup() { docker rm -f "$NAME" >/dev/null 2>&1 || true; }
trap cleanup EXIT

results=()
for i in $(seq 1 "$RUNS"); do
  cleanup
  start=$(date +%s%N)
  # shellcheck disable=SC2086
  docker run -d --name "$NAME" -p ${PORT}:8080 $EXTRA_ENV "$IMAGE" >/dev/null || { echo "run failed"; continue; }
  body=""
  while :; do
    body=$(curl -s --max-time 30 "http://localhost:${PORT}${ENDPOINT}" 2>/dev/null)
    [ -n "$body" ] && break
    now=$(date +%s%N)
    if (( (now-start)/1000000 > 60000 )); then echo "  timeout"; break; fi
    sleep 0.02
  done
  end=$(date +%s%N)
  [ -z "$body" ] && continue
  ms=$(( (end-start)/1000000 ))
  results+=("$ms")

  internal=$(printf '%s' "$body" | python3 -c "
import sys,json
try:
    d=json.load(sys.stdin); ef=d.get('ef',{})
    ph={p['name']:p['atMs'] for p in d.get('phases',[])}
    print(f\"listen={ph.get('listening',0):.0f} model={ef.get('modelBuildMs',0):.0f} compile={ef.get('queryCompileMs',0):.0f} inProcess={d.get('processUptimeMsAtRequestEnd',0):.0f}\")
except Exception: print('(no json)')
" 2>/dev/null)
  printf 'run %2d: %5d ms wall   %s\n' "$i" "$ms" "$internal"
done

printf '%s\n' "${results[@]}" | python3 -c "
import sys,statistics
v=sorted(int(x) for x in sys.stdin if x.strip())
if v:
    p90=v[min(len(v)-1,int(len(v)*0.9))]
    print(f'\n  n={len(v)}  min={v[0]}  median={statistics.median(v):.0f}  p90={p90}  max={v[-1]}  (ms)')
"
