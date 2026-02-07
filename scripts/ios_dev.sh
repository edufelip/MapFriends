#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${EXPO_DEV_SERVER_PORT:-8081}"
SCHEME="${EXPO_PUBLIC_AUTH_SCHEME:-$(node -p "require('${ROOT_DIR}/app.json').expo.scheme")}"
OPENURL_RETRIES="${IOS_OPENURL_RETRIES:-12}"
OPENURL_DELAY_SECONDS="${IOS_OPENURL_DELAY_SECONDS:-2}"
RUN_LOG="${TMPDIR:-/tmp}/mapfriends-ios-dev-run.log"

cd "$ROOT_DIR"

run_ios_dev_command() {
  local run_exit

  : > "$RUN_LOG"
  set +e
  # Keep a TTY for Expo prompts (for example `--device` selection) while still
  # capturing output for timeout fallback detection.
  BUNDLE_ID_SUFFIX=.dev script -q "$RUN_LOG" npx expo run:ios --configuration Debug "$@"
  run_exit=$?
  set -e

  return "$run_exit"
}

open_dev_client_url_with_retry() {
  local url="$1"
  local attempt

  if ! xcrun simctl list devices booted | grep -q "Booted"; then
    echo "==> No booted iOS simulator detected. Skipping simctl openurl retry."
    return 0
  fi

  echo "==> Waiting for Metro on http://127.0.0.1:${PORT}"
  for attempt in $(seq 1 90); do
    if curl -fsS "http://127.0.0.1:${PORT}" >/dev/null 2>&1; then
      break
    fi
    sleep 1
  done

  if ! curl -fsS "http://127.0.0.1:${PORT}" >/dev/null 2>&1; then
    echo "==> Metro did not become reachable on port ${PORT}. Skipping URL open."
    return 0
  fi

  for attempt in $(seq 1 "${OPENURL_RETRIES}"); do
    if xcrun simctl openurl booted "$url" >/dev/null 2>&1; then
      echo "==> Dev client URL opened on simulator (attempt ${attempt}/${OPENURL_RETRIES})."
      return 0
    fi
    echo "==> openurl attempt ${attempt}/${OPENURL_RETRIES} timed out; retrying in ${OPENURL_DELAY_SECONDS}s..."
    sleep "${OPENURL_DELAY_SECONDS}"
  done

  echo "==> Unable to open dev client URL automatically."
  echo "==> Run manually: xcrun simctl openurl booted \"$url\""
  return 0
}

DEV_CLIENT_URL="${SCHEME}://expo-development-client/?url=http://127.0.0.1:${PORT}"

for arg in "$@"; do
  if [[ "$arg" == "-h" || "$arg" == "--help" ]]; then
    BUNDLE_ID_SUFFIX=.dev npx expo run:ios --help
    exit 0
  fi
done

echo "==> Running iOS dev build/install flow"
if run_ios_dev_command "$@"; then
  exit 0
fi

if ! grep -q "simctl openurl" "$RUN_LOG" || ! grep -q "Operation timed out" "$RUN_LOG"; then
  echo "==> iOS run failed for a reason other than openurl timeout. See $RUN_LOG"
  exit 1
fi

echo "==> Detected simulator openurl timeout. Starting fallback launcher..."
open_dev_client_url_with_retry "$DEV_CLIENT_URL" &
OPENURL_PID=$!

echo "==> Starting Metro fallback (dev client / localhost)"
npx expo start --dev-client --localhost --port "$PORT" --scheme "$SCHEME"

wait "$OPENURL_PID" || true
