# Profile Setup Gate

## Summary
Profile Setup is shown after terms acceptance for users without a complete profile. Users can add avatar, display name, handle, bio, and visibility before continuing.

## Goals
- Ensure incomplete accounts are prompted to finish profile details.
- Provide a mobile-friendly setup flow with clear validation and accessibility support.
- Persist completion state locally and in backend metadata for cross-device gating.

## Non-Goals
- Backend/cloud media upload pipeline.
- Camera capture flow (gallery picker only for now).

## User Flows
- Login/Signup → Terms → Profile Setup (if incomplete) → Onboarding/Main flow.
- Tap **Continue** with valid inputs → handle is atomically claimed, profile is completed and persisted.
- Pick avatar from gallery → preview updates immediately → saved on Continue.

## Data Model / State
- Auth state tracks: `hasCompletedProfile`.
- User profile fields in auth state/storage: `name`, `handle`, `bio`, `visibility`, `avatar`.
- On bootstrap, profile fields are hydrated from both local storage and remote `users/{uid}` (remote values win when present) to keep cross-device state consistent.
- Server metadata in `userMeta/{uid}` tracks:
  - `hasAcceptedTerms`
  - `hasCompletedProfile`
  - `hasCompletedOnboarding`
  - `onboardingVersion`

## UI/UX Notes
- Hero section uses the same auth visual language as login/terms:
  - map badge icon
  - centered title/subtitle
  - top spacing is safe-area aware so the badge does not overlap the iOS status bar
- Avatar picker is functional (opens media library).
- Empty avatar state uses a plain circular surface with camera icon only (no background photo).
- Avatar picking is delegated to `src/services/media/avatarPicker.ts` to isolate native module interactions from screen UI.
- Handle validation: lowercase letters, numbers, underscore, 3–20 chars.
- Handle must be globally unique and non-reserved.
- Handle is immutable after first successful claim.
- Tapping anywhere in the handle row (`@`, input area, validation icon) focuses the handle input to keep keyboard behavior consistent on iOS.
- Unsupported handle characters are sanitized with helper feedback.
- Handle availability is checked with debounce while typing.
- Form content is presented in a bordered card surface, matching auth screen rhythm.
- Bio character counter is displayed live inside the textarea at the bottom-right corner.
- Continue button remains disabled until required fields are valid.
- Keyboard behavior supports form completion on mobile (`keyboardShouldPersistTaps` + keyboard avoiding).
- Accessibility labels/states are defined for avatar, visibility options, and continue action.

## Edge Cases
- Handle invalid chars → sanitized input + helper feedback.
- Handle taken/reserved → Continue remains disabled and inline feedback is shown.
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
  - Auth state transition for `completeProfile`.
  - Profile setup screen submits selected avatar in payload.
  - Handle sanitization helper appears when unsupported characters are removed.
  - Avatar permission denied shows localized feedback.
  - Avatar picker error shows localized feedback.
  - Avatar picker cancel leaves feedback hidden.

## Use Cases
- New user completes profile before onboarding.
- Returning user with incomplete profile is prompted again.
- User signs in on a second device and still sees Profile Setup until remote completion flags are true.
