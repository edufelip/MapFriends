import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import MapTab from '../MapTab';

const mockCamera = jest.fn(() => null);
const mockSetCamera = jest.fn();
const mockFitBounds = jest.fn();

jest.mock('@rnmapbox/maps', () => {
  const React = require('react');
  return {
    MapView: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Camera: React.forwardRef((props: unknown, ref) => {
      React.useImperativeHandle(ref, () => ({
        setCamera: mockSetCamera,
        fitBounds: mockFitBounds,
      }));
      mockCamera(props);
      return null;
    }),
    ShapeSource: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    MarkerView: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    CircleLayer: () => null,
    SymbolLayer: () => null,
    StyleURL: { Dark: 'dark', Light: 'light' },
  };
});

describe('MapTab', () => {
  beforeEach(() => {
    mockCamera.mockClear();
    mockSetCamera.mockClear();
    mockFitBounds.mockClear();
  });

  it('uses non-animated camera settings centered on user location', () => {
    const screen = render(
      <MapTab
        theme={{
          background: '#000000',
          textPrimary: '#ffffff',
          textMuted: '#94a3b8',
          primary: '#135bec',
          accentGold: '#f59e0b',
          border: '#1f2937',
          glass: 'rgba(16,22,34,0.8)',
        }}
        strings={{
          mapTokenMissing: 'Missing token',
        }}
        hasToken
        isDark
        userCoordinate={[-46.633308, -23.55052]}
        locationResolved
        reviewPins={[]}
      />
    );

    fireEvent(screen.getByTestId('map-tab-root'), 'layout', {
      nativeEvent: {
        layout: { width: 320, height: 640 },
      },
    });

    expect(mockCamera).toHaveBeenCalledWith(
      expect.objectContaining({
        animationDuration: 0,
        defaultSettings: {
          centerCoordinate: [-46.633308, -23.55052],
          zoomLevel: 14,
        },
      })
    );
  });

  it('recenters map camera to user location when my-location FAB is pressed', () => {
    const screen = render(
      <MapTab
        theme={{
          background: '#000000',
          textPrimary: '#ffffff',
          textMuted: '#94a3b8',
          primary: '#135bec',
          accentGold: '#f59e0b',
          border: '#1f2937',
          glass: 'rgba(16,22,34,0.8)',
        }}
        strings={{
          mapTokenMissing: 'Missing token',
        }}
        hasToken
        isDark
        userCoordinate={[-46.633308, -23.55052]}
        locationResolved
        reviewPins={[]}
      />
    );

    fireEvent(screen.getByTestId('map-tab-root'), 'layout', {
      nativeEvent: {
        layout: { width: 320, height: 640 },
      },
    });

    fireEvent.press(screen.getByTestId('map-my-location-fab'));

    expect(mockSetCamera).toHaveBeenCalledWith(
      expect.objectContaining({
        centerCoordinate: [-46.633308, -23.55052],
        zoomLevel: 14,
        animationMode: 'easeTo',
      })
    );
  });

  it('shows context card only when a review pin is selected and hides on close', () => {
    jest.useFakeTimers();
    const screen = render(
      <MapTab
        theme={{
          background: '#000000',
          textPrimary: '#ffffff',
          textMuted: '#94a3b8',
          primary: '#135bec',
          accentGold: '#f59e0b',
          border: '#1f2937',
          glass: 'rgba(16,22,34,0.8)',
        }}
        strings={{
          mapTokenMissing: 'Missing token',
        }}
        hasToken
        isDark
        userCoordinate={[-46.633308, -23.55052]}
        locationResolved
        reviewPins={[
          {
            id: 'review-pin-review-1',
            reviewId: 'review-1',
            placeId: 'place-1',
            title: 'Guacamole Taqueria',
            rating: 8.7,
            coordinates: [-48.52, -27.59],
            notes: 'Excellent tacos and vibe',
            userName: 'Edu',
            userHandle: 'edu',
            visibility: 'followers',
          },
        ]}
      />
    );

    fireEvent(screen.getByTestId('map-tab-root'), 'layout', {
      nativeEvent: {
        layout: { width: 320, height: 640 },
      },
    });

    expect(screen.queryByTestId('map-review-context-card')).toBeNull();

    fireEvent.press(screen.getByTestId('map-review-pin-review-1'));

    expect(screen.getByTestId('map-review-context-card')).toBeTruthy();
    expect(screen.getByText('Guacamole Taqueria')).toBeTruthy();
    expect(screen.getByText('Excellent tacos and vibe')).toBeTruthy();

    fireEvent.press(screen.getByTestId('map-review-context-card-close'));
    act(() => {
      jest.advanceTimersByTime(260);
    });
    expect(screen.queryByTestId('map-review-context-card')).toBeNull();
    jest.useRealTimers();
  });
});
