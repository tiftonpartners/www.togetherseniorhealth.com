// `.env.ts` is generated by the `npm run env` command
// `npm run env` exposes environment variables as JSON for any usage you might
// want, like displaying the version or getting extra config from your CI bot, etc.
// This is useful for granularity you might need beyond just the environment.
// Note that as usual, any environment variables you expose through it will end up in your
// bundle, and you should not use it for any sensitive information like passwords or keys.
import { env } from './.env';

export const environment = {
  production: true,
  envName: 'PROD',
  hmr: false,
  version: env.npm_package_version + '-PROD',
  serverUrl: '/api',
  defaultLanguage: 'en-US',
  supportedLanguages: ['en-US', 'fr-FR'],
  apiServerPrefix: 'https://mt1-api.prod.tsh.care',
  websocketServerPrefix: 'wss://mt1-api.prod.tsh.care',
  receiveAudio: false,
  agoraAppId: 'fd01eb91fed3424394bd4424925722d4',
  timeStamp: env.timeStamp,
  auth0_clientId: '48IOAKMkcroc846LWrmdVGfmL9XeMFbR',
  auth0_domain: 'login.togetherseniorhealth.com',
  auth0_audience: 'https://mt1-api.prod.tsh.care',
  videoProfiles: {
    instructor: { low: '480p_8', high: '480p_8' },
    participant: { low: '240p_4', high: '240p_4' }
  },
  videoCheckHelp: ['Please call 415-237-3040 for support', 'Hours are Monday - Friday<br> from 9am - 5pm Pacific time'],
  disableAv: false,
  playMusic: false,
  playMusicVolume: 20,
  defaultSong: 'In the Mood',
  networkQualityThreshold: 5, // Network quality is alerted for Agora values >= this threshold
  geoFencing: true,
  audioProfile: 'high_quality',
  sampleVideosPrefix: 'https://d14h3lf1i435q2.cloudfront.net/',
  // Thresholds and other parametes for QoS indicator
  statsDisplay: {
    defaultForInst: false, // Are stats ON by default for the instructor?
    sampleTimeSecs: 10, // How often to we sample the stats?
    qosFilter: 2, // Consecutive QoS count to display QoS indicator
    minFps: 7,
    maxE2Etime: 150,
    maxPacketLoss: 10,
    maxReceiveDelay: 70
  },
  enableGA: true,
  googleAnalyticsId: 'G-WHT04N7B87',
  // Parameters for active speaker
  activeSpeaker: {
    enabledFor: 'all', // Enabled for? 'instructor', 'all', 'none'
    sampleTimeMsec: 1000, // Sampling time in msec
    autoMute: true, // Automute lesser speakers
    maxActive: 1, // Max active spearkers if automuting
    volumeThreashold: 0.02 // Don't mute speakers below this threshold
  },
  requireChrome: true,
  defaultVolume: 100
};
