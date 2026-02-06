# Profile Setup Gate

## Summary
Profile Setup is shown after terms acceptance for users without a complete profile. Users can add avatar, display name, handle, bio, and visibility before continuing, or skip and proceed with safe defaults.

## Goals
- Ensure incomplete accounts are prompted to finish profile details.
- Provide a mobile-friendly setup flow with clear validation and accessibility support.
- Allow users to skip and proceed to onboarding if they choose.
- Persist profile data locally for subsequent sessions.

## Non-Goals
- Backend/cloud media upload pipeline.
- Server-side handle availability checks.
- Camera capture flow (gallery picker only for now).

## User Flows
- Login/Signup → Terms → Profile Setup (if incomplete) → Onboarding/Main flow.
- Tap **Continue** with valid inputs → profile is completed and persisted.
- Tap **Skip** → handle + visibility are auto-populated as needed and user proceeds.
- Pick avatar from gallery → preview updates immediately → saved on Continue.

## Data Model / State
- Auth state tracks: `hasCompletedProfile`, `hasSkippedProfileSetup`.
- User profile fields in auth state/storage: `name`, `handle`, `bio`, `visibility`, `avatar`.

## UI/UX Notes
- Sticky header with title and **Skip** action.
- Avatar picker is functional (opens media library).
- Avatar picking is delegated to `src/services/media/avatarPicker.ts` to isolate native module interactions from screen UI.
- Handle validation: lowercase letters, numbers, underscore, 3–20 chars.
- Unsupported handle characters are sanitized with helper feedback.
- Continue button remains disabled until required fields are valid.
- Keyboard behavior supports form completion on mobile (`keyboardShouldPersistTaps` + keyboard avoiding).
- Accessibility labels/states are defined for skip, avatar, visibility options, and continue action.

## Edge Cases
- Skip with empty fields → handle + visibility are auto-populated.
- Handle invalid chars → sanitized input + helper feedback.
- Media permission denied → no avatar update, inline feedback message is shown, user can still continue without avatar.
- Media picker unexpected error → inline feedback message is shown, user can retry or continue without avatar.
- Bio capped to configured maximum length.

## Test Cases
- Manual:
  - Continue disabled until name, handle, and bio are valid.
  - Avatar press opens gallery and selected image is previewed.
  - Continue persists avatar and profile data.
  - Visibility cards show selected state clearly.
  - VoiceOver/TalkBack can identify interactive controls and states.
- Automated:
  - Auth state transitions for `completeProfile` and `skipProfileSetup`.
  - Profile setup screen submits selected avatar in payload.
  - Handle sanitization helper appears when unsupported characters are removed.
  - Avatar permission denied shows localized feedback.
  - Avatar picker error shows localized feedback.
  - Avatar picker cancel leaves feedback hidden.

## Use Cases
- New user completes profile before onboarding.
- Returning user with incomplete profile is prompted again.
- User chooses to skip and complete later.
