#!/usr/bin/env bash
set -euo pipefail

BASE_URLS_RAW="${OPERATIONS_BASE_URLS:-${OPERATIONS_BASE_URL:-https://sv.moss.land} http://localhost:16100}"
ENDPOINTS=("/" "/universe" "/api/health")
RETRIES="${OPERATIONS_RETRIES:-2}"
RETRY_DELAY_SECS="${OPERATIONS_RETRY_DELAY_SECS:-1}"
REQUIRE_PRIMARY="${OPERATIONS_REQUIRE_PRIMARY:-0}"
POLICY_MODE="fallback_allowed"
REPORT_FILE="${OPERATIONS_REPORT_FILE:-}"
TUNNEL_PROCESS_NAME="${OPERATIONS_TUNNEL_PROCESS_NAME:-storyverse-tunnel}"
TUNNEL_RESTART_WARN="${OPERATIONS_TUNNEL_RESTART_WARN:-100}"
RETRY_EVENTS_TOTAL=0

if [[ "$REQUIRE_PRIMARY" == "1" ]]; then
  echo "[storyverse-web] policy notice: OPERATIONS_REQUIRE_PRIMARY=1 is ignored and strict failover mode is disabled (Policy A: warn + fallback allowed)"
fi

IFS=' ' read -r -a BASE_URLS <<< "$BASE_URLS_RAW"

probe_endpoint_code() {
  local base_url="$1"
  local path="$2"
  local out

  out="$(curl -sS -o /dev/null -w '%{http_code}' --connect-timeout 3 -m 12 "${base_url}${path}" 2>/dev/null || true)"
  if [[ -z "$out" ]]; then
    echo "000"
    return
  fi

  echo "$out" | tail -n 1
}

probe_latency_ms() {
  local base_url="$1"
  local path="${2:-/api/health}"
  local out

  out="$(curl -sS -o /dev/null -w '%{http_code} %{time_total}' --connect-timeout 3 -m 12 "${base_url}${path}" 2>/dev/null || echo '000 0')"
  local code
  local sec
  code="$(awk '{print $1}' <<<"$out")"
  sec="$(awk '{print $2}' <<<"$out")"

  if [[ "$code" == 2* || "$code" == 3* ]]; then
    awk -v s="$sec" 'BEGIN { printf "%.0f", s * 1000 }'
  else
    echo "null"
  fi
}

write_report() {
  local status="$1"
  local primary_status="$2"
  local selected_base="$3"
  local note="$4"
  local primary_latency_ms="$5"
  local selected_latency_ms="$6"
  local primary_home_code="$7"
  local primary_universe_code="$8"
  local selected_home_code="$9"
  local selected_universe_code="${10}"
  local primary_fail_count="${11}"
  local selected_fail_count="${12}"
  local primary_fail_ratio="${13}"
  local selected_fail_ratio="${14}"
  local primary_api_code="${15}"
  local selected_api_code="${16}"
  local tunnel_risk="${17}"
  local tunnel_restart_count="${18}"
  local retry_events_total="${19}"

  if [[ -z "$REPORT_FILE" ]]; then
    return 0
  fi

  printf '{"service":"storyverse-web","status":"%s","primary":"%s","selected_base":"%s","policy_mode":"%s","note":"%s","primary_api_latency_ms":%s,"selected_api_latency_ms":%s,"primary_home_code":"%s","primary_universe_code":"%s","primary_api_code":"%s","selected_home_code":"%s","selected_universe_code":"%s","selected_api_code":"%s","primary_fail_count":%s,"selected_fail_count":%s,"primary_fail_ratio":%s,"selected_fail_ratio":%s,"tunnel_risk":"%s","tunnel_restart_count":%s,"retry_events_total":%s,"ts":"%s"}\n' \
    "$status" "$primary_status" "$selected_base" "$POLICY_MODE" "$note" "$primary_latency_ms" "$selected_latency_ms" "$primary_home_code" "$primary_universe_code" "$primary_api_code" "$selected_home_code" "$selected_universe_code" "$selected_api_code" "$primary_fail_count" "$selected_fail_count" "$primary_fail_ratio" "$selected_fail_ratio" "$tunnel_risk" "$tunnel_restart_count" "$retry_events_total" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$REPORT_FILE"
  echo "[storyverse-web] wrote report: ${REPORT_FILE}"
}

probe_tunnel_state() {
  if ! command -v pm2 >/dev/null 2>&1 || ! command -v node >/dev/null 2>&1; then
    echo "unknown 0"
    return 0
  fi

  local data
  data="$(pm2 jlist 2>/dev/null | node -e 'let b="";process.stdin.on("data",d=>b+=d);process.stdin.on("end",()=>{try{const n=process.argv[1];const a=JSON.parse(b||"[]");const p=a.find(x=>x.name===n);if(!p||!p.pm2_env){console.log("unknown 0");return;}const r=Number(p.pm2_env.restart_time||0);const risk=r>Number(process.argv[2]||100)?"high":"normal";console.log(`${risk} ${r}`);}catch(e){console.log("unknown 0");}});' "$TUNNEL_PROCESS_NAME" "$TUNNEL_RESTART_WARN" 2>/dev/null || echo "unknown 0")"
  echo "$data"
}

run_check() {
  local base_url="$1"
  local failures=0

  check_path() {
    local path="$1"
    local attempts=0
    local success=0

    while (( attempts <= RETRIES )); do
      attempts=$((attempts + 1))

      local tmp
      tmp="$(mktemp)"
      local code="000"
      local curl_rc=0

      code=$(curl -sS -o "$tmp" -w '%{http_code}' --connect-timeout 3 -m 12 "$base_url$path" 2>/dev/null) || curl_rc=$?

      local len=0
      if [ -s "$tmp" ]; then
        len=$(wc -c < "$tmp")
      fi

      if [[ "$code" == 2* || "$code" == 3* ]]; then
        printf "  %s => %s (%s bytes) [attempt %d/%d]\n" "$path" "$code" "$len" "$attempts" "$((RETRIES + 1))"
        if (( attempts > 1 )); then
          RETRY_EVENTS_TOTAL=$((RETRY_EVENTS_TOTAL + attempts - 1))
        fi
        rm -f "$tmp"
        success=1
        break
      fi

      if (( attempts > RETRIES )); then
        printf "  %s => %s (%s bytes) [attempt %d/%d]\n" "$path" "$code" "$len" "$attempts" "$((RETRIES + 1))"
        if [[ "$curl_rc" -eq 28 ]]; then
          echo "  !! timeout detected"
        elif [[ "$curl_rc" -ne 0 ]]; then
          echo "  !! curl error detected (rc=$curl_rc)"
        else
          echo "  !! non-2xx/3xx detected"
        fi
      else
        printf "  %s => %s (%s bytes) [attempt %d/%d, retrying]\n" "$path" "$code" "$len" "$attempts" "$((RETRIES + 1))"
        sleep "$RETRY_DELAY_SECS"
      fi

      rm -f "$tmp"
    done

    if (( success == 0 )); then
      if (( attempts > 1 )); then
        RETRY_EVENTS_TOTAL=$((RETRY_EVENTS_TOTAL + attempts - 1))
      fi
      failures=$((failures + 1))
    fi
  }

  printf "[storyverse-web] checking %s\n" "$base_url"
  for path in "${ENDPOINTS[@]}"; do
    check_path "$path"
  done

  if [[ "$failures" -eq 0 ]]; then
    echo "[storyverse-web] all checks passed on ${base_url}"
    return 0
  fi

  echo "[storyverse-web] failed checks on ${base_url}: ${failures}"
  return 1
}

primary_url="${BASE_URLS[0]}"
primary_failed=0

tunnel_state="$(probe_tunnel_state)"
tunnel_risk="$(awk '{print $1}' <<<"$tunnel_state")"
tunnel_restart_count="$(awk '{print $2}' <<<"$tunnel_state")"
if [[ "$tunnel_risk" == "high" ]]; then
  echo "[storyverse-web] warning: tunnel restart churn is high (${tunnel_restart_count} restarts)"
fi

for idx in "${!BASE_URLS[@]}"; do
  base_url="${BASE_URLS[$idx]}"

  if run_check "$base_url"; then
    if (( RETRY_EVENTS_TOTAL > 0 )); then
      echo "[storyverse-web] warning: transient errors recovered via retries (retry_events_total=${RETRY_EVENTS_TOTAL})"
    fi
    primary_latency_ms="$(probe_latency_ms "$primary_url")"
    selected_latency_ms="$(probe_latency_ms "$base_url")"
    primary_home_code="$(probe_endpoint_code "$primary_url" "/")"
    primary_universe_code="$(probe_endpoint_code "$primary_url" "/universe")"
    primary_api_code="$(probe_endpoint_code "$primary_url" "/api/health")"
    selected_home_code="$(probe_endpoint_code "$base_url" "/")"
    selected_universe_code="$(probe_endpoint_code "$base_url" "/universe")"
    selected_api_code="$(probe_endpoint_code "$base_url" "/api/health")"

    primary_fail_count=0
    [[ "$primary_home_code" != 2* && "$primary_home_code" != 3* ]] && primary_fail_count=$((primary_fail_count + 1))
    [[ "$primary_universe_code" != 2* && "$primary_universe_code" != 3* ]] && primary_fail_count=$((primary_fail_count + 1))

    selected_fail_count=0
    [[ "$selected_home_code" != 2* && "$selected_home_code" != 3* ]] && selected_fail_count=$((selected_fail_count + 1))
    [[ "$selected_universe_code" != 2* && "$selected_universe_code" != 3* ]] && selected_fail_count=$((selected_fail_count + 1))

    primary_fail_ratio=$(awk -v c="$primary_fail_count" 'BEGIN { printf "%.2f", c / 2 }')
    selected_fail_ratio=$(awk -v c="$selected_fail_count" 'BEGIN { printf "%.2f", c / 2 }')

    if (( idx > 0 && primary_failed == 1 )); then
      echo "[storyverse-web] warning: primary endpoint degraded (${primary_url}), fallback healthy (${base_url})"
      write_report "ok" "degraded" "$base_url" "fallback_healthy_policy_a" "$primary_latency_ms" "$selected_latency_ms" "$primary_home_code" "$primary_universe_code" "$selected_home_code" "$selected_universe_code" "$primary_fail_count" "$selected_fail_count" "$primary_fail_ratio" "$selected_fail_ratio" "$primary_api_code" "$selected_api_code" "$tunnel_risk" "$tunnel_restart_count" "$RETRY_EVENTS_TOTAL"
    else
      write_report "ok" "healthy" "$base_url" "primary_healthy" "$primary_latency_ms" "$selected_latency_ms" "$primary_home_code" "$primary_universe_code" "$selected_home_code" "$selected_universe_code" "$primary_fail_count" "$selected_fail_count" "$primary_fail_ratio" "$selected_fail_ratio" "$primary_api_code" "$selected_api_code" "$tunnel_risk" "$tunnel_restart_count" "$RETRY_EVENTS_TOTAL"
    fi
    exit 0
  fi

  if (( idx == 0 )); then
    primary_failed=1
  fi

  echo "[storyverse-web] fallback to next endpoint..."
done

echo "[storyverse-web] all base URLs failed"
write_report "fail" "down" "none" "all_bases_failed" "null" "null" "000" "000" "000" "000" "2" "2" "1.00" "1.00" "000" "000" "$tunnel_risk" "$tunnel_restart_count" "$RETRY_EVENTS_TOTAL"
exit 1
