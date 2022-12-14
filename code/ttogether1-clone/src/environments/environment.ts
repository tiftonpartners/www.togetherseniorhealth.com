// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

// `.env.ts` is generated by the `npm run env` command
// `npm run env` exposes environment variables as JSON for any usage you might
// want, like displaying the version or getting extra config from your CI bot, etc.
// This is useful for granularity you might need beyond just the environment.
// Note that as usual, any environment variables you expose through it will end up in your
// bundle, and you should not use it for any sensitive information like passwords or keys.
import { env } from './.env';

import { environment as prodEnvironment } from './environment.prod';

export const environment = {
  ...prodEnvironment,
  envName: 'LOCALHOST',
  production: false,
  hmr: true,
  version: env.npm_package_version + '-local',
  apiServerPrefix: 'https://mt1-api.dev.tsh.care', // http://localhost:4000
  websocketServerPrefix: 'wss://mt1-api.dev.tsh.care', // ws://localhost:4000
  agoraAppId: 'aa1129ec54094794a80c3d37db472e9c',
  auth0_clientId: 'KpOL3cvsqsO0d0H7Bn1M6FIQA5EHrz7K',
  auth0_domain: 'login.dev.tsh.care',
  auth0_audience: 'https://mt1-api.dev.tsh.care',
  videoProfiles: {
    instructor: { low: '480p_8', high: '720p_1' },
    participant: { low: '240p_4', high: '720p_1' }
  },
  disableAv: false,
  playMusic: true,
  statsDisplay: {
    defaultForInst: true, // Are stats ON by default for the instructor?
    sampleTimeSecs: 10, // How often to we sample the stats?
    qosFilter: 2, // Consecutive QoS count to display QoS indicator
    minFps: 7,
    maxE2Etime: 150,
    maxPacketLoss: 10
  },
  enableGA: true,
  googleAnalyticsId: 'G-Z70V8X45S1', //'G-Z70V8X45S1'
  defaultVolume: 100
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
