import { resolveGoogleClientIds } from '../authConfig';

describe('resolveGoogleClientIds', () => {
  const env = {
    iosDev: 'ios-dev',
    iosProd: 'ios-prod',
    iosLegacy: 'ios-legacy',
    androidDev: 'android-dev',
    androidProd: 'android-prod',
    androidLegacy: 'android-legacy',
  };

  it('uses dev client IDs when application id ends with .dev', () => {
    const resolved = resolveGoogleClientIds('com.edufelip.mapfriends.dev', env);
    expect(resolved.isDevFlavor).toBe(true);
    expect(resolved.iosClientId).toBe('ios-dev');
    expect(resolved.androidClientId).toBe('android-dev');
  });

  it('uses prod client IDs for non-dev application ids', () => {
    const resolved = resolveGoogleClientIds('com.edufelip.mapfriends', env);
    expect(resolved.isDevFlavor).toBe(false);
    expect(resolved.iosClientId).toBe('ios-prod');
    expect(resolved.androidClientId).toBe('android-prod');
  });

  it('falls back to legacy IDs when env-specific values are missing', () => {
    const resolved = resolveGoogleClientIds('com.edufelip.mapfriends.dev', {
      iosDev: '',
      iosProd: '',
      iosLegacy: 'ios-legacy',
      androidDev: '',
      androidProd: '',
      androidLegacy: 'android-legacy',
    });
    expect(resolved.iosClientId).toBe('ios-legacy');
    expect(resolved.androidClientId).toBe('android-legacy');
  });

  it('returns empty values when neither env-specific nor legacy ids exist', () => {
    const resolved = resolveGoogleClientIds('com.edufelip.mapfriends', {
      iosDev: '',
      iosProd: '',
      iosLegacy: '',
      androidDev: '',
      androidProd: '',
      androidLegacy: '',
    });
    expect(resolved.iosClientId).toBe('');
    expect(resolved.androidClientId).toBe('');
  });
});

