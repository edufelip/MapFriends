import {
  createLocationPermissionStrategy,
  registerLocationPermissionStrategy,
} from '../createLocationPermissionStrategy';
import { AndroidLocationPermissionStrategy } from '../AndroidLocationPermissionStrategy';
import { ExpoForegroundLocationPermissionStrategy } from '../ExpoForegroundLocationPermissionStrategy';

describe('createLocationPermissionStrategy', () => {
  it('returns android strategy for android platform', () => {
    const strategy = createLocationPermissionStrategy('android');

    expect(strategy).toBeInstanceOf(AndroidLocationPermissionStrategy);
  });

  it('returns expo foreground strategy for non-android platforms', () => {
    const strategy = createLocationPermissionStrategy('ios');

    expect(strategy).toBeInstanceOf(ExpoForegroundLocationPermissionStrategy);
  });

  it('supports registering custom strategies without changing factory internals', () => {
    const mockFactory = jest.fn(() => ({
      hasPermission: jest.fn(async () => true),
      requestPermission: jest.fn(async () => true),
    }));

    registerLocationPermissionStrategy('visionos', mockFactory);
    const strategy = createLocationPermissionStrategy('visionos');

    expect(mockFactory).toHaveBeenCalled();
    expect(strategy).toBeTruthy();
  });
});
