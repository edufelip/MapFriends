import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import NotificationRow, { NotificationRowItem } from '../NotificationRow';

const theme = {
  background: '#0b1220',
  surfaceMuted: '#1f2937',
  border: '#334155',
  textPrimary: '#ffffff',
  textMuted: '#94a3b8',
  primary: '#135bec',
};

const labels = {
  accept: 'Accept',
  decline: 'Decline',
  follow: 'Follow back',
  accepted: 'Accepted',
  declined: 'Declined',
  premiumTitle: 'Premium',
  premiumSubtitle: 'Subscribers only',
  premiumCta: 'Unlock',
};

const makeItem = (overrides: Partial<NotificationRowItem> = {}): NotificationRowItem => ({
  id: 'notification-1',
  name: 'Taylor',
  time: '2m',
  avatar: null,
  message: 'started following you',
  isRead: false,
  ...overrides,
});

describe('NotificationRow', () => {
  it('triggers request action callbacks for pending follow request', () => {
    const onAcceptPress = jest.fn();
    const onDeclinePress = jest.fn();

    const screen = render(
      <NotificationRow
        item={makeItem({ hasRequestActions: true, requestStatus: 'pending' })}
        theme={theme}
        labels={labels}
        onAcceptPress={onAcceptPress}
        onDeclinePress={onDeclinePress}
      />
    );

    fireEvent.press(screen.getByTestId('notification-accept-notification-1'));
    fireEvent.press(screen.getByTestId('notification-decline-notification-1'));

    expect(onAcceptPress).toHaveBeenCalledWith('notification-1');
    expect(onDeclinePress).toHaveBeenCalledWith('notification-1');
  });

  it('triggers follow callback when follow action is visible', () => {
    const onFollowPress = jest.fn();

    const screen = render(
      <NotificationRow
        item={makeItem({ action: 'follow' })}
        theme={theme}
        labels={labels}
        onFollowPress={onFollowPress}
      />
    );

    fireEvent.press(screen.getByTestId('notification-follow-notification-1'));

    expect(onFollowPress).toHaveBeenCalledWith('notification-1');
  });

  it('triggers row press callback', () => {
    const onPress = jest.fn();

    const screen = render(
      <NotificationRow
        item={makeItem()}
        theme={theme}
        labels={labels}
        onPress={onPress}
      />
    );

    fireEvent.press(screen.getByTestId('notification-row-notification-1'));

    expect(onPress).toHaveBeenCalledWith('notification-1');
  });
});
