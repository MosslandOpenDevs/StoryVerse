#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

"${REPO_ROOT}/storyverse-web/scripts/ops-check.sh"
code=$?

if [[ "$code" -eq 0 ]]; then
  status="ok"
else
  status="fail"
fi

policy_required="${OPERATIONS_REQUIRE_PRIMARY:-0}"
policy_mode="policy_a_fallback_allowed"
if [[ "$policy_required" == "1" || "$policy_required" == "true" ]]; then
  policy_mode="strict_primary"
fi

summary="{\"service\":\"StoryVerse\",\"status\":\"${status}\",\"policyMode\":\"${policy_mode}\",\"primaryRequired\":\"${policy_required}\",\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}"
echo "$summary"

exit "$code"
