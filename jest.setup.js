jest.mock('@rnmapbox/maps', () => ({
  setAccessToken: jest.fn(),
  MapView: () => null,
  Camera: () => null,
  StyleURL: { Dark: 'mapbox://styles/mapbox/dark-v10' },
}));

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  const MockIcon = ({ name, testID, ...rest }) =>
    React.createElement(Text, { ...rest, testID: testID || `icon-${String(name || 'default')}` }, name || 'icon');

  return {
    MaterialIcons: MockIcon,
  };
});

jest.mock('expo-linking', () => ({
  createURL: jest.fn((path = '') => `com.eduardo880.mapfriends://${String(path).replace(/^\//, '')}`),
}));

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(async () => true),
}));
