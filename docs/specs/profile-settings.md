# Profile Settings Screen

## Overview
The Profile tab is a settings-focused screen that surfaces account privacy, creator tools, and preferences. It matches the provided UI reference and uses the global bottom navigation.

## Goals
- Provide a clean, structured settings layout with sections and rows.
- Allow users to toggle profile visibility (open/locked).
- Keep UI modular and theme-aware (light/dark).

## UI Structure
- Sticky header with back button and title.
- Profile hero with avatar, handle, subtitle, and “Edit Profile”.
- Sections:
  - Account Privacy: visibility toggle with subtitle.
  - Creator Hub: Creator Settings, Subscribers Management (badge).
  - Preferences: Manage Subscriptions, Blocked Users.
- Logout button and version label.
- Bottom navigation highlighting Profile.

## Data & Behavior
- Visibility toggle updates `user.visibility` in auth state.
- The rest of the rows are visual-only placeholders.
- Version label is static.

## Localization
Strings live in `src/localization/strings.ts` under `profile` for `en-US` and `pt-BR`.

## Test Cases
- Toggling visibility updates `user.visibility` to `locked` and `open`.
- Screen renders all sections and row labels correctly.
- Bottom nav highlights Profile tab.
