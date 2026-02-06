#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${FIREBASE_PROJECT_ID:-${NEXT_PUBLIC_FIREBASE_PROJECT_ID:-}}"
API_KEY="${FIREBASE_API_KEY:-${NEXT_PUBLIC_FIREBASE_API_KEY:-}}"
SHARED_PATH="${FIREBASE_SHARED_PATH:-${NEXT_PUBLIC_FIREBASE_SHARED_PATH:-shared/goals-app}}"

if [[ -z "${PROJECT_ID}" ]]; then
  echo "Missing FIREBASE_PROJECT_ID (or NEXT_PUBLIC_FIREBASE_PROJECT_ID)." >&2
  exit 1
fi

if [[ -z "${API_KEY}" ]]; then
  echo "Missing FIREBASE_API_KEY (or NEXT_PUBLIC_FIREBASE_API_KEY)." >&2
  exit 1
fi

SEGMENT_COUNT=$(awk -F/ '{print NF}' <<< "${SHARED_PATH}")
if (( SEGMENT_COUNT < 2 || SEGMENT_COUNT % 2 != 0 )); then
  echo "FIREBASE_SHARED_PATH must be a document path like shared/goals-app." >&2
  exit 1
fi

BASE_URL="https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents"
TEST_ID="smoke-$(date +%s)-$RANDOM"
TEST_TITLE="Smoke goal ${TEST_ID}"
DOC_URL="${BASE_URL}/${SHARED_PATH}/goals/${TEST_ID}?key=${API_KEY}"
NOW_ISO="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

WRITE_PAYLOAD=$(cat <<JSON
{
  "fields": {
    "title": {"stringValue": "${TEST_TITLE}"},
    "subtitle": {"stringValue": "Firestore curl smoke test"},
    "icon": {"stringValue": "book"},
    "currentValue": {"integerValue": "0"},
    "targetValue": {"integerValue": "10"},
    "unit": {"stringValue": "pts"},
    "category": {"stringValue": "daily"},
    "color": {"stringValue": "emerald"},
    "incrementAmount": {"integerValue": "1"},
    "periodStart": {"timestampValue": "${NOW_ISO}"},
    "periodEnd": {"timestampValue": "${NOW_ISO}"},
    "lastResetAt": {"timestampValue": "${NOW_ISO}"},
    "createdAt": {"timestampValue": "${NOW_ISO}"},
    "updatedAt": {"timestampValue": "${NOW_ISO}"}
  }
}
JSON
)

echo "Writing Firestore smoke test goal: ${TEST_ID}"
WRITE_RESPONSE="$(
  curl -sS -X PATCH \
    -H "Content-Type: application/json" \
    --data "${WRITE_PAYLOAD}" \
    "${DOC_URL}"
)"

if grep -q '"error"' <<< "${WRITE_RESPONSE}"; then
  echo "Write failed:" >&2
  echo "${WRITE_RESPONSE}" >&2
  exit 1
fi

echo "Reading Firestore smoke test goal: ${TEST_ID}"
READ_RESPONSE="$(curl -sS "${DOC_URL}")"

if grep -q '"error"' <<< "${READ_RESPONSE}"; then
  echo "Read failed:" >&2
  echo "${READ_RESPONSE}" >&2
  exit 1
fi

if ! grep -q "${TEST_ID}" <<< "${READ_RESPONSE}" || ! grep -q "${TEST_TITLE}" <<< "${READ_RESPONSE}"; then
  echo "Smoke test verification failed. Response did not include expected goal id/title." >&2
  echo "${READ_RESPONSE}" >&2
  exit 1
fi

echo "Cleaning up smoke test goal: ${TEST_ID}"
DELETE_RESPONSE="$(curl -sS -X DELETE "${DOC_URL}")"
if grep -q '"error"' <<< "${DELETE_RESPONSE}"; then
  echo "Cleanup failed:" >&2
  echo "${DELETE_RESPONSE}" >&2
  exit 1
fi

echo "Firestore smoke test passed for project ${PROJECT_ID}."
