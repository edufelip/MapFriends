import Constants from 'expo-constants';
import * as Application from 'expo-application';
import { Platform } from 'react-native';

export type AppVersionInfo = {
  version: string;
  build: string;
};

type AppVersionSource = {
  nativeApplicationVersion?: string | null;
  nativeBuildVersion?: string | null;
  expoVersion?: string | null;
  iosBuildNumber?: string | null;
  androidVersionCode?: number | null;
  platformOS?: string | null;
};

const DEFAULT_APP_VERSION = '0.0.0';
const DEFAULT_BUILD_NUMBER = '1';

const toNonEmptyString = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const toBuildString = (value: unknown): string | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return toNonEmptyString(value);
};

const replaceAll = (template: string, token: string, value: string) =>
  template.split(token).join(value);

export function resolveAppVersionInfo(source: AppVersionSource): AppVersionInfo {
  const nativeVersion = toNonEmptyString(source.nativeApplicationVersion);
  const configVersion = toNonEmptyString(source.expoVersion);
  const version = nativeVersion || configVersion || DEFAULT_APP_VERSION;

  const nativeBuild = toBuildString(source.nativeBuildVersion);
  const iosBuild = toBuildString(source.iosBuildNumber);
  const androidBuild = toBuildString(source.androidVersionCode);

  const platform = toNonEmptyString(source.platformOS)?.toLowerCase();
  let preferredConfigBuild: string | null = null;

  if (platform === 'ios') {
    preferredConfigBuild = iosBuild || androidBuild;
  } else if (platform === 'android') {
    preferredConfigBuild = androidBuild || iosBuild;
  } else {
    preferredConfigBuild = iosBuild || androidBuild;
  }

  return {
    version,
    build: nativeBuild || preferredConfigBuild || DEFAULT_BUILD_NUMBER,
  };
}

export function getAppVersionInfo(): AppVersionInfo {
  return resolveAppVersionInfo({
    nativeApplicationVersion: Application.nativeApplicationVersion,
    nativeBuildVersion: Application.nativeBuildVersion,
    expoVersion: Constants.expoConfig?.version,
    iosBuildNumber: Constants.expoConfig?.ios?.buildNumber || null,
    androidVersionCode: Constants.expoConfig?.android?.versionCode || null,
    platformOS: Platform.OS,
  });
}

export function formatAppVersionLabel(template: string, info: AppVersionInfo): string {
  const normalizedTemplate = toNonEmptyString(template);

  if (!normalizedTemplate) {
    return `Version ${info.version} (Build ${info.build})`;
  }

  if (normalizedTemplate.includes('{{version}}') || normalizedTemplate.includes('{{build}}')) {
    return replaceAll(
      replaceAll(normalizedTemplate, '{{version}}', info.version),
      '{{build}}',
      info.build
    );
  }

  if (normalizedTemplate.toLowerCase().startsWith('versão')) {
    return `Versão ${info.version} (Build ${info.build})`;
  }

  return `Version ${info.version} (Build ${info.build})`;
}
