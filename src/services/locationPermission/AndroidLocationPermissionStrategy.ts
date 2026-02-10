import { PermissionsAndroid } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import { LocationPermissionStrategy } from './types';

export class AndroidLocationPermissionStrategy implements LocationPermissionStrategy {
  async hasPermission() {
    return PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
  }

  async requestPermission() {
    return Mapbox.requestAndroidLocationPermissions();
  }
}
