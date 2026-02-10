import { LocationPermissionStrategy } from './types';

type Params = {
  strategy: LocationPermissionStrategy;
  requestEducation: () => Promise<boolean>;
};

export async function ensureLocationPermission({
  strategy,
  requestEducation,
}: Params): Promise<boolean> {
  const hasPermission = await strategy.hasPermission();
  if (hasPermission) {
    return true;
  }

  const shouldRequestPermission = await requestEducation();
  if (!shouldRequestPermission) {
    return false;
  }

  return strategy.requestPermission();
}
