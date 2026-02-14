# Notifications Center

## Summary
Activity notifications are now remote-backed in Firestore and persisted per user across devices. The Activity tab reads real notification documents, supports unread/read state with bottom-nav badge count, and allows actionable follow flows directly from each row.

## Goals
- Persist notifications remotely and keep them available across sessions/devices.
- Support unread/read state and unread badge count in bottom navigation.
- Provide actionable notification rows:
  - Accept/decline follow requests.
  - Follow back from follow notifications.
  - Open review detail from review-published notifications.
- Confirm destructive clear action before deleting all notifications remotely.

## Non-Goals
- Push notification delivery orchestration.
- Cloud Functions-based fanout (fanout is currently client-triggered on review creation).

## Data Model / State
- Firestore collections:
  - `userNotifications/{uid}/items/{notificationId}`
  - `userFollowRequests/{uid}/items/{requesterUid}`
  - `userFollowers/{uid}/items/{followerUid}`
  - Existing `userFollowing/{uid}/items/{followedUid}` remains active.
- Zustand store:
  - `src/state/notifications/notificationsStore.ts`
  - Handles hydration, unread count, action pending states, clear, and row mutations.

## UI/UX Notes
- Activity rows show unread highlight and unread indicator dot.
- New Requests section prioritizes pending follow requests.
- Clear opens confirmation modal (`Alert`) before deleting remote records.
- Empty state is rendered when no notification sections exist.
- Follow-back button is only shown when the actor is not already followed by the current user.

## Action Flows
- Accept follow request:
  - Removes request, creates follow relation, updates request notification status, and notifies requester of acceptance.
- Decline follow request:
  - Removes request and marks request notification declined.
- Follow back:
  - Creates follow relation and marks source notification as read.
  - Action disappears after follow succeeds because row state derives from the real following graph.
- Review published:
  - On review creation, followers receive `review_published` notifications with review metadata.

## Test Cases
- Manual:
  - Unread badge appears when remote unread notifications exist.
  - Opening a review-published notification navigates to Review Detail.
  - Accept/decline/follow-back updates row state and follow graph.
  - Clear confirmation appears and remote notifications are deleted after confirm.

## Open Questions
- Should opening the Activity tab auto-mark all visible notifications as read?
- Should review notification fanout move to backend automation for stronger delivery guarantees?
