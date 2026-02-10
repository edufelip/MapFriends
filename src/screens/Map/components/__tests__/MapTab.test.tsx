import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import MapTab from '../MapTab';

const mockCamera = jest.fn(() => null);

jest.mock('@rnmapbox/maps', () => {
  const React = require('react');
  return {
    MapView: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Camera: (props: unknown) => mockCamera(props),
    ShapeSource: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    CircleLayer: () => null,
    StyleURL: { Dark: 'dark', Light: 'light' },
  };
});

describe('MapTab', () => {
  beforeEach(() => {
    mockCamera.mockClear();
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
          sampleQuote: 'Sample quote',
          mapTokenMissing: 'Missing token',
        }}
        hasToken
        isDark
        userCoordinate={[-46.633308, -23.55052]}
        locationResolved
        onPlacePress={jest.fn()}
      />
    );

    fireEvent(screen.getByTestId('map-tab-root'), 'layout', {
      nativeEvent: {
        layout: { width: 320, height: 640 },
      },
    });

    expect(mockCamera).toHaveBeenCalledWith(
      expect.objectContaining({
        centerCoordinate: [-46.633308, -23.55052],
        zoomLevel: 14,
        animationDuration: 0,
        defaultSettings: {
          centerCoordinate: [-46.633308, -23.55052],
          zoomLevel: 14,
        },
      })
    );
  });
});
