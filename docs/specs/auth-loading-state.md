# Auth Loading State and Overlay UX

## Objective
Prevent auth screens from being replaced by a full-screen white loading state during login/signup actions.

## Background
The auth module previously exposed one loading flag for two different concerns:

- App bootstrap/session resolution
- User-triggered auth actions (email login, social login, password reset, sign out)

Because the navigator consumed that same flag, action submits could temporarily replace the current auth screen with a full-screen loader.

## Behavior Contract

### 1) Bootstrap loading (`isBootstrappingAuth`)
- `true` only while auth/session state is being resolved.
- Native splash remains visible while startup gates are unresolved (`fontsReady` + `isBootstrappingAuth`).
- Must not be toggled by button-driven auth operations.

### 2) Auth action loading (`isAuthActionLoading`)
- `true` while a user-triggered auth operation is running.
- Auth screens remain visible and interactive state is disabled as needed.
- UI shows an in-screen overlay with blur + spinner.

## UI Requirements
- Login and signup screens render `AuthLoadingOverlay` when `isAuthActionLoading` is `true`.
- Overlay covers the active screen, blurs background content, and shows a centered spinner.
- Overlay blocks touches while visible.
- If blur rendering is limited on a platform, a translucent tint fallback is still shown.
- On app launch, the native splash remains visible until fonts and auth bootstrap are ready, avoiding a brief in-app loading screen before login.

## Implementation Notes
- `useAuth()` exposes:
  - `isBootstrappingAuth`
  - `isAuthActionLoading`
- `App.tsx` gates app mount on startup readiness and controls splash visibility with `expo-splash-screen`.
- Auth action methods toggle only `isAuthActionLoading`.
- `App.tsx` manages native splash visibility using `expo-splash-screen` (`preventAutoHideAsync` + `hideAsync` when startup readiness is met).

## Test Cases
1. App cold start:
- Given auth bootstrap is in progress, native splash remains visible until startup is ready.

2. Login or signup submit:
- Given bootstrap is complete, starting an auth action keeps the current screen visible.
- Overlay blur + spinner appears.
- Buttons are disabled during the action.

3. Auth action completion:
- Overlay disappears after success/failure.
- Screen remains mounted and error/success messaging is shown in place.
