# Review Composer

## Overview
The Review Composer lets users create and edit reviews from the middle action in the bottom navigation (or from review cards in place details). It now persists to Firebase Storage + Firestore with rollback protections.

## Goals
- Provide a focused, premium-feeling review UI.
- Allow users to set location, rating, notes, photos, and visibility.
- Enforce submit validation before posting.
- Keep review data consistent across top-level review docs and user projections.

## UI Structure
- Minimal top row with back button (left) and submit button (right).
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
- Submit button is disabled until:
  - a location/place is selected
  - review text is non-empty (`trim().length > 0`)
- Submit supports two modes:
  - Create mode: creates a new review.
  - Edit mode: updates an existing owned review.
- On successful submit, user returns to previous screen.
- Review appears in Feed and Map only after successful persistence (no optimistic insert).
- Location search is debounced (~280ms) and uses Mapbox Search Box Suggest (`/search/searchbox/v1/suggest`) for POI/business hints.
- If Mapbox token/network is unavailable, search gracefully falls back to local mock place filtering.
- Selecting a suggestion transitions input -> chip.
- Clearing chip transitions chip -> input and allows selecting another place.
- Rating slider updates numeric value and fill.
- Review notes are capped at 400 characters.
- Photos are optional (0..10).
- New photos are compressed before upload and then sent to Firebase Storage.
- Native iOS/Android uploads use `@react-native-firebase/storage` (`putFile`) for reliability; web keeps Firebase JS SDK fallback.
- If any write step fails after upload, uploaded files from that attempt are deleted (rollback).
- While submitting, composer shows live progress states for compressing, uploading, and final save.
- Long-running photo stages have timeout guards; timeout failures show a specific retry message instead of a generic error.
- Visibility is persisted.
- On submit, if selected place coordinates are missing, app resolves coordinates before persistence.
- If coordinate resolution fails, submit is blocked and user is asked to pick another location.

## Persistence Model
- Firestore source of truth:
  - `reviews/{reviewId}`
- Firestore projection (denormalized for user-scoped reads):
  - `userReviews/{uid}/items/{reviewId}`
- Storage paths for review photos:
  - `reviews/{uid}/{reviewId}/photo-<timestamp>-<index>.jpg`
- Each review persists `placeCoordinates` (when available) so map pins can be rendered from persisted data.
- Coordinate backfill script exists for historical records with `placeCoordinates: null`:
  - `scripts/backfill_review_coordinates.js`
- Backfill script also supports a repair mode (`--repair`) to recompute coordinates from `placeId`
  when prior fallback geocoding stored inaccurate coordinates.
- Review writes use a Firestore batch to keep `reviews` and `userReviews` in sync atomically.
- Review updates:
  - keep retained photos
  - upload new photos
  - remove discarded photos from storage after successful doc update
- Review delete:
  - delete both Firestore docs atomically
  - then remove storage files best effort

## Localization
Strings are defined under `reviewComposer` in `src/localization/strings.ts` for `en-US` and `pt-BR`.

## Test Cases
- Submit remains disabled until required fields are valid.
- Valid submit calls create path and navigates back.
- Location picker debounce/select/clear flow.
- Notes counter and max-length enforcement.
- Photo add flow and max 10 cap.
- Review mutation service:
  - create uploads photos + writes doc pair
  - rollback deletes uploaded photos when write fails
  - update keeps retained photos and deletes removed assets
  - delete removes doc pair and cleans storage assets
- Coordinate resolution:
  - submit path resolves missing coordinates before create/update
  - unresolved coordinates block submit with user feedback
