jest.mock('@rnmapbox/maps', () => ({
  setAccessToken: jest.fn(),
  MapView: () => null,
  Camera: () => null,
  StyleURL: { Dark: 'mapbox://styles/mapbox/dark-v10' },
}));
