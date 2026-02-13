import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import ProfileSectionTabs from '../ProfileSectionTabs';

describe('ProfileSectionTabs', () => {
  const theme = {
    surface: '#fff',
    border: '#ddd',
    primary: '#135bec',
    textPrimary: '#111',
    textMuted: '#666',
  };

  it('renders favorites tab before settings tab', () => {
    const onChangeTab = jest.fn();
    const screen = render(
      <ProfileSectionTabs
        activeTab="favorites"
        onChangeTab={onChangeTab}
        labels={{
          favorites: 'Favorites',
          settings: 'Settings',
        }}
        theme={theme}
      />
    );

    const serialized = JSON.stringify(screen.toJSON());
    const favoritesIndex = serialized.indexOf('profile-section-tab-favorites');
    const settingsIndex = serialized.indexOf('profile-section-tab-settings');

    expect(favoritesIndex).toBeGreaterThanOrEqual(0);
    expect(settingsIndex).toBeGreaterThanOrEqual(0);
    expect(favoritesIndex).toBeLessThan(settingsIndex);
  });

  it('emits tab changes when each tab is pressed', () => {
    const onChangeTab = jest.fn();
    const screen = render(
      <ProfileSectionTabs
        activeTab="favorites"
        onChangeTab={onChangeTab}
        labels={{
          favorites: 'Favorites',
          settings: 'Settings',
        }}
        theme={theme}
      />
    );

    fireEvent.press(screen.getByTestId('profile-section-tab-settings'));
    fireEvent.press(screen.getByTestId('profile-section-tab-favorites'));

    expect(onChangeTab).toHaveBeenNthCalledWith(1, 'settings');
    expect(onChangeTab).toHaveBeenNthCalledWith(2, 'favorites');
  });
});
