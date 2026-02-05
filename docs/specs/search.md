# Search Screen

## Overview
The Search screen replaces the current Explore placeholder and provides a people/places search experience with recent items, trending creators/places, and a guidance callout. It shares the global bottom navigation and highlights the Explore tab.

## Goals
- Provide a visually rich search landing page aligned with MapFriends UI.
- Support quick access to recent people and places.
- Highlight trending creators and premium content.
- Keep the layout modular and theme-aware (light/dark).

## UI Structure
- Sticky header with search input and People/Places segmented tabs.
- People tab:
  - Recent Searches list (clearable).
  - Trending Creators horizontal list with follow CTA and PRO badge.
  - Info callout.
- Places tab:
  - Recent Places list (clearable).
  - Trending Places cards with premium indicator.
  - Info callout.
- Bottom navigation (Home/Explore/Activity/Profile) with Explore active.

## Data & Sources
- Mock data lives in `src/mocks/search.json`.
- Access via `src/services/search.ts`:
  - `getRecentPeople()`, `getTrendingPeople()`
  - `getRecentPlaces()`, `getTrendingPlaces()`

## Localization
Strings are defined in `src/localization/strings.ts` under the `search` namespace for `en-US` and `pt-BR`.

## Test Cases
- People tab shows recents, clears when tapping “Clear All”.
- Places tab shows recents and trending cards.
- Trending creators display PRO badge when `isPro` is true.
- Bottom navigation highlights Explore when on Search.

## Use Cases
- User discovers creators to follow and populate their map.
- User revisits recently viewed people or places quickly.
- User switches between People and Places to browse content.
