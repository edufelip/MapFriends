import React from 'react';
import { render, act } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../auth';

jest.mock('../../mocks/auth.json', () => ({
  user: {
    id: 'user-001',
    name: '',
    handle: '',
    avatar: null,
    bio: '',
    visibility: '',
  },
}));

let latest: ReturnType<typeof useAuth> | null = null;

function TestConsumer() {
  latest = useAuth();
  return null;
}

describe('AuthProvider', () => {
  beforeEach(() => {
    latest = null;
  });

  it('marks onboarding complete after profile completion', () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    act(() => {
      latest?.signIn();
    });

    act(() => {
      latest?.completeProfile({
        name: 'Alex',
        handle: 'alex',
        bio: 'Explorer',
        visibility: 'open',
      });
    });

    expect(latest?.hasCompletedProfile).toBe(true);
    expect(latest?.hasCompletedOnboarding).toBe(true);
  });

  it('fills handle and visibility when skipping profile setup', () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    act(() => {
      latest?.signIn();
    });

    act(() => {
      latest?.skipProfileSetup();
    });

    expect(latest?.user?.handle?.length || 0).toBeGreaterThanOrEqual(3);
    expect(latest?.user?.visibility).toBe('open');
    expect(latest?.hasSkippedProfileSetup).toBe(true);
  });
});
