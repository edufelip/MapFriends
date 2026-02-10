import { Platform } from 'react-native';
import { AndroidLocationPermissionStrategy } from './AndroidLocationPermissionStrategy';
import { ExpoForegroundLocationPermissionStrategy } from './ExpoForegroundLocationPermissionStrategy';
import { LocationPermissionStrategy } from './types';

type StrategyFactory = () => LocationPermissionStrategy;

const strategyFactories = new Map<string, StrategyFactory>([
  ['android', () => new AndroidLocationPermissionStrategy()],
  ['default', () => new ExpoForegroundLocationPermissionStrategy()],
]);

export function registerLocationPermissionStrategy(
  platformOS: string,
  factory: StrategyFactory
) {
  strategyFactories.set(platformOS, factory);
}

export function createLocationPermissionStrategy(
  platformOS: string = Platform.OS
): LocationPermissionStrategy {
  const factory = strategyFactories.get(platformOS) || strategyFactories.get('default');
  if (!factory) {
    throw new Error('location-permission/default-strategy-missing');
  }
  return factory();
}
