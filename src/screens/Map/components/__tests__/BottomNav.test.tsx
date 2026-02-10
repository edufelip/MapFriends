import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import BottomNav from '../BottomNav';
import { StyleSheet } from 'react-native';

describe('BottomNav', () => {
  it('uses controlled tab selection without pushing stack routes', () => {
    const onSelect = jest.fn();
    const navigation = { navigate: jest.fn() };

    const screen = render(
      <BottomNav
        navigation={navigation}
        active="home"
        onSelect={onSelect}
        onPrimaryPress={jest.fn()}
        theme={{
          glass: 'rgba(16,22,34,0.8)',
          border: '#1f2937',
          primary: '#135bec',
          textMuted: '#94a3b8',
          surface: '#1c1f27',
          textPrimary: '#ffffff',
        }}
        labels={{
          home: 'Home',
          explore: 'Explore',
          activity: 'Activity',
          profile: 'Profile',
        }}
        user={{ name: 'Alex' }}
        bottomInset={0}
      />
    );

    fireEvent.press(screen.getByText('Explore'));

    expect(onSelect).toHaveBeenCalledWith('explore');
    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  it('keeps wrapper overflow visible so center CTA is not clipped', () => {
    const screen = render(
      <BottomNav
        active="home"
        onSelect={jest.fn()}
        onPrimaryPress={jest.fn()}
        theme={{
          glass: 'rgba(16,22,34,0.8)',
          border: '#1f2937',
          primary: '#135bec',
          textMuted: '#94a3b8',
          surface: '#1c1f27',
          textPrimary: '#ffffff',
        }}
        labels={{
          home: 'Home',
          explore: 'Explore',
          activity: 'Activity',
          profile: 'Profile',
        }}
        user={{ name: 'Alex' }}
        bottomInset={0}
      />
    );

    const wrapperStyle = StyleSheet.flatten(screen.getByTestId('bottom-nav-wrapper').props.style);
    const trackStyle = StyleSheet.flatten(screen.getByTestId('bottom-nav-track').props.style);

    expect(wrapperStyle.overflow).toBe('visible');
    expect(trackStyle.overflow).toBe('hidden');
  });
});
