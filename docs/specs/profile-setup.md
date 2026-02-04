# Profile Setup Gate

## Summary
Add a profile completion step after Terms acceptance. Users must enter display name, handle, bio, and visibility before continuing, or they may skip. This screen uses the same visual language as auth screens and stores profile data in auth state for the current session.

## Goals
- Ensure incomplete accounts are prompted to finish profile details.
- Provide a clean, mobile-friendly setup flow with validation.
- Allow users to skip and proceed to onboarding if they choose.

## Non-Goals
- Persisting data to a backend or local storage.
- Real avatar upload (placeholder only).
- Handle availability checks against a server.

## User Flows
- Login/Signup → Terms → Profile Setup (if incomplete) → Onboarding.
- Tap **Continue** with valid inputs → Profile marked complete → Onboarding.
- Tap **Skip** → Handle + visibility are auto-populated → Onboarding.
- Logout resets profile completion status.

## Data Model / State
- Auth state adds `hasCompletedProfile` and `hasSkippedProfileSetup`.
- Profile data stored in `user`: `name`, `handle`, `bio`, `visibility`.

## UI/UX Notes
- Sticky header with back arrow (no-op) and **Skip** action.
- Avatar placeholder with edit badge (visual only).
- Handle validation: lowercase letters, numbers, underscore, 3–20 chars.
- Continue button disabled until required fields are valid.

## Edge Cases
- User hits Skip with empty fields → handle + visibility are auto-populated → proceeds.
- Skip generates a handle from name or a fallback based on user id.
- Handle with invalid characters → sanitized and error shown.
- Bio exceeds max length → constrained to 150 characters.

## Test Cases
- Manual:
  - Login → Terms → Profile Setup is shown.
  - Continue disabled until name, handle, bio are valid.
  - Invalid handle shows error and does not enable Continue.
  - Skip allows navigation to onboarding and sets handle + visibility.
  - Completing profile updates `user` and passes gate.
  - Sign out resets profile completion and skip flags.
- Automated (future):
  - Reducer/auth state transitions for `completeProfile` and `skipProfileSetup`.

## Use Cases
- New user completes profile before onboarding.
- Returning user with incomplete profile is prompted again.
- User chooses to skip and complete later.

## Open Questions
- Should profile data persist between sessions?
- Should Skip trigger a future reminder?
