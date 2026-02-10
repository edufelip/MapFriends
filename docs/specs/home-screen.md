# Home Screen (Feed/Map)

## Summary
Create a Home screen with a top segmented control (Feed/Map) and a bottom navigation bar. The Map tab uses Mapbox as the map layer and overlays UI elements matching the design. The Feed tab renders seeded posts plus persisted reviews from centralized state.

## Goals
- Provide a map-first home experience with quick tab switching.
- Surface a feed view without leaving the Home screen.
- Offer bottom navigation to key app destinations.
- Reflect successful review submissions immediately in both Feed and Map.

## Non-Goals
- Full-featured map interactions (clustering, advanced filtering, turn-by-turn map interactions).
- Full social ranking/personalization logic.

## User Flows
- Profile Setup → Continue → Home (Map tab default).
- On Home load, app requests location access with an explanatory prompt so nearby and personalized content can be shown.
- Switch to Feed via top segmented control.
- Use bottom nav to reach Explore, Activity, Profile, or create a new place.

## Data Model / State
- UI-only tab state (`feed` | `map`) local to Home screen.
- Optional user coordinate state (`[longitude, latitude] | null`) to center the map camera when permission is granted.
- Location permission flow uses a strategy adapter (`LocationPermissionStrategy`) selected by platform factory, so platform-specific behavior can be extended without modifying `MapHomeScreen`.
- Centralized review state uses Zustand (`src/state/reviews/`) and hydrates recent persisted reviews.
- Feed list composes `review feed posts` (from Zustand) + seeded posts (`src/mocks/feed.json`).
- Map custom review pins are derived from persisted review coordinates (`placeCoordinates`) and rendered from centralized state.

## UI/UX Notes
- Map tab uses Mapbox map as background and adapts to light/dark styles.
- Map camera focuses on user location after location permission is granted (or if it was already granted).
- Camera uses non-animated initial settings so first paint starts directly at the resolved user coordinate.
- User location is rendered as a static map pin (`ShapeSource` + `CircleLayer`) at the captured coordinate; map pan/zoom does not move this pin.
- Review pins (everyone's reviews) are rendered as custom map circles from centralized review state after hydration.
- A single segmented control (`Feed` | `Map`) is rendered once at Home shell level (fixed near top) and remains visible while switching tabs.
- Segmented control selection uses a sliding animated indicator.
- Tab content transition uses a pure opacity crossfade (`260ms`) between map and feed layers.
- Map filter chips were removed from the map overlay.
- Overlays: segmented control, location FAB, context card, and a persistent bottom nav shell.
- Bottom nav is always visible on Home.
- In shell mode, bottom nav background transitions to solid white when Home `Feed` is active, and returns to glass for Home `Map`.

## Edge Cases
- Missing Mapbox token shows a fallback message.
- While map layout/location are still resolving (and token exists), a loading indicator is shown instead of token-missing fallback copy.
- User declines location prompt or OS permission: keep default map center and continue with non-location experience.
- Empty feed list renders no cards.
- Reviews without coordinates are ignored for map pin rendering (they still appear in feed).

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
  - After successful review submission, returning to Home shows the review immediately in Feed and as a Map pin.

## Use Cases
- User quickly switches between feed and map.
- User opens bottom nav to reach notifications or profile.

## Open Questions
- Should bottom nav be global across all main screens?
- Should Feed and Map be separate navigators later?
