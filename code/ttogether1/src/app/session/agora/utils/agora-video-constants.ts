export interface AgoraVideoProfile {
  width: number;
  height: number;
  frameRate: number;
  bitrate: number;
  chrome: boolean;
  firefox: boolean;
  safari: boolean;
}

const AllAgoraVideoProfiles = {
  '120p_1': {
    width: 160,
    height: 120,
    frameRate: 15,
    bitrate: 65,
    chrome: true,
    firefox: false,
    safari: false
  },
  '120p_3': {
    width: 120,
    height: 120,
    frameRate: 15,
    bitrate: 50,
    chrome: true,
    firefox: false,
    safari: false
  },
  '180p_1': {
    width: 320,
    height: 180,
    frameRate: 15,
    bitrate: 140,
    chrome: true,
    firefox: false,
    safari: false
  },
  '180p_3': {
    width: 180,
    height: 180,
    frameRate: 15,
    bitrate: 100,
    chrome: true,
    firefox: false,
    safari: false
  },
  '180p_4': {
    width: 240,
    height: 180,
    frameRate: 15,
    bitrate: 120,
    chrome: true,
    firefox: false,
    safari: false
  },
  '240p_1': {
    width: 320,
    height: 240,
    frameRate: 15,
    bitrate: 200,
    chrome: true,
    firefox: false,
    safari: false
  },
  '240p_3': {
    width: 240,
    height: 240,
    frameRate: 15,
    bitrate: 140,
    chrome: true,
    firefox: false,
    safari: false
  },
  '240p_4': {
    width: 424,
    height: 240,
    frameRate: 15,
    bitrate: 220,
    chrome: true,
    firefox: false,
    safari: false
  },
  '360p_1': {
    width: 640,
    height: 360,
    frameRate: 15,
    bitrate: 400,
    chrome: true,
    firefox: false,
    safari: false
  },
  '360p_3': {
    width: 360,
    height: 360,
    frameRate: 15,
    bitrate: 260,
    chrome: true,
    firefox: false,
    safari: false
  },
  '360p_4': {
    width: 640,
    height: 360,
    frameRate: 30,
    bitrate: 600,
    chrome: true,
    firefox: false,
    safari: false
  },
  '360p_6': {
    width: 360,
    height: 360,
    frameRate: 30,
    bitrate: 400,
    chrome: true,
    firefox: false,
    safari: false
  },
  '360p_7': {
    width: 480,
    height: 360,
    frameRate: 15,
    bitrate: 320,
    chrome: true,
    firefox: false,
    safari: false
  },
  '360p_8': {
    width: 480,
    height: 360,
    frameRate: 30,
    bitrate: 490,
    chrome: true,
    firefox: false,
    safari: false
  },
  '360p_9': {
    width: 640,
    height: 360,
    frameRate: 15,
    bitrate: 800,
    chrome: true,
    firefox: false,
    safari: false
  },
  '360p_10': {
    width: 640,
    height: 360,
    frameRate: 24,
    bitrate: 800,
    chrome: true,
    firefox: false,
    safari: false
  },
  '360p_11': {
    width: 640,
    height: 360,
    frameRate: 24,
    bitrate: 1000,
    chrome: true,
    firefox: false,
    safari: false
  },
  '480p_1': {
    width: 640,
    height: 480,
    frameRate: 15,
    bitrate: 500,
    chrome: true,
    firefox: true,
    safari: true
  },
  '480p_2': {
    width: 640,
    height: 480,
    frameRate: 30,
    bitrate: 1000,
    chrome: true,
    firefox: true,
    safari: true
  },
  '480p_3': {
    width: 480,
    height: 480,
    frameRate: 15,
    bitrate: 400,
    chrome: true,
    firefox: true,
    safari: true
  },
  '480p_4': {
    width: 640,
    height: 480,
    frameRate: 30,
    bitrate: 750,
    chrome: true,
    firefox: true,
    safari: true
  },
  '480p_6': {
    width: 480,
    height: 480,
    frameRate: 30,
    bitrate: 600,
    chrome: true,
    firefox: true,
    safari: true
  },
  '480p_8': {
    width: 848,
    height: 480,
    frameRate: 15,
    bitrate: 610,
    chrome: true,
    firefox: true,
    safari: true
  },
  '480p_9': {
    width: 848,
    height: 480,
    frameRate: 30,
    bitrate: 930,
    chrome: true,
    firefox: true,
    safari: true
  },
  '480p_10': {
    width: 640,
    height: 480,
    frameRate: 10,
    bitrate: 400,
    chrome: true,
    firefox: true,
    safari: true
  },
  '720p_1': {
    width: 1280,
    height: 720,
    frameRate: 15,
    bitrate: 1130,
    chrome: true,
    firefox: true,
    safari: true
  },
  '720p_2': {
    width: 1280,
    height: 720,
    frameRate: 30,
    bitrate: 2000,
    chrome: true,
    firefox: true,
    safari: true
  },
  '720p_3': {
    width: 1280,
    height: 720,
    frameRate: 30,
    bitrate: 1710,
    chrome: true,
    firefox: true,
    safari: true
  },
  '720p_5': {
    width: 960,
    height: 720,
    frameRate: 15,
    bitrate: 910,
    chrome: true,
    firefox: true,
    safari: true
  },
  '720p_6': {
    width: 960,
    height: 720,
    frameRate: 30,
    bitrate: 1380,
    chrome: true,
    firefox: true,
    safari: true
  },
  '1080p_1': {
    width: 1920,
    height: 1080,
    frameRate: 15,
    bitrate: 2080,
    chrome: true,
    firefox: false,
    safari: true
  },
  '1080p_2': {
    width: 1920,
    height: 1080,
    frameRate: 30,
    bitrate: 3000,
    chrome: true,
    firefox: false,
    safari: true
  },
  '1080p_3': {
    width: 1920,
    height: 1080,
    frameRate: 30,
    bitrate: 3150,
    chrome: true,
    firefox: false,
    safari: true
  },
  '1080p_5': {
    width: 1920,
    height: 1080,
    frameRate: 60,
    bitrate: 4780,
    chrome: true,
    firefox: false,
    safari: true
  },
  '1440p': {
    width: 2560,
    height: 1440,
    frameRate: 30,
    bitrate: 4850,
    chrome: true,
    firefox: false,
    safari: true
  },
  '1440p_1': {
    width: 2560,
    height: 1440,
    frameRate: 30,
    bitrate: 4850,
    chrome: true,
    firefox: false,
    safari: true
  },
  '1440p_2': {
    width: 2560,
    height: 1440,
    frameRate: 60,
    bitrate: 7350,
    chrome: true,
    firefox: false,
    safari: true
  },
  '4K_1': {
    width: 3840,
    height: 2160,
    frameRate: 30,
    bitrate: 8910,
    chrome: true,
    firefox: false,
    safari: true
  },
  '4K_3': {
    width: 3840,
    height: 2160,
    frameRate: 60,
    bitrate: 13500,
    chrome: true,
    firefox: false,
    safari: true
  },
  default: {
    width: 640,
    height: 480,
    frameRate: 15,
    bitrate: 500,
    chrome: true,
    firefox: true,
    safari: true
  }
};

export const LookupAgoraVideoProfile = (profileName: string): AgoraVideoProfile => {
  if (AllAgoraVideoProfiles[profileName]) {
    return AllAgoraVideoProfiles[profileName];
  } else {
    // tslint:disable-next-line: no-string-literal
    return AllAgoraVideoProfiles['default'];
  }
};
