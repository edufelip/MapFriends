import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import ManageSubscriptionsScreen from '../ManageSubscriptionsScreen';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe('ManageSubscriptionsScreen', () => {
  it('renders coming soon placeholder and supports back action', () => {
    const navigation = {
      goBack: jest.fn(),
    } as never;

    const screen = render(<ManageSubscriptionsScreen navigation={navigation} route={{} as never} />);

    expect(screen.getByText('Manage My Subscriptions')).toBeTruthy();
    expect(screen.getByText('Coming soon')).toBeTruthy();

    fireEvent.press(screen.getByTestId('manage-subscriptions-back'));

    expect((navigation as any).goBack).toHaveBeenCalledTimes(1);
  });
});
