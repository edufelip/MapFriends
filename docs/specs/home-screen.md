# Home Screen (Feed/Map)

## Summary
Create a Home screen with a top segmented control (Feed/Map) and a bottom navigation bar. The Map tab uses Mapbox as the map layer and overlays UI elements matching the design. The Feed tab renders persisted reviews from centralized state.

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
- Review store now includes per-review detail fetch metadata and a cached detail read API (`fetchReviewByIdCached`) with a default 120s freshness window.
- Review hydration uses a short freshness window (2 minutes) to avoid redundant Firebase fetches during rapid tab switches and short returns to Home.
- Feed list is built from review feed view models derived from centralized review state.
- Map custom review pins are derived from persisted review coordinates (`placeCoordinates`) and rendered from centralized state.

## UI/UX Notes
- Map tab uses Mapbox map as background and adapts to light/dark styles.
- Map camera focuses on user location after location permission is granted (or if it was already granted).
- Camera uses non-animated initial settings so first paint starts directly at the resolved user coordinate.
- When review pins are available, map camera auto-fits bounds to include all fetched review pins plus current user location.
- Pull-to-refresh in Feed triggers review refresh and then re-applies map fit bounds automatically.
- User location is rendered as a static map pin (`ShapeSource` + `CircleLayer`) at the captured coordinate; map pan/zoom does not move this pin.
- `my-location` FAB recenters camera to the user coordinate (zoom 14).
- Review pins (everyone's reviews) are rendered as larger red drop-style custom markers from centralized review state after hydration, using a `react-native-svg` marker component (Path + perfect-circle center).
- Feed supports swipe-to-refresh (pull down) to fetch latest persisted reviews from centralized review state.
- When feed has no posts, show a poetic, minimalist empty state with a single CTA to create the first review.
- Feed cards use persisted review media only (author avatar and first uploaded review photo); missing media renders no avatar/hero image.
- Feed card body text is shown as-is (no inline "more" suffix).
- A single segmented control (`Feed` | `Map`) is rendered once at Home shell level (fixed near top) and remains visible while switching tabs.
- Segmented control selection uses a sliding animated indicator.
- Tab content transition uses a pure opacity crossfade (`260ms`) between map and feed layers.
- Map filter chips were removed from the map overlay.
- Overlays: segmented control, location FAB, selection-based review context card, and a persistent bottom nav shell.
- Review context card is hidden by default and appears only after tapping a review pin.
- Review context card close action is an `X` button at the top-right of the card.
- Tapping the review context card body opens `ReviewDetail` for the selected review.
- `ReviewDetail` uses a full-page immersive layout with hero gallery, reviewer metadata, place/location block, and long-form experience text.
- `ReviewDetail` top-right `more_horiz` action is shown only to the review owner and opens owner actions (`Edit`, `Delete`).
- `ReviewDetail` sticky bottom actions include `Save to favorites` (persistent) and `Share`.
- `ReviewDetail` prefetches its gallery image URLs once on detail load and renders hero media with `force-cache` to reduce warm re-open latency.
- `Save to favorites` persists per-user favorites in Firestore under `userFavorites/{uid}/items/{reviewId}`.
- Profile screen now includes a `Favorites` tab that lists saved reviews and allows quick unsave.
- Review context card visibility transitions use smooth fade/slide animations.
- Bottom nav is always visible on Home.
- In shell mode, bottom nav background transitions to solid white when Home `Feed` is active, and returns to glass for Home `Map`.
- Main-shell tab panels are kept alive after first visit; returning to Home preserves feed list/render tree instead of remounting it.

## Edge Cases
- Missing Mapbox token shows a fallback message.
- While map layout/location are still resolving (and token exists), a loading indicator is shown instead of token-missing fallback copy.
- User declines location prompt or OS permission: keep default map center and continue with non-location experience.
- Empty feed list renders a premium empty state card and one CTA (`Share your first review`).
- Reviews without coordinates are ignored for map pin rendering (they still appear in feed).

## Test Cases
- Manual:
  - Profile Continue routes to Home (skips onboarding).
  - Entering Home shows location explanation prompt.
  - Granting location permission centers map on the current user location.
  - If location permission was already granted, map centers on current user location without blocking flow.
  - Denying location keeps map at default center and app remains usable.
  - Map tab shows Mapbox view and overlays.
  - Review context card is hidden until a review pin is tapped.
  - Tapping a review pin shows the selected review/place card.
  - Tapping `X` on the review card hides it.
  - Feed tab shows persisted review cards.
  - With review pins available, first map render fits viewport to include all review pins plus user location.
  - Pull-to-refresh in Feed re-fetches reviews and then auto-refits map camera bounds.
  - Bottom nav navigates to Explore, Activity, Profile, Share Review.
  - Missing token shows map fallback message.
  - After successful review submission, returning to Home shows the review immediately in Feed and as a Map pin.

## Use Cases
- User quickly switches between feed and map.
- User opens bottom nav to reach notifications or profile.

## Open Questions
- Should bottom nav be global across all main screens?
- Should Feed and Map be separate navigators later?
