import React from 'react';
import { render } from '@testing-library/react-native';
import ProfileHero from '../ProfileHero';

describe('ProfileHero', () => {
  const theme = {
    primary: '#135bec',
    textPrimary: '#111827',
    textMuted: '#6b7280',
    surface: '#ffffff',
    border: '#e5e7eb',
    background: '#f8fafc',
  };

  it('shows fallback when avatar is missing', () => {
    const screen = render(
      <ProfileHero
        handle="@alex"
        subtitle="bio"
        avatar={null}
        editLabel="Edit"
        theme={theme}
      />
    );

    expect(screen.getByTestId('profile-hero-avatar-fallback')).toBeTruthy();
    expect(screen.queryByTestId('profile-hero-avatar-image')).toBeNull();
  });

  it('treats string sentinel avatar values as missing', () => {
    const screen = render(
      <ProfileHero
        handle="@alex"
        subtitle="bio"
        avatar="null"
        editLabel="Edit"
        theme={theme}
      />
    );

    expect(screen.getByTestId('profile-hero-avatar-fallback')).toBeTruthy();
    expect(screen.queryByTestId('profile-hero-avatar-image')).toBeNull();
  });

  it('renders image branch when avatar url is present', () => {
    const screen = render(
      <ProfileHero
        handle="@alex"
        subtitle="bio"
        avatar="https://example.com/avatar.jpg"
        editLabel="Edit"
        theme={theme}
      />
    );

    expect(screen.getByTestId('profile-hero-avatar-fallback')).toBeTruthy();
    expect(screen.getByTestId('profile-hero-avatar-image')).toBeTruthy();
  });
});
