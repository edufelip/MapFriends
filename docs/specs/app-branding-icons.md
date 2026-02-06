# App Branding and Launcher Icons

## Summary
MapFriends app branding uses:

- display label: `MapFriends`
- launcher icon family generated from the same visual mark used in auth login (`MaterialIcons` `map` on `#135bec` badge)

## Scope
This spec covers user-facing name and icon assets only.

- Included: app display name and icon image files for iOS/Android/Web.
- Excluded: bundle identifiers, package names, slug, or deep-link scheme changes.

## Source of Truth
- Login visual mark reference: `src/screens/Auth/LoginScreen.tsx`
  - badge color: `#135bec`
  - glyph: `MaterialIcons` `map`
- Icon generation script: `scripts/generate_app_icons.py`

## Generated Assets
The script regenerates:

- `assets/icon.png` (1024x1024)
- `assets/adaptive-icon.png` (1024x1024, transparent background for adaptive foreground)
- `assets/favicon.png` (48x48)

## Configuration
`app.json` values:

- `expo.name`: `MapFriends`
- `expo.icon`: `./assets/icon.png`
- `expo.android.adaptiveIcon.foregroundImage`: `./assets/adaptive-icon.png`
- `expo.web.favicon`: `./assets/favicon.png`

## Regeneration Procedure
Install Python tooling once:

```bash
npm run setup:python-tools
```

Run:

```bash
npm run generate:icons
```

Because this repository does not rely on prebuild workflows day-to-day, also sync native icon modules directly:

```bash
npm run sync:native-icons
```

Then rebuild native apps so launchers pick up icon updates.

## Splash Sync (Native)
To keep native splash logo aligned with the app logo (without prebuild), run:

```bash
npm run sync:native-splash
```

This updates:
- `assets/splash-icon.png`
- `ios/mapfriends/Images.xcassets/SplashScreenLegacy.imageset/image*.png`
- `android/app/src/main/res/drawable-*/splashscreen_logo.png`

## Validation
- Confirm `npx expo config --json` resolves icon paths.
- Verify iOS and Android launcher icon and label visually.
