import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import FeedTab from '../FeedTab';

describe('FeedTab', () => {
  const baseProps = {
    onCreate: jest.fn(),
    onRefresh: jest.fn(),
    onOpenReview: jest.fn(),
    refreshing: false,
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
        refreshing={false}
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
});
