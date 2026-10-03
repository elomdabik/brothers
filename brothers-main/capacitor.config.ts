import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'eg.elakhwah.app',
  appName: 'معرض الأخوة',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1000,
      backgroundColor: '#FAF7F2',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    CapacitorSQLite: {
      androidIsEncryption: false,
    },
  },
};

export default config;
