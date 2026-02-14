# Main Shell Navigation

## Summary
Primary app areas (Home, Explore, Activity, Profile) are rendered inside a persistent `MainShell` canvas instead of pushing separate stack screens. A single bottom navigation bar remains visible and controls in-canvas panel switching.

## Goals
- Keep bottom navigation static across primary areas.
- Prevent full-screen route replacement when selecting primary tabs.
- Provide animated active-tab highlight and smooth content transitions.

## Data Model / State
- `activeTab` in shell: `home | explore | activity | profile`.
- A single animated opacity value drives tab-content fade in (`260ms`).
- Primary tab panels are kept alive after first visit (lazy keep-alive), so returning to a visited tab restores prior UI state.

## UI/UX Notes
- Bottom nav is mounted once in shell.
- Bottom nav active selector uses animated sliding highlight.
- Profile tab in bottom nav uses a static person icon (no avatar preview).
- Bottom nav track background animates by Home submode: solid white on `home + feed`, glass on `home + map` (and non-home tabs).
- Primary tab changes crossfade content in place (`260ms`).
- Home panel remains mounted while other primary tabs are active to preserve feed scroll/media state.
- Activity tab uses a panel variant (not the standalone notifications stack route header/back behavior).
- Feed and map tabs only surface reviews authored by accounts the signed-in user follows (plus the user's own reviews).
- Feed regular cards expose interactive action row:
  - Like toggles engagement with tap animation.
  - Comment opens `ReviewDetail`.
  - Send opens share bottom sheet (system share + copy deep link).
  - Favorite toggles saved state with tap animation.
- Feed comment counters are hydrated independently from Review Detail so counts are visible on first feed render.
- Feed like counters are also hydrated independently (including signed-out sessions) and stay in sync after local like/unlike actions.
- Premium feed cards remain restricted and do not expose the interactive action row.

## Routing
- `MainStack` entry route is `MainShell`.
- Drill-in routes like `PlaceDetail`, `ShareReview`, and `Settings` remain stack-based.
- Deep link `com.eduardo880.mapfriends://review/:reviewId` routes to `ReviewDetail`.

## Test Cases
- Bottom nav selection does not push new stack route for primary areas.
- Bottom nav remains visible while changing primary tabs.
- Active tab highlight animates to selected item.
- Switching away from Home does not unmount Home panel.
- Feed action row behavior:
  - Comment action opens review detail.
  - Send action opens share bottom sheet.
  - Premium cards keep action row restricted.
- Feed comment count updates immediately after comment create/delete without requiring a Review Detail roundtrip.
- Feed like count is accurate on first feed visit and remains consistent after like/unlike.
- Feed and map lists exclude authors outside the viewer's followed network.
