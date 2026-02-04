# Home Screen (Feed/Map)

## Summary
Create a new Home screen with a top segmented control (Feed/Map) and a bottom navigation bar. The Map tab uses Mapbox as the map layer and overlays UI elements matching the design. The Feed tab renders mocked feed posts.

## Goals
- Provide a map-first home experience with quick tab switching.
- Surface a feed view without leaving the Home screen.
- Offer bottom navigation to key app destinations.

## Non-Goals
- Full-featured map interactions (search, real pins, clustering).
- Persisted feed data or personalization logic.

## User Flows
- Profile Setup → Continue → Home (Map tab default).
- Switch to Feed via top segmented control.
- Use bottom nav to reach Explore, Activity, Profile, or create a new place.

## Data Model / State
- UI-only tab state (`feed` | `map`) local to Home screen.
- Feed cards use mock data in `src/mocks/feed.json` via `src/services/feed.ts`.

## UI/UX Notes
- Map tab uses Mapbox map as background and adapts to light/dark styles.
- Overlays: segmented control, filter chips, location FAB, context card, and bottom nav.
- Bottom nav is always visible on Home.

## Edge Cases
- Missing Mapbox token shows a fallback message.
- Empty feed list renders no cards.

## Test Cases
- Manual:
  - Profile Continue routes to Home (skips onboarding).
  - Map tab shows Mapbox view and overlays.
  - Feed tab shows mocked feed cards.
  - Bottom nav navigates to Explore, Activity, Profile, Share Review.
  - Missing token shows map fallback message.

## Use Cases
- User quickly switches between feed and map.
- User opens bottom nav to reach notifications or profile.

## Open Questions
- Should bottom nav be global across all main screens?
- Should Feed and Map be separate navigators later?
