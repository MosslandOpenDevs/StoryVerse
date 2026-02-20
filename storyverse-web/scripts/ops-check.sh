#!/usr/bin/env bash
set -euo pipefail

BASE_URLS_RAW="${OPERATIONS_BASE_URLS:-${OPERATIONS_BASE_URL:-https://sv.moss.land} http://localhost:6100}"
ENDPOINTS=("/" "/universe" "/api/health")
RETRIES="${OPERATIONS_RETRIES:-2}"
RETRY_DELAY_SECS="${OPERATIONS_RETRY_DELAY_SECS:-1}"
REQUIRE_PRIMARY="${OPERATIONS_REQUIRE_PRIMARY:-0}"
REPORT_FILE="${OPERATIONS_REPORT_FILE:-}"

if [[ "$REQUIRE_PRIMARY" == "1" ]]; then
  echo "[storyverse-web] policy notice: OPERATIONS_REQUIRE_PRIMARY=1 is ignored (Policy A: warn + fallback allowed)"
fi

IFS=' ' read -r -a BASE_URLS <<< "$BASE_URLS_RAW"

write_report() {
  local status="$1"
  local primary_status="$2"
  local selected_base="$3"
  local note="$4"

  if [[ -z "$REPORT_FILE" ]]; then
    return 0
  fi

  printf '{"service":"storyverse-web","status":"%s","primary":"%s","selected_base":"%s","note":"%s","ts":"%s"}\n' \
    "$status" "$primary_status" "$selected_base" "$note" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$REPORT_FILE"
  echo "[storyverse-web] wrote report: ${REPORT_FILE}"
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

for idx in "${!BASE_URLS[@]}"; do
  base_url="${BASE_URLS[$idx]}"

  if run_check "$base_url"; then
    if (( idx > 0 && primary_failed == 1 )); then
      echo "[storyverse-web] warning: primary endpoint degraded (${primary_url}), fallback healthy (${base_url})"
      write_report "ok" "degraded" "$base_url" "fallback_healthy_policy_a"
    else
      write_report "ok" "healthy" "$base_url" "primary_healthy"
    fi
    exit 0
  fi

  if (( idx == 0 )); then
    primary_failed=1
  fi

  echo "[storyverse-web] fallback to next endpoint..."
done

echo "[storyverse-web] all base URLs failed"
write_report "fail" "down" "none" "all_bases_failed"
exit 1
