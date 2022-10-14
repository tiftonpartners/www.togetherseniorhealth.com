const PREFIX = 'av';
const CATEGORY = {
  AGORA: 'agora',
  SOCKET: 'socket'
};

export const GA = {
  EVENT: 'event'
};

export const DIMENSIONS: string[] = [];
export const METRICS: string[] = [];

export const GAEvent = {
  // Page information ==========================================================
  page_view: {
    action: 'page_view'
  },
  userInfo: {
    action: 'av_user_info',
    category: CATEGORY.AGORA,
    label: 'User info'
  },
  // Agora Stats ===============================================================
  joined: {
    action: `${PREFIX}_agora_channel_joined`,
    category: CATEGORY.AGORA,
    label: 'Joined'
  },
  connected: {
    action: `${PREFIX}_agora_channel_connected`,
    category: CATEGORY.AGORA,
    label: 'Connected'
  },
  reconnecting: {
    action: `${PREFIX}_agora_channel_reconnecting`,
    category: CATEGORY.AGORA,
    label: 'Reconnecting'
  },
  downlinkNetworkQuality: {
    action: `${PREFIX}_agora_downlink_network_quality`,
    category: CATEGORY.AGORA,
    label: 'Downlink network quality'
  },
  uplinkNetworkQuality: {
    action: `${PREFIX}_agora_uplink_network_quality`,
    category: CATEGORY.AGORA,
    label: 'Uplink network quality'
  },
  duration: {
    action: `${PREFIX}_agora_rtc_stats_duration`,
    category: CATEGORY.AGORA,
    label: 'Duration'
  },
  outgoingAvailableBandwidth: {
    action: `${PREFIX}_agora_rtc_stats_outgoing_available_bandwidth`,
    category: CATEGORY.AGORA,
    label: 'Outgoing available bandwidth'
  },
  rtt: {
    action: `${PREFIX}_agora_rtc_stats_rtt`,
    category: CATEGORY.AGORA,
    label: 'RTT'
  },
  recvBitrate: {
    action: `${PREFIX}_agora_rtc_stats_recv_bitrate`,
    category: CATEGORY.AGORA,
    label: 'Received bitrate'
  },
  recvBytes: {
    action: `${PREFIX}_agora_rtc_stats_recv_bytes`,
    category: CATEGORY.AGORA,
    label: 'Received bytes'
  },
  sendBitrate: {
    action: `${PREFIX}_agora_rtc_stats_send_bitrate`,
    category: CATEGORY.AGORA,
    label: 'Send bitrate'
  },
  sendBytes: {
    action: `${PREFIX}_agora_rtc_stats_send_bytes`,
    category: CATEGORY.AGORA,
    label: 'Sent bytes'
  },
  userCount: {
    action: `${PREFIX}_agora_rtc_stats_user_count`,
    category: CATEGORY.AGORA,
    label: 'User count'
  },
  audioRoundTripLatency: {
    action: `${PREFIX}_agora_audio_roundtrip_latency`,
    category: CATEGORY.AGORA,
    label: 'Agora audio roundtrip latency'
  },
  audioReceiveLatency: {
    action: `${PREFIX}_agora_audio_receive_latency`,
    category: CATEGORY.AGORA,
    label: 'Agora audio receive latency'
  },
  audioSendLatency: {
    action: `${PREFIX}_agora_audio_send_latency`,
    category: CATEGORY.AGORA,
    label: 'Agora audio send latency'
  },
  videoRoundTripLatency: {
    action: `${PREFIX}_agora_video_roundtrip_latency`,
    category: CATEGORY.AGORA,
    label: 'Agora video roundtrip latency'
  },
  videoReceiveLatency: {
    action: `${PREFIX}_agora_video_receive_latency`,
    category: CATEGORY.AGORA,
    label: 'Agora video receive latency'
  },
  videoSendLatency: {
    action: `${PREFIX}_agora_video_send_latency`,
    category: CATEGORY.AGORA,
    label: 'Agora video send latency'
  },
  // Socket Stats ==============================================================
  socketConnect: {
    action: `${PREFIX}_socket_connect`,
    category: CATEGORY.SOCKET,
    label: 'Socket connect'
  },
  groupView: {
    action: `${PREFIX}_socket_message_group_view`,
    category: CATEGORY.SOCKET,
    label: 'Group view'
  },
  instructorView: {
    action: `${PREFIX}_socket_message_instructor_view`,
    category: CATEGORY.SOCKET,
    label: 'Instructor view'
  },
  spotlightView: {
    action: `${PREFIX}_socket_message_spotlight_view`,
    category: CATEGORY.SOCKET,
    label: 'Spotlight view'
  },
  spotlightEvent: {
    action: `${PREFIX}_socket_message_spotlight_event`,
    category: CATEGORY.SOCKET,
    label: 'Spotlight event'
  },
  muteAll: {
    action: `${PREFIX}_socket_message_mute_all`,
    category: CATEGORY.SOCKET,
    label: 'Mute all'
  },
  micOn: {
    action: `${PREFIX}_socket_message_mic_on`,
    category: CATEGORY.SOCKET,
    label: 'Mic on'
  },
  cameraOn: {
    action: `${PREFIX}_socket_message_camera_on`,
    category: CATEGORY.SOCKET,
    label: 'Camera on'
  },
  play: {
    action: `${PREFIX}_socket_message_play`,
    category: CATEGORY.SOCKET,
    label: 'Play'
  },
  recordOn: {
    action: `${PREFIX}_socket_message_record_on`,
    category: CATEGORY.SOCKET,
    label: 'Record on'
  }
};
