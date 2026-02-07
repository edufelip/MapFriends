# MapFriends

## Firebase Auth Setup

Create a `.env` file based on `.env.example` and fill in your Firebase values.

Required keys for auth:

- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`
- `EXPO_PUBLIC_FIREBASE_GOOGLE_WEB_CLIENT_ID`
- `EXPO_PUBLIC_FIREBASE_GOOGLE_IOS_CLIENT_ID_DEV`
- `EXPO_PUBLIC_FIREBASE_GOOGLE_IOS_CLIENT_ID_PROD`
- `EXPO_PUBLIC_FIREBASE_GOOGLE_ANDROID_CLIENT_ID_DEV`
- `EXPO_PUBLIC_FIREBASE_GOOGLE_ANDROID_CLIENT_ID_PROD`
- `EXPO_PUBLIC_AUTH_SCHEME` (defaults to `com.eduardo880.mapfriends`)

Optional legacy fallback keys:

- `EXPO_PUBLIC_FIREBASE_GOOGLE_IOS_CLIENT_ID`
- `EXPO_PUBLIC_FIREBASE_GOOGLE_ANDROID_CLIENT_ID`

Runtime behavior:

- Builds running as `*.dev` use `*_DEV` IDs.
- Non-dev builds use `*_PROD` IDs.
- If an env-specific key is missing, the app falls back to the legacy key.

Notes:

- iOS Apple Sign In requires Apple capability enabled for the app id.
- Android Google Sign In requires OAuth client setup (including SHA fingerprints) in Firebase Console.

## Firestore Rules Deploy

- Deploy Firestore rules with: `yarn firebase`
- Requires Firebase CLI authentication (`firebase login`) and project selection (`firebase use <project-id>`).
