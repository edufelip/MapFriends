import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import FeedCard from '../FeedCard';

describe('FeedCard', () => {
  const baseProps = {
    post: {
      id: 'review-review-1',
      reviewId: 'review-1',
      author: 'Edu',
      time: 'now',
      avatar: null,
      image: null,
      title: 'Guacamole',
      body: 'Great place',
      premium: false,
      likes: '2',
      comments: '4',
    },
    theme: {
      textPrimary: '#fff',
      textMuted: '#9ca3af',
      primary: '#135bec',
      border: '#1f2937',
      surface: '#0b1220',
    },
  };

  it('wires all action callbacks', () => {
    const onLikePress = jest.fn();
    const onCommentPress = jest.fn();
    const onSendPress = jest.fn();
    const onFavoritePress = jest.fn();

    const screen = render(
      <FeedCard
        {...baseProps}
        onLikePress={onLikePress}
        onCommentPress={onCommentPress}
        onSendPress={onSendPress}
        onFavoritePress={onFavoritePress}
      />
    );

    fireEvent.press(screen.getByTestId('feed-card-like-review-review-1'));
    fireEvent.press(screen.getByTestId('feed-card-comment-review-review-1'));
    fireEvent.press(screen.getByTestId('feed-card-send-review-review-1'));
    fireEvent.press(screen.getByTestId('feed-card-favorite-review-review-1'));

    expect(onLikePress).toHaveBeenCalledTimes(1);
    expect(onCommentPress).toHaveBeenCalledTimes(1);
    expect(onSendPress).toHaveBeenCalledTimes(1);
    expect(onFavoritePress).toHaveBeenCalledTimes(1);
  });
});
