# Documentation Overview

This folder contains product and engineering documentation for MapFriends. Use it to capture specs, test cases, and use cases for every new feature or behavioral change.

## Structure

Recommended structure (add folders as needed):

- `docs/specs/` — Feature specifications
- `docs/tests/` — Test cases (manual and automated)
- `docs/usecases/` — User scenarios and acceptance flows
- `docs/spec-template.md` — Standard template for new specs

## How to Add a New Spec

1. Copy the template: `docs/spec-template.md`.
2. Save it as `docs/specs/<feature-name>.md` (kebab-case).
3. Fill in all sections, including test cases and use cases.
4. If test cases or use cases are extensive, create:
   - `docs/tests/<feature-name>.md`
   - `docs/usecases/<feature-name>.md`

## Update Policy (Required)

For every feature or significant behavior change:

- Update or add a spec file in `docs/specs/`.
- Add/adjust test cases in `docs/tests/` (or the spec’s Test Cases section).
- Add/adjust use cases in `docs/usecases/` (or the spec’s Use Cases section).

Pull requests should note which docs were updated and link to them.

## Current Specs

- `docs/specs/auth-loading-state.md` — separates bootstrap loading from auth action loading and defines the blurred in-screen auth overlay behavior.
- `docs/specs/app-branding-icons.md` — defines the MapFriends display name and reproducible launcher icon generation from the auth map badge mark.
- `docs/specs/ios-dev-launch-reliability.md` — defines a retry-safe iOS dev-client startup flow and native scheme parity without relying on prebuild.
- `docs/specs/handle-uniqueness.md` — defines transactional handle claiming, reserved handles, and immutable handle policy.
- `docs/specs/profile-setup.md` — documents profile completion gate behavior, avatar selection UX, and related validation rules.
- `docs/specs/profile-settings.md` — defines profile tab settings layout plus Edit Profile navigation and save behavior.
- `docs/specs/main-shell-navigation.md` — defines persistent bottom navigation shell behavior and in-canvas primary tab switching.
- `docs/specs/review-composer.md` — documents review composer flow, including debounced location search and selected-location chip behavior.
