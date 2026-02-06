import { getStrings } from '../localization/strings';

export const mapFirebaseAuthError = (error: unknown) => {
  const strings = getStrings();

  if (error instanceof Error) {
    const code = (error as Error & { code?: string }).code || '';

    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return strings.auth.authErrorInvalidCredentials;
      case 'auth/email-already-in-use':
        return strings.auth.authErrorEmailInUse;
      case 'auth/invalid-email':
        return strings.auth.authErrorInvalidEmail;
      case 'auth/weak-password':
        return strings.auth.authErrorWeakPassword;
      case 'auth/user-disabled':
        return strings.auth.authErrorUserDisabled;
      case 'auth/too-many-requests':
        return strings.auth.authErrorTooManyRequests;
      case 'auth/network-request-failed':
        return strings.auth.authErrorNetwork;
      case 'ERR_REQUEST_CANCELED':
        return strings.auth.authErrorProviderCanceled;
      case 'auth/google-not-configured':
      case 'auth/provider-unavailable':
        return strings.auth.authErrorProviderUnavailable;
      default:
        break;
    }
  }

  return strings.auth.authErrorGeneric;
};
