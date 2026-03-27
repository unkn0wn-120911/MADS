import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mads.neuralcore',
  appName: 'MADS',
  webDir: 'dist',
  server: {
    androidScheme: 'http'
  }
};

export default config;
