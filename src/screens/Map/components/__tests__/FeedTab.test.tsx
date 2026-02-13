import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import * as Clipboard from 'expo-clipboard';
import { Share } from 'react-native';

const mockHydrateLikeState = jest.fn();
const mockToggleLike = jest.fn(async () => true);
const mockToggleFavorite = jest.fn(async () => true);

jest.mock('../../../../state/engagement', () => ({
  useEngagementStore: (selector: (state: any) => unknown) =>
    selector({
      likedByReviewId: { 'review-1': false },
      likeHydratingByReviewId: {},
      hydrateLikeState: mockHydrateLikeState,
    }),
  useToggleReviewLike: () => mockToggleLike,
}));

jest.mock('../../../../state/favorites', () => ({
  useFavoriteStore: (selector: (state: any) => unknown) =>
    selector({
      favoritesByReviewId: {},
    }),
  useHydrateFavoriteState: jest.fn(),
  useToggleFavoriteReview: () => mockToggleFavorite,
}));

jest.mock('../../../../state/reviews', () => ({
  useReviewStore: (selector: (state: any) => unknown) =>
    selector({
      reviewsById: {
        'review-1': {
          id: 'review-1',
          placeId: 'place-1',
          placeTitle: 'Guacamole',
          placeCoordinates: null,
          title: 'Guacamole',
          notes: 'Great place',
          rating: 8,
          visibility: 'followers',
          userId: 'user-1',
          userName: 'Edu',
          userHandle: 'edu',
          userAvatar: null,
          photos: [],
          photoUrls: [],
          createdAt: '2026-02-13T12:00:00.000Z',
          updatedAt: '2026-02-13T12:00:00.000Z',
        },
      },
    }),
}));

import FeedTab from '../FeedTab';

describe('FeedTab', () => {
  const baseProps = {
    onCreate: jest.fn(),
    onRefresh: jest.fn(),
    onOpenReview: jest.fn(),
    refreshing: false,
    viewer: { id: 'user-1' },
    theme: {
      background: '#000',
      surface: '#111',
      textPrimary: '#fff',
      textMuted: '#999',
      primary: '#135bec',
      accentGold: '#f59e0b',
      border: '#222',
    },
    strings: {
      title: 'Feed',
      premiumLabel: 'Premium',
      premiumTitle: 'Title',
      premiumDesc: 'Desc',
      premiumCta: 'CTA',
      emptyTitle: 'A quiet page, waiting for your first place.',
      emptySubtitle: 'Poetic subtitle',
      emptyCta: 'Share your first review',
      emptyFootnote: 'Leave a small mark.',
      feedActionAuthTitle: 'Auth required',
      feedActionAuthMessage: 'Please sign in',
      feedShareTitle: 'Share review',
      feedShareSubtitlePrefix: 'Share',
      feedShareSystem: 'Share via system',
      feedShareCopyLink: 'Copy link',
      feedShareCopySuccessTitle: 'Copied',
      feedShareCopySuccessMessage: 'Copied to clipboard',
      feedShareCopyErrorTitle: 'Copy failed',
      feedShareCopyErrorMessage: 'Try again',
      feedShareCancel: 'Cancel',
      likeErrorTitle: 'Like error',
      likeErrorMessage: 'Try again',
      favoriteErrorTitle: 'Favorite error',
      favoriteErrorMessage: 'Try again',
      shareErrorTitle: 'Share error',
      shareErrorMessage: 'Try again',
    },
    topInset: 0,
    bottomInset: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('supports swipe-to-refresh callback wiring', () => {
    const onRefresh = jest.fn();

    const screen = render(
      <FeedTab
        posts={[]}
        onCreate={jest.fn()}
        onRefresh={onRefresh}
        onOpenReview={jest.fn()}
        refreshing={false}
        viewer={baseProps.viewer}
        theme={baseProps.theme}
        strings={baseProps.strings}
        topInset={0}
        bottomInset={0}
      />
    );

    fireEvent(screen.getByTestId('feed-list'), 'refresh');

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('renders emotional empty state and triggers create CTA', () => {
    const onCreate = jest.fn();

    const screen = render(
      <FeedTab
        {...baseProps}
        posts={[]}
        onCreate={onCreate}
      />
    );

    expect(screen.getByTestId('feed-empty-state')).toBeTruthy();

    fireEvent.press(screen.getByTestId('feed-empty-cta'));

    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it('shows a visible refresh indicator while refreshing', () => {
    const screen = render(
      <FeedTab
        {...baseProps}
        posts={[]}
        refreshing
      />
    );

    expect(screen.getByTestId('feed-refresh-indicator')).toBeTruthy();
  });

  it('opens review detail when feed card is pressed', () => {
    const onOpenReview = jest.fn();
    const screen = render(
      <FeedTab
        {...baseProps}
        onOpenReview={onOpenReview}
        posts={[
          {
            id: 'review-review-1',
            reviewId: 'review-1',
            author: 'Edu',
            time: 'now',
            avatar: null,
            image: null,
            title: 'Guacamole',
            body: 'Great place',
            premium: false,
            likes: '0',
            comments: '0',
          },
        ]}
      />
    );

    fireEvent.press(screen.getByTestId('feed-card-review-review-1'));

    expect(onOpenReview).toHaveBeenCalledWith('review-1');
  });

  it('opens review detail from comment action press', () => {
    const onOpenReview = jest.fn();
    const screen = render(
      <FeedTab
        {...baseProps}
        onOpenReview={onOpenReview}
        posts={[
          {
            id: 'review-review-1',
            reviewId: 'review-1',
            author: 'Edu',
            time: 'now',
            avatar: null,
            image: null,
            title: 'Guacamole',
            body: 'Great place',
            premium: false,
            likes: '0',
            comments: '0',
          },
        ]}
      />
    );

    fireEvent.press(screen.getByTestId('feed-card-comment-review-review-1'));

    expect(onOpenReview).toHaveBeenCalledWith('review-1');
  });

  it('opens share sheet from send action press', () => {
    const screen = render(
      <FeedTab
        {...baseProps}
        posts={[
          {
            id: 'review-review-1',
            reviewId: 'review-1',
            author: 'Edu',
            time: 'now',
            avatar: null,
            image: null,
            title: 'Guacamole',
            body: 'Great place',
            premium: false,
            likes: '0',
            comments: '0',
          },
        ]}
      />
    );

    fireEvent.press(screen.getByTestId('feed-card-send-review-review-1'));

    expect(screen.getByTestId('feed-share-sheet-system-share')).toBeTruthy();
    expect(screen.getByTestId('feed-share-sheet-copy-link')).toBeTruthy();
  });



  it('copies deep link from share sheet copy action', async () => {
    const screen = render(
      <FeedTab
        {...baseProps}
        posts={[
          {
            id: 'review-review-1',
            reviewId: 'review-1',
            author: 'Edu',
            time: 'now',
            avatar: null,
            image: null,
            title: 'Guacamole',
            body: 'Great place',
            premium: false,
            likes: '0',
            comments: '0',
          },
        ]}
      />
    );

    fireEvent.press(screen.getByTestId('feed-card-send-review-review-1'));

    await act(async () => {
      fireEvent.press(screen.getByTestId('feed-share-sheet-copy-link'));
    });

    expect(Clipboard.setStringAsync).toHaveBeenCalledWith(
      expect.stringContaining('com.eduardo880.mapfriends://review/review-1')
    );
  });

  it('triggers system share from share sheet', async () => {
    const shareSpy = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' } as any);

    const screen = render(
      <FeedTab
        {...baseProps}
        posts={[
          {
            id: 'review-review-1',
            reviewId: 'review-1',
            author: 'Edu',
            time: 'now',
            avatar: null,
            image: null,
            title: 'Guacamole',
            body: 'Great place',
            premium: false,
            likes: '0',
            comments: '0',
          },
        ]}
      />
    );

    fireEvent.press(screen.getByTestId('feed-card-send-review-review-1'));

    await act(async () => {
      fireEvent.press(screen.getByTestId('feed-share-sheet-system-share'));
    });

    expect(shareSpy).toHaveBeenCalled();
    shareSpy.mockRestore();
  });

  it('keeps premium feed card actions restricted', () => {
    const screen = render(
      <FeedTab
        {...baseProps}
        posts={[
          {
            id: 'premium-review-1',
            reviewId: 'review-1',
            author: 'Edu',
            time: 'now',
            avatar: null,
            image: null,
            title: 'Premium post',
            body: 'Premium content',
            premium: true,
            likes: '0',
            comments: '0',
          },
        ]}
      />
    );

    expect(screen.queryByTestId('feed-card-like-premium-review-1')).toBeNull();
    expect(screen.queryByTestId('feed-card-send-premium-review-1')).toBeNull();
    expect(screen.queryByTestId('feed-card-favorite-premium-review-1')).toBeNull();
  });
});
