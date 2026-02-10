export type LocationPermissionStrategy = {
  hasPermission: () => Promise<boolean>;
  requestPermission: () => Promise<boolean>;
};
