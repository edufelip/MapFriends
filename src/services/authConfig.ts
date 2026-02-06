export type GoogleClientIdEnv = {
  iosDev: string;
  iosProd: string;
  iosLegacy: string;
  androidDev: string;
  androidProd: string;
  androidLegacy: string;
};

const isDevFlavor = (applicationId: string | null | undefined) =>
  Boolean(applicationId?.endsWith('.dev'));

export const resolveGoogleClientIds = (
  applicationId: string | null | undefined,
  env: GoogleClientIdEnv
) => {
  const devFlavor = isDevFlavor(applicationId);
  return {
    isDevFlavor: devFlavor,
    iosClientId: (devFlavor ? env.iosDev : env.iosProd) || env.iosLegacy || '',
    androidClientId: (devFlavor ? env.androidDev : env.androidProd) || env.androidLegacy || '',
  };
};

