#!/usr/bin/env bash
#
# Measure the first-request latency of a backend that is scaled to zero.
#
#   ./measure-coldstart.sh https://my-service-abc123-uc.a.run.app -e /probe/query
#
# Reports wall-clock time to the first successful response, broken into
# DNS / TCP / TLS / server-wait. On Cloud Run the frontend accepts the
# connection immediately and holds it while your container starts, so cold
# start shows up as *server wait*, not as connect time.
#
# Works against any HTTP backend. If the response is JSON from the cold-start
# probe in this directory, the server wait is decomposed further into
# "image pull + sandbox" vs "runtime + app startup".
#
set -uo pipefail

URL=""; ENDPOINT=""; RUNS=1; WAIT=900
FORCE_COLD=0; NO_WARM=0; OUT=""; TIMEOUT=300

usage() {
  cat <<'USAGE'
Usage: ./measure-coldstart.sh <URL> [options]

  <URL>                 Base URL of the deployed service.

Options:
  -e, --endpoint PATH   Path to request (default: none, URL used as-is)
  -n, --runs N          Number of cold measurements (default: 1)
  -w, --wait SECONDS    Idle wait between runs so the service scales back to
                        zero (default: 900 = 15 min, Cloud Run's default).
                        Ignored with --force-cold.
  -f, --force-cold      Force a cold instance between runs by deploying a new
                        revision instead of waiting. Requires gcloud and the
                        SERVICE, REGION and PROJECT env vars.
      --no-warm         Skip the warm follow-up request.
  -t, --timeout SECONDS Max seconds to wait for a response (default: 300)
  -o, --out FILE        Append results as CSV.
  -h, --help            Show this message.

Examples:
  ./measure-coldstart.sh https://probe-xyz.run.app -e /probe/query
  SERVICE=probe REGION=us-central1 PROJECT=my-proj \
    ./measure-coldstart.sh https://probe-xyz.run.app -e /probe/query -n 5 -f
USAGE
}

while [ $# -gt 0 ]; do
  case "$1" in
    -e|--endpoint)   ENDPOINT="$2"; shift 2 ;;
    -n|--runs)       RUNS="$2"; shift 2 ;;
    -w|--wait)       WAIT="$2"; shift 2 ;;
    -f|--force-cold) FORCE_COLD=1; shift ;;
    --no-warm)       NO_WARM=1; shift ;;
    -t|--timeout)    TIMEOUT="$2"; shift 2 ;;
    -o|--out)        OUT="$2"; shift 2 ;;
    -h|--help)       usage; exit 0 ;;
    -*)              echo "unknown option: $1" >&2; usage; exit 2 ;;
    *)               URL="$1"; shift ;;
  esac
done

[ -z "$URL" ] && { usage; exit 2; }
TARGET="${URL%/}${ENDPOINT}"

command -v curl    >/dev/null || { echo "curl is required" >&2; exit 1; }
command -v python3 >/dev/null || { echo "python3 is required" >&2; exit 1; }

if [ "$FORCE_COLD" = 1 ]; then
  command -v gcloud >/dev/null || { echo "--force-cold needs gcloud" >&2; exit 1; }
  : "${SERVICE:?--force-cold needs SERVICE}"
  : "${REGION:?--force-cold needs REGION}"
  : "${PROJECT:?--force-cold needs PROJECT}"
fi

BODY=$(mktemp); trap 'rm -f "$BODY"' EXIT

CURL_FMT='%{http_code} %{time_namelookup} %{time_connect} %{time_appconnect} %{time_pretransfer} %{time_starttransfer} %{time_total} %{size_download}'

WALL_MS=0; ATTEMPTS=0; RAW=""

# Wall-clock from the first attempt to the first real response. Retries while
# the connection is refused (http_code 000), which happens against a local
# container that is not listening yet. Cloud Run accepts immediately, so there
# it is a single attempt and WALL_MS ~= curl's total.
hit() {
  local start now raw code
  start=$(date +%s%N); ATTEMPTS=0
  while :; do
    raw=$(curl -s -o "$BODY" -w "$CURL_FMT" --max-time "$TIMEOUT" \
               -H 'Cache-Control: no-cache' "$TARGET" 2>/dev/null)
    ATTEMPTS=$((ATTEMPTS + 1))
    code=$(printf '%s' "$raw" | awk '{print $1}')
    [ "$code" != "000" ] && [ -n "$code" ] && break
    now=$(date +%s%N)
    if (( (now - start) / 1000000 > TIMEOUT * 1000 )); then break; fi
    sleep 0.05
  done
  now=$(date +%s%N)
  WALL_MS=$(( (now - start) / 1000000 ))
  RAW="$raw"
}

report() {  # $1=label  $2=raw curl output
  python3 - "$1" "$BODY" "$2" "$WALL_MS" "$ATTEMPTS" <<'PY'
import json, sys
label, body_path, raw, wall_ms, attempts = sys.argv[1:6]
wall_ms = float(wall_ms); attempts = int(attempts)
p = raw.split()
if len(p) < 8:
    print(f"  {label:<6} FAILED (no response within timeout)")
    print("RESULT  ")
    sys.exit(0)

code = p[0]
dns, tcp, tls, pre, ttfb, total = (float(x) for x in p[1:7])
size = int(float(p[7]))
m = lambda s: s * 1000.0
server_wait = m(ttfb - pre)

extra = f"  ({attempts} attempts)" if attempts > 1 else ""
print(f"  {label:<6} http={code}  wall={wall_ms:8.1f} ms   "
      f"[dns {m(dns):6.1f} | tcp {m(tcp-dns):6.1f} | tls {m(tls-tcp) if tls>0 else 0:6.1f} "
      f"| server-wait {server_wait:8.1f}]  {size}B{extra}")

cold = "unknown"
try:
    d = json.load(open(body_path))
except Exception:
    d = None

if isinstance(d, dict) and "processUptimeMsAtRequestEnd" in d:
    cold = str(d.get("isColdStart"))
    inproc = float(d.get("processUptimeMsAtRequestEnd") or 0)
    ph = {x["name"]: x["atMs"] for x in d.get("phases", [])}
    ef = d.get("ef") or {}
    print(f"         app: coldStart={cold}  in-process={inproc:.0f} ms  "
          f"(listening {ph.get('listening', 0):.0f} ms, "
          f"ef-model {ef.get('modelBuildMs', 0):.0f} ms, "
          f"ef-compile {ef.get('queryCompileMs', 0):.0f} ms)")
    infra = wall_ms - inproc
    if infra > 0:
        print(f"         => pull + sandbox + routing ~= {infra:.0f} ms  (wall minus in-process)")

print(f"RESULT {wall_ms:.1f} {server_wait:.1f} {cold}")
PY
}

force_cold() {
  echo "  forcing a cold instance (new revision)..."
  gcloud run services update "$SERVICE" --region "$REGION" --project "$PROJECT" \
    --update-env-vars "COLD_MARKER=$(date +%s)-$RANDOM" --quiet >/dev/null 2>&1 \
    || { echo "  gcloud update failed" >&2; return 1; }
  sleep 5
}

echo "target : $TARGET"
echo "runs   : $RUNS"
[ "$FORCE_COLD" = 1 ] && echo "mode   : force-cold (new revision per run)" \
                      || echo "mode   : idle wait ${WAIT}s between runs"
echo

[ -n "$OUT" ] && [ ! -s "$OUT" ] && \
  echo "run,cold_wall_ms,cold_server_wait_ms,warm_wall_ms,cold_confirmed" >> "$OUT"

cold_totals=(); warm_totals=()

for i in $(seq 1 "$RUNS"); do
  if [ "$i" -gt 1 ]; then
    if [ "$FORCE_COLD" = 1 ]; then force_cold || break
    else echo "  waiting ${WAIT}s for scale-to-zero..."; sleep "$WAIT"; fi
  fi

  echo "run $i:"
  hit
  out=$(report COLD "$RAW")
  echo "$out" | grep -v '^RESULT'
  line=$(echo "$out" | grep '^RESULT' | head -1)
  ctotal=$(echo "$line" | awk '{print $2}'); cwait=$(echo "$line" | awk '{print $3}')
  cconf=$(echo "$line" | awk '{print $4}')
  [ -n "$ctotal" ] && cold_totals+=("$ctotal")

  wtotal=""
  if [ "$NO_WARM" = 0 ]; then
    hit
    out2=$(report WARM "$RAW")
    echo "$out2" | grep -v '^RESULT'
    wtotal=$(echo "$out2" | grep '^RESULT' | head -1 | awk '{print $2}')
    [ -n "$wtotal" ] && warm_totals+=("$wtotal")
    if [ -n "$ctotal" ] && [ -n "$wtotal" ]; then
      python3 -c "import sys; print('         cold-start penalty ~= %.0f ms' % (float(sys.argv[1]) - float(sys.argv[2])))" "$ctotal" "$wtotal"
    fi
  fi

  [ -n "$OUT" ] && echo "$i,$ctotal,$cwait,$wtotal,$cconf" >> "$OUT"
  echo
done

summarise() {
  local label="$1"; shift
  printf '%s\n' "$@" | python3 -c "
import sys, statistics
v = sorted(float(x) for x in sys.stdin if x.strip())
if v:
    p90 = v[min(len(v)-1, int(len(v)*0.9))]
    print('  %-5s n=%d  min=%.0f  median=%.0f  p90=%.0f  max=%.0f  (ms)'
          % ('$label', len(v), v[0], statistics.median(v), p90, v[-1]))
"
}
echo "summary"
[ ${#cold_totals[@]} -gt 0 ] && summarise COLD "${cold_totals[@]}"
[ ${#warm_totals[@]} -gt 0 ] && summarise WARM "${warm_totals[@]}"
[ -n "$OUT" ] && echo "  csv -> $OUT"
