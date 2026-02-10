import * as Location from 'expo-location';
import { LocationPermissionStrategy } from './types';

export class ExpoForegroundLocationPermissionStrategy implements LocationPermissionStrategy {
  async hasPermission() {
    const currentPermission = await Location.getForegroundPermissionsAsync();
    return currentPermission.status === 'granted';
  }

  async requestPermission() {
    const requestedPermission = await Location.requestForegroundPermissionsAsync();
    return requestedPermission.status === 'granted';
  }
}
