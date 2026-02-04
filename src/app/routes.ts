export const Routes = {
  AuthLogin: 'AuthLogin',
  AuthSignup: 'AuthSignup',
  AcceptTerms: 'AcceptTerms',
  Onboarding: 'Onboarding',
  MapHome: 'MapHome',
  PlaceDetail: 'PlaceDetail',
  ShareReview: 'ShareReview',
  Notifications: 'Notifications',
  Profile: 'Profile',
  Settings: 'Settings',
} as const;

export type RouteName = (typeof Routes)[keyof typeof Routes];
