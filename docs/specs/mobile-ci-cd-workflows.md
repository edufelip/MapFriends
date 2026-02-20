# Mobile CI/CD Workflows

## Overview
MapFriends uses GitHub Actions workflows for Android and iOS PR checks, Firebase internal distributions, and store release automation. The workflow set mirrors the structure used in the `finn` project and keeps the same branch model:

- `develop`
- `release/**`
- `hotfix/**`

Release workflows support both automatic branch-triggered execution and manual `workflow_dispatch` runs.

## Workflows

### PR checks
- `.github/workflows/android-pr.yml`
  - Trigger: PRs targeting `develop`
  - Executes Android lint + unit tests + debug APK build
  - Uploads reports and APK artifact
- `.github/workflows/ios-pr.yml`
  - Trigger: PRs targeting `develop`, `release/**`, `hotfix/**`
  - Executes JS tests (`npm test`) and simulator build via `xcodebuild`

### Firebase distributions (internal testing)
- `.github/workflows/firebase-distribution-android.yml`
  - Trigger: push to `develop`, PRs to `develop/release/hotfix`, manual dispatch
  - Builds debug APK and uploads to Firebase App Distribution group `mapfriends`
- `.github/workflows/firebase-distribution-ios.yml`
  - Trigger: push to `develop`, PRs to `develop/release/hotfix`, manual dispatch
  - Builds signed dev IPA and uploads to Firebase App Distribution group `mapfriends`

### Store releases
- `.github/workflows/android-release.yml`
  - Trigger: push to `release/**` and `hotfix/**`, manual dispatch
  - Builds signed release AAB
  - Uploads to Google Play internal track as draft
- `.github/workflows/ios-release.yml`
  - Trigger: push to `release/**` and `hotfix/**`, manual dispatch
  - Builds signed Release archive/IPA
  - Uploads IPA to TestFlight

## Required GitHub Secrets

### Shared/env
- `ENV_FILE`
- `ENV_FILE_DEV`

### Android Firebase/Play
- `GOOGLE_SERVICES_JSON_BASE64_DEV`
- `GOOGLE_SERVICES_JSON_BASE64`
- `FIREBASE_APP_ID_ANDROID_DEV`
- `FIREBASE_SERVICE_ACCOUNT_JSON`
- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_ALIAS_PASSWORD`
- `PLAY_SERVICE_ACCOUNT_JSON`
- `MAPBOX_DOWNLOADS_TOKEN`

### iOS Firebase/TestFlight
- `GOOGLE_SERVICE_INFO_PLIST_BASE64_DEV`
- `GOOGLE_SERVICE_INFO_PLIST_BASE64`
- `FIREBASE_APP_ID_IOS_DEV`
- `IOS_ADHOC_KEYCHAIN_PASSWORD`
- `IOS_ADHOC_PROFILE_NAME`
- `IOS_ADHOC_CERT_P12_BASE64`
- `IOS_ADHOC_CERT_PASSWORD`
- `IOS_ADHOC_PROFILE_BASE64`
- `IOS_KEYCHAIN_PASSWORD`
- `IOS_PROFILE_NAME`
- `IOS_PROFILE_BASE64`
- `IOS_DIST_CERT_P12_BASE64`
- `IOS_DIST_CERT_PASSWORD`
- `IOS_TEAM_ID`
- `APP_STORE_CONNECT_API_KEY_ID`
- `APP_STORE_CONNECT_API_KEY_ISSUER_ID`
- `APP_STORE_CONNECT_API_KEY_CONTENT`

## Build Numbering
- Android workflows set `CI_VERSION_CODE` to `${{ github.run_number }}`.
- iOS workflows set `CFBundleVersion` to `${{ github.run_number }}` before archive/export steps.

## Notes
- Firebase tester group is `mapfriends` for both platforms.
- Branch filters intentionally follow the `finn` model to keep release management consistent.
- Because native folders are git-ignored in this repository, workflows generate `android/` or `ios/` with `npx expo prebuild --non-interactive --no-install` when missing.
- Android workflows run `scripts/ci/ensure_mapbox_maven_android.sh` to inject Mapbox Maven auth in CI builds.
- Android CI workflows force `ORG_GRADLE_PROJECT_newArchEnabled=false` to avoid current RN 0.81 + react-native-screens C++ new-architecture build breakage in CI.

- iOS distribution/release workflows validate decoded .p12 files with OpenSSL before keychain import and fail early with explicit certificate/password mismatch errors.

- Android Firebase distribution workflow performs a preflight App Distribution API access check and fails with explicit IAM guidance before upload when permissions are missing.

- Android release workflow forces `-Pandroid.enableMinifyInReleaseBuilds=true` so `mapping.txt` is generated for Play Console deobfuscation uploads.

- iOS workflows resolve workspace and app scheme dynamically from the generated iOS project to avoid case-sensitive scheme mismatches in CI (e.g., `mapfriends` vs `MapFriends`).
