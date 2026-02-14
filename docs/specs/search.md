# Search Screen

## Overview
Explore is now a people-first search surface. Users can search by name or handle, revisit recent profile opens, and discover trending creators ranked by weekly posting volume.

## Goals
- Focus Explore on creator discovery (people only).
- Persist recent profile opens remotely per user, synced across devices.
- Rank trending creators by number of reviews posted in the last 7 days (top 10).
- Support open and locked profiles, with lock-aware follow CTA text.

## UI Structure
- Sticky header with a single search input (`name` or `@handle`).
- Search mode (`>= 2` chars):
  - People results list.
  - Result rows show avatar, name, handle, lock state, and follow action.
- Default mode (no active search):
  - Recent Searches (clearable), max 5 items.
  - Trending Creators horizontal list.
  - Guidance callout.
- Bottom navigation (Home/Explore/Activity/Profile) with Explore active.

## Behavior
- Recent searches are saved only when user performs a search and taps a person result.
- Recent entries are persisted in Firestore under the current user and trimmed to 5.
- Search uses normalized prefixes from `name` and `handle`.
- Locked profiles are included in results/trending with lock indication.
- Follow CTA labels:
  - Open profile: `Follow` / `Following`
  - Locked profile: `Request` / `Requested`

## Data & Sources
- `userSearchIndex/{uid}` stores search metadata:
  - `uid`, `name`, `handle`, `avatar`, `visibility`, `updatedAt`, `searchPrefixes`
- `userSearchRecent/{uid}/items/{searchedUid}` stores recent profile opens:
  - `userId`, `searchedUserId`, `name`, `handle`, `avatar`, `visibility`, `openedAt`
- Trending creators:
  - Derived from `reviews` created in last 7 days.
  - Aggregated by `userId`, sorted by post count desc, then latest post timestamp.

## Localization
Strings are defined in `src/localization/strings.ts` under `search` for `en-US` and `pt-BR`.

## Test Cases
- Search by handle prefix returns matching user.
- Search by name prefix returns matching user.
- Recent save keeps max 5 and refreshes order when same user is opened again.
- Clear recent removes all recent items for current user.
- Trending list excludes current viewer and returns top creators in 7-day window.

## Use Cases
- User finds creators by typing name or handle.
- User quickly reopens recently viewed profiles across sessions/devices.
- User discovers active creators through the weekly trending list.
