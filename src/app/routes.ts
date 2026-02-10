export const Routes = {
  MainShell: 'MainShell',
  AuthLogin: 'AuthLogin',
  AuthSignup: 'AuthSignup',
  AcceptTerms: 'AcceptTerms',
  ProfileSetup: 'ProfileSetup',
  Onboarding: 'Onboarding',
  MapHome: 'MapHome',
  Explore: 'Explore',
  PlaceDetail: 'PlaceDetail',
  ShareReview: 'ShareReview',
  Notifications: 'Notifications',
  Profile: 'Profile',
  EditProfile: 'EditProfile',
  Settings: 'Settings',
} as const;

export type RouteName = (typeof Routes)[keyof typeof Routes];
