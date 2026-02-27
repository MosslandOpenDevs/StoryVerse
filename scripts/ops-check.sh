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
policy_reason="primary_optional_fallback_allowed"
strict_override_detected="false"

if [[ "$policy_required" == "1" || "$policy_required" == "true" ]]; then
  strict_override_detected="true"
  policy_reason="strict_override_ignored_policy_a"
  echo "[StoryVerse] policy notice: OPERATIONS_REQUIRE_PRIMARY=${policy_required} ignored (Policy A fixed: warn + fallback allowed)"
fi

summary="{\"service\":\"StoryVerse\",\"status\":\"${status}\",\"policyMode\":\"${policy_mode}\",\"policyReason\":\"${policy_reason}\",\"primaryRequired\":\"${policy_required}\",\"strictOverrideDetected\":${strict_override_detected},\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}"
echo "$summary"

exit "$code"
