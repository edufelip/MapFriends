import { formatAppVersionLabel, resolveAppVersionInfo } from '../appVersion';

describe('appVersion', () => {
  describe('resolveAppVersionInfo', () => {
    it('prefers native runtime metadata when available', () => {
      const resolved = resolveAppVersionInfo({
        nativeApplicationVersion: '2.4.1',
        nativeBuildVersion: '507',
        expoVersion: '1.0.0',
        iosBuildNumber: '101',
        androidVersionCode: 202,
        platformOS: 'ios',
      });

      expect(resolved).toEqual({
        version: '2.4.1',
        build: '507',
      });
    });

    it('falls back to expo config metadata when native values are unavailable', () => {
      const resolved = resolveAppVersionInfo({
        nativeApplicationVersion: null,
        nativeBuildVersion: null,
        expoVersion: '1.3.0',
        iosBuildNumber: null,
        androidVersionCode: 402,
        platformOS: 'android',
      });

      expect(resolved).toEqual({
        version: '1.3.0',
        build: '402',
      });
    });

    it('uses safe defaults when nothing is provided', () => {
      const resolved = resolveAppVersionInfo({
        nativeApplicationVersion: null,
        nativeBuildVersion: null,
        expoVersion: null,
        iosBuildNumber: null,
        androidVersionCode: null,
        platformOS: 'ios',
      });

      expect(resolved).toEqual({
        version: '0.0.0',
        build: '1',
      });
    });
  });

  describe('formatAppVersionLabel', () => {
    it('replaces template placeholders with resolved values', () => {
      const label = formatAppVersionLabel('Version {{version}} (Build {{build}})', {
        version: '1.9.0',
        build: '321',
      });

      expect(label).toBe('Version 1.9.0 (Build 321)');
    });

    it('falls back to default format when template is empty', () => {
      const label = formatAppVersionLabel('', {
        version: '1.9.0',
        build: '321',
      });

      expect(label).toBe('Version 1.9.0 (Build 321)');
    });
  });
});
