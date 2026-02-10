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
- On Home load, app requests location access with an explanatory prompt so nearby and personalized content can be shown.
- Switch to Feed via top segmented control.
- Use bottom nav to reach Explore, Activity, Profile, or create a new place.

## Data Model / State
- UI-only tab state (`feed` | `map`) local to Home screen.
- Optional user coordinate state (`[longitude, latitude] | null`) to center the map camera when permission is granted.
- Feed cards use mock data in `src/mocks/feed.json` via `src/services/feed.ts`.

## UI/UX Notes
- Map tab uses Mapbox map as background and adapts to light/dark styles.
- Map camera focuses on user location after location permission is granted (or if it was already granted).
- User location is rendered as a static map pin (`ShapeSource` + `CircleLayer`) at the captured coordinate; map pan/zoom does not move this pin.
- A single segmented control (`Feed` | `Map`) is rendered once at Home shell level (fixed near top) and remains visible while switching tabs.
- Segmented control selection uses a sliding animated indicator.
- Tab content transition uses a pure opacity crossfade (`260ms`) between map and feed layers.
- Map filter chips were removed from the map overlay.
- Overlays: segmented control, location FAB, context card, and a persistent bottom nav shell.
- Bottom nav is always visible on Home.
- In shell mode, bottom nav background transitions to solid white when Home `Feed` is active, and returns to glass for Home `Map`.

## Edge Cases
- Missing Mapbox token shows a fallback message.
- User declines location prompt or OS permission: keep default map center and continue with non-location experience.
- Empty feed list renders no cards.

## Test Cases
- Manual:
  - Profile Continue routes to Home (skips onboarding).
  - Entering Home shows location explanation prompt.
  - Granting location permission centers map on the current user location.
  - If location permission was already granted, map centers on current user location without blocking flow.
  - Denying location keeps map at default center and app remains usable.
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
