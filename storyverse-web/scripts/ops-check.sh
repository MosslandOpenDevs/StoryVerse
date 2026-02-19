#!/usr/bin/env bash
set -euo pipefail

BASE_URLS_RAW="${OPERATIONS_BASE_URLS:-${OPERATIONS_BASE_URL:-https://sv.moss.land} http://localhost:6100}"
ENDPOINTS=("/" "/universe" "/api/health")

IFS=' ' read -r -a BASE_URLS <<< "$BASE_URLS_RAW"

run_check() {
  local base_url="$1"
  local failures=0

  check_path() {
    local path="$1"
    local tmp
    tmp="$(mktemp)"
    local code="000"
    local curl_rc=0

    code=$(curl -sS -o "$tmp" -w '%{http_code}' --connect-timeout 3 -m 12 "$base_url$path" 2>/dev/null) || curl_rc=$?

    local len=0
    if [ -s "$tmp" ]; then
      len=$(wc -c < "$tmp")
    fi

    printf "  %s => %s (%s bytes)\n" "$path" "$code" "$len"
    if [[ "$code" != 2* && "$code" != 3* ]]; then
      if [[ "$curl_rc" -eq 28 ]]; then
        echo "  !! timeout detected"
      elif [[ "$curl_rc" -ne 0 ]]; then
        echo "  !! curl error detected (rc=$curl_rc)"
      else
        echo "  !! non-2xx/3xx detected"
      fi
      failures=$((failures + 1))
    fi

    rm -f "$tmp"
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

for base_url in "${BASE_URLS[@]}"; do
  if run_check "$base_url"; then
    exit 0
  fi
  echo "[storyverse-web] fallback to next endpoint..."
done

echo "[storyverse-web] all base URLs failed"
exit 1
