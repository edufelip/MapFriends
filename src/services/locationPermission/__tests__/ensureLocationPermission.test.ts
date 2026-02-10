import { ensureLocationPermission } from '../ensureLocationPermission';
import { LocationPermissionStrategy } from '../types';

const createStrategy = (
  overrides: Partial<LocationPermissionStrategy> = {}
): LocationPermissionStrategy => ({
  hasPermission: jest.fn(async () => true),
  requestPermission: jest.fn(async () => true),
  ...overrides,
});

describe('ensureLocationPermission', () => {
  it('returns true without prompting when permission is already granted', async () => {
    const strategy = createStrategy({ hasPermission: jest.fn(async () => true) });
    const requestEducation = jest.fn(async () => true);

    const granted = await ensureLocationPermission({
      strategy,
      requestEducation,
    });

    expect(granted).toBe(true);
    expect(requestEducation).not.toHaveBeenCalled();
    expect(strategy.requestPermission).not.toHaveBeenCalled();
  });

  it('returns false when user declines the education prompt', async () => {
    const strategy = createStrategy({ hasPermission: jest.fn(async () => false) });
    const requestEducation = jest.fn(async () => false);

    const granted = await ensureLocationPermission({
      strategy,
      requestEducation,
    });

    expect(granted).toBe(false);
    expect(requestEducation).toHaveBeenCalled();
    expect(strategy.requestPermission).not.toHaveBeenCalled();
  });

  it('returns false when OS permission request is denied', async () => {
    const strategy = createStrategy({
      hasPermission: jest.fn(async () => false),
      requestPermission: jest.fn(async () => false),
    });
    const requestEducation = jest.fn(async () => true);

    const granted = await ensureLocationPermission({
      strategy,
      requestEducation,
    });

    expect(granted).toBe(false);
    expect(strategy.requestPermission).toHaveBeenCalled();
  });

  it('returns true when OS permission request is granted', async () => {
    const strategy = createStrategy({
      hasPermission: jest.fn(async () => false),
      requestPermission: jest.fn(async () => true),
    });
    const requestEducation = jest.fn(async () => true);

    const granted = await ensureLocationPermission({
      strategy,
      requestEducation,
    });

    expect(granted).toBe(true);
    expect(strategy.requestPermission).toHaveBeenCalled();
  });
});
