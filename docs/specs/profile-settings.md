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

## Data & Behavior
- Visibility is updated from Edit Profile save flow and persisted in auth state.
- The rest of the rows are visual-only placeholders.
- Version label is static.

## Localization
Strings live in `src/localization/strings.ts` under `profile` for `en-US` and `pt-BR`.

## Test Cases
- Screen renders all sections and row labels correctly.
- Bottom nav highlights Profile tab.
- Pressing **Edit Profile** navigates to `EditProfile`.
- Saving on Edit Profile updates `name`, `bio`, and `visibility`, then navigates back.
