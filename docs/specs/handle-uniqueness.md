# Handle Uniqueness and Immutability

## Objective
Guarantee globally unique user handles in production, block reserved handles, and keep handles immutable after first successful claim.

## Data Model
- `handles/{handle}`
  - `uid`: owner user id
  - `createdAt`: server timestamp
- `users/{uid}`
  - profile data (`name`, `handle`, `bio`, `visibility`, `avatar`)
  - `updatedAt`: server timestamp
- `userMeta/{uid}`
  - onboarding gate flags (`hasAcceptedTerms`, `hasCompletedProfile`, `hasCompletedOnboarding`)
  - `onboardingVersion`
  - `updatedAt`: server timestamp

## Rules
- Handle format: lowercase letters, numbers, underscore, 3–20 chars.
- Reserved handles are rejected (e.g., `admin`, `support`, `root`, `mapfriends`, and reserved prefixes).
- Handle claim is atomic through Firestore transaction.
- Existing claimed handle cannot be changed (immutable policy).

## UX Contract
- Profile setup checks availability while the user types (debounced).
- Continue is disabled while checking availability or when handle is reserved/taken.
- Submit always validates with transaction (server source of truth).
- On conflict, user sees a clear localized error and remains on profile setup.

## Security Contract
- Firestore rules in `firestore.rules` enforce:
  - only authenticated owner writes `users/{uid}`
  - only authenticated owner reads/writes `userMeta/{uid}`
  - handle doc can only be created once
  - reserved handles are blocked in backend rules
  - `users/{uid}.handle` is immutable after first write
  - handle updates are blocked
  - handle/user/userMeta deletes are allowed only for the owning authenticated user (used by account deletion flow)
