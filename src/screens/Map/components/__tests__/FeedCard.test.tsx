import React from 'react';
import { render } from '@testing-library/react-native';
import FeedCard from '../FeedCard';

describe('FeedCard', () => {
  const theme = {
    textPrimary: '#111111',
    textMuted: '#666666',
    primary: '#135bec',
    border: '#d4d4d8',
    surface: '#ffffff',
  };

  it('does not render avatar or hero image when media is missing', () => {
    const screen = render(
      <FeedCard
        post={{
          id: 'p-1',
          author: 'A',
          time: 'now',
          avatar: '',
          image: '',
          title: 'Post title',
          body: 'Post body',
          premium: false,
        }}
        theme={theme}
      />
    );

    expect(screen.queryByTestId('feed-card-avatar')).toBeNull();
    expect(screen.queryByTestId('feed-card-image')).toBeNull();
  });
});
