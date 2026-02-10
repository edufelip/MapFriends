# Review Composer

## Overview
The Review Composer lets users create a new review from the middle action in the bottom navigation. It follows the provided visual reference and keeps behavior lightweight.

## Goals
- Provide a focused, premium-feeling review UI.
- Allow users to set rating, write notes, add photos, and pick visibility.
- Keep state local and mock-driven.

## UI Structure
- Minimal top-left back button (no top toolbar).
- Location picker area:
  - Search input for businesses/restaurants/places.
  - Debounced suggestions list while typing.
  - Selected location chip with trailing `x` to clear and re-pick.
- Rating slider (1–10) with live score.
- Large review text area in a rounded surface card, with a bottom-right character counter.
- Photo strip with add tile and no pre-seeded mock images.
- Visibility selector with Followers/Subscribers options and helper copy.

## Behavior
- Back button returns to the previous screen.
- Post creates a review via `createReview()` and returns.
- Location search is debounced (~280ms) and uses Mapbox Search Box Suggest (`/search/searchbox/v1/suggest`) for POI/business hints.
- If Mapbox token/network is unavailable, search gracefully falls back to local mock place filtering.
- Selecting a suggestion transitions input -> chip.
- Clearing chip transitions chip -> input and allows selecting another place.
- Rating slider updates numeric value and fill.
- Review notes are capped at 400 characters.
- Photos are local-only (selectable from library and removable), with no default seeded photos.
- Visibility is local-only (not persisted).

## Localization
Strings are defined under `reviewComposer` in `src/localization/strings.ts` for `en-US` and `pt-BR`.

## Test Cases
- Posting creates a review with rating and timestamps.
- Back action navigates back without creating a review.
- Slider updates rating state.
- Removing a photo updates the strip.
- Notes counter updates and input is capped at 400 characters.
- Tapping photo add tile opens media picker and appends selected photos up to 10 max.
- Typing in location input triggers debounced suggestions.
- Selecting a suggestion shows selected chip; removing chip restores search state.
- Mapbox search result mapping and local fallback are covered by service-level tests.
