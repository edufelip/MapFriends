# Main Shell Navigation

## Summary
Primary app areas (Home, Explore, Activity, Profile) are rendered inside a persistent `MainShell` canvas instead of pushing separate stack screens. A single bottom navigation bar remains visible and controls in-canvas panel switching.

## Goals
- Keep bottom navigation static across primary areas.
- Prevent full-screen route replacement when selecting primary tabs.
- Provide animated active-tab highlight and smooth content transitions.

## Data Model / State
- `activeTab` in shell: `home | explore | activity | profile`.
- Animated transition index drives crossfade between mounted panels.

## UI/UX Notes
- Bottom nav is mounted once in shell.
- Bottom nav active selector uses animated sliding highlight.
- Bottom nav track background animates by Home submode: solid white on `home + feed`, glass on `home + map` (and non-home tabs).
- Primary tab changes crossfade content in place (`260ms`).
- Activity tab uses a panel variant (not the standalone notifications stack route header/back behavior).

## Routing
- `MainStack` entry route is `MainShell`.
- Drill-in routes like `PlaceDetail`, `ShareReview`, and `Settings` remain stack-based.

## Test Cases
- Bottom nav selection does not push new stack route for primary areas.
- Bottom nav remains visible while changing primary tabs.
- Active tab highlight animates to selected item.
