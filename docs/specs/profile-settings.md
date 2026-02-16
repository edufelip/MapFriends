# Profile Settings Screen

## Overview
The Profile tab is a settings-focused screen that surfaces account privacy, creator tools, and preferences. It matches the provided UI reference and uses the global bottom navigation.

## Goals
- Provide a clean, structured settings layout with sections and rows.
- Allow users to toggle profile visibility (open/locked).
- Keep UI modular and theme-aware (light/dark).

## UI Structure
- Sticky header with back button and title.
- Profile hero with avatar, handle, user bio as subtitle, and “Edit Profile”.
- Sections:
  - Creator Hub: Creator Settings, Subscribers Management (badge).
  - Preferences: Manage Subscriptions, Blocked Users.
- Logout button and version label.
- Bottom navigation highlighting Profile.

## Edit Profile Flow
- Tapping **Edit Profile** opens a dedicated `EditProfile` screen (stack push).
- Edit Profile screen includes:
  - Avatar selector (library picker).
  - Editable display name and bio.
  - Read-only handle field.
  - Profile visibility selector (Open/Locked).
  - Save action that persists profile changes and returns to Profile tab.
- Save updates local auth state/profile storage and attempts remote sync to Firestore `users/{uid}`.
- Delete Account requires typed email confirmation in the bottom sheet, then:
  - clears `userMeta/{uid}`, `users/{uid}`, and `handles/{handle}` (if present) while user is authenticated.
  - deletes Firebase Auth user.
  - clears local auth/profile storage and returns to login stack.

## Data & Behavior
- Visibility is updated from Edit Profile save flow and persisted in auth state.
- Most rows remain visual-only placeholders. **Manage Subscriptions** now opens a dedicated placeholder screen and **Blocked Users** opens a management flow.
- Version label is resolved at runtime from native app metadata (version / build) with localized template formatting.
- Favorites is the first profile section tab and opens by default; Settings is the second tab.
- Switching between Favorites and Settings uses a smooth horizontal/opacity transition for content and an animated active-tab indicator.
- Settings screen exposes a dedicated logout button that asks for confirmation before calling `signOut`.
- Confirming logout pushes `AuthLogin` with a right-to-left transition and then completes auth sign-out.
- Blocked Users row opens a dedicated `BlockedUsers` screen with loading, empty, error, and list states.
- Unblock action requires confirmation, updates UI optimistically, and refreshes following/reviews caches after success.

## Localization
Strings live in `src/localization/strings.ts` under `profile` for `en-US` and `pt-BR`.

## Test Cases
- Screen renders all sections and row labels correctly.
- Bottom nav highlights Profile tab.
- Pressing **Edit Profile** navigates to `EditProfile`.
- Saving on Edit Profile updates `name`, `bio`, and `visibility`, then navigates back.
- Pressing **Manage My Subscriptions** in Profile settings navigates to `ManageSubscriptions` placeholder screen.
- Pressing **Blocked Users** in Profile settings navigates to `BlockedUsers`.
- Unblocking a user requires confirmation and removes the user from the blocked list.
