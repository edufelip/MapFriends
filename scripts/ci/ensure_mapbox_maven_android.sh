#!/usr/bin/env bash

set -euo pipefail

if [ -z "${MAPBOX_DOWNLOADS_TOKEN:-}" ]; then
  echo "MAPBOX_DOWNLOADS_TOKEN is required" >&2
  exit 1
fi

BUILD_FILE="android/build.gradle"
GRADLE_PROPERTIES_FILE="android/gradle.properties"

if [ ! -f "$BUILD_FILE" ]; then
  echo "Expected $BUILD_FILE to exist before Mapbox setup" >&2
  exit 1
fi

touch "$GRADLE_PROPERTIES_FILE"

TMP_FILE=$(mktemp)
grep -v '^MAPBOX_DOWNLOADS_TOKEN=' "$GRADLE_PROPERTIES_FILE" > "$TMP_FILE" || true
printf 'MAPBOX_DOWNLOADS_TOKEN=%s\n' "$MAPBOX_DOWNLOADS_TOKEN" >> "$TMP_FILE"
mv "$TMP_FILE" "$GRADLE_PROPERTIES_FILE"

if ! grep -q "api.mapbox.com/downloads/v2/releases/maven" "$BUILD_FILE"; then
  cat >> "$BUILD_FILE" <<'GRADLE_EOF'

allprojects {
  repositories {
    maven {
      url 'https://api.mapbox.com/downloads/v2/releases/maven'
      authentication {
        basic(org.gradle.authentication.http.BasicAuthentication)
      }
      credentials {
        username = "mapbox"
        password = project.findProperty("MAPBOX_DOWNLOADS_TOKEN") ?: System.getenv("MAPBOX_DOWNLOADS_TOKEN") ?: ""
      }
    }
  }
}
GRADLE_EOF
fi

echo "Mapbox Maven auth prepared for Android build"
