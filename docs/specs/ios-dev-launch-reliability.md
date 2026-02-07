# iOS Dev Launch Reliability

## Objective
Prevent intermittent `simctl openurl` timeout failures during `ios:dev` runs while keeping a one-command developer flow.

## Background
`expo run:ios` can succeed in build/install and still exit with code `60` when the simulator is slow to accept the dev-client deep link immediately after launch.

## Behavior Contract

### 1) Build/install step
- `npm run ios:dev` builds and installs the Debug dev variant with:
  - `BUNDLE_ID_SUFFIX=.dev`
  - `expo run:ios --configuration Debug`
  - Execution inside a pseudo-terminal so Expo prompts stay interactive (for example `--device` selector).
- Output is also captured to a temporary log file for fallback timeout detection.

### 2) Dev server startup
- `ios:dev` starts Metro with:
  - `expo start --dev-client --localhost --scheme <auth scheme>`
- Localhost host mode is used for simulator stability.

### 3) Automatic deep-link retry
- After Metro is reachable on port `8081`, `ios:dev` retries:
  - `xcrun simctl openurl booted "<scheme>://expo-development-client/?url=http://127.0.0.1:8081"`
- Retries default to 12 attempts with 2-second delay (`IOS_OPENURL_RETRIES`, `IOS_OPENURL_DELAY_SECONDS`).
- If retries still fail, command remains usable and prints the exact manual recovery command.

### 4) Native scheme consistency (no prebuild workflow)
- Android `MainActivity` includes a deep-link intent filter for `com.eduardo880.mapfriends`.
- iOS `Info.plist` already declares the same scheme.
- This removes scheme mismatch warnings when starting the dev client.

## Implementation Notes
- Script entrypoint: `scripts/ios_dev.sh`
- Package mapping: `package.json` `ios:dev` -> `./scripts/ios_dev.sh`
- Port can be overridden with `EXPO_DEV_SERVER_PORT`.

## Test Cases
1. `npm run ios:dev` on a cold simulator:
- Build/install completes.
- Metro starts.
- Dev client URL opens automatically without exiting on first timeout.

2. Slow simulator startup:
- At least one retry message appears.
- App still connects once simulator becomes responsive.

3. Deep-link failure path:
- Command prints manual `xcrun simctl openurl` fallback command.
- Metro remains available for manual recovery.

4. Scheme parity:
- No warning about missing shared URI scheme between native iOS and Android directories during `expo start`.
