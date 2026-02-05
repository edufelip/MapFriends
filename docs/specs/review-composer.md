# Review Composer

## Overview
The Review Composer lets users create a new review from the middle action in the bottom navigation. It follows the provided visual reference and keeps behavior lightweight.

## Goals
- Provide a focused, premium-feeling review UI.
- Allow users to set rating, write notes, add photos, and pick visibility.
- Keep state local and mock-driven.

## UI Structure
- Sticky header with Cancel and Post actions.
- Location chip showing the selected place.
- Rating slider (1–10) with live score.
- Large review text area.
- Photo strip with add tile and mock images.
- Visibility selector with Followers/Subscribers options and helper copy.

## Behavior
- Cancel returns to the previous screen.
- Post creates a review via `createReview()` and returns.
- Rating slider updates numeric value and fill.
- Photos are local-only (mock images, removable).
- Visibility is local-only (not persisted).

## Localization
Strings are defined under `reviewComposer` in `src/localization/strings.ts` for `en-US` and `pt-BR`.

## Test Cases
- Posting creates a review with rating and timestamps.
- Cancel navigates back without creating a review.
- Slider updates rating state.
- Removing a photo updates the strip.
