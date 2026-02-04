# Notifications Center

## Summary
Redesign the Notifications screen to match the new UI layout with sectioned notifications, action buttons, and preview cards. Data is provided by mock JSON and exposed via a service layer.

## Goals
- Present clear notification groups (New Requests, Earlier Today, This Week).
- Provide visual-only actions for common flows.
- Keep layout consistent with the rest of the app.

## Non-Goals
- Server-backed notification state.
- Persistent clear action.

## Data Model / State
- Mock data in `src/mocks/notifications.json`.
- `getNotificationSections()` returns grouped arrays for each section.

## UI/UX Notes
- Sticky header with back and clear actions.
- Section headers are uppercase with muted background.
- Rows include avatar + badge, message, optional preview card, and optional premium card.

## Edge Cases
- If a section is empty, it should not render.
- Clear action hides all sections for the session.

## Test Cases
- Manual:
  - Back navigates to previous screen.
  - Clear hides all sections.
  - Section headers appear only when data exists.

## Use Cases
- User reviews new follow requests and accepts/declines.
- User opens a notification with a place preview.

## Open Questions
- Should Clear be persisted across sessions?
