export type SkipType = "intro" | "credits" | "recap" | "preview";

export interface SkipMarker {
  type: SkipType;
  startTime: number;
  endTime: number;
  source: "chapter" | "fingerprint" | "manual";
}

export interface EpisodeSkipData {
  episodeId: string;
  showName: string;
  season: number;
  episode: number;
  introSkipSeconds: number;
  creditsSkipSeconds: number;
  lastUpdated: number;
}

export interface SkipSettings {
  enabledChapterSkip: boolean;
  enabledAudioSkip: boolean;
  enabledCommunitySkip: boolean;
  enabledManualSkip: boolean;
  autoSkipEnabled: boolean;
  skipFadeTimeMs: number;
  globalIntroSkipSeconds: number;
  globalCreditsSkipSeconds: number;
}

export interface PlaybackSettings {
  defaultSpeed: number;
  rememberPosition: boolean;
  autoPlayNext: boolean;
}

export interface TraktCredentials {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  username: string | null;
}

export interface DebridSettings {
  service: "none" | "realdebrid" | "alldebrid" | "premiumize" | "torbox";
  apiKey: string;
  isConnected: boolean;
}

export interface AppSettings {
  skip: SkipSettings;
  playback: PlaybackSettings;
  trakt: TraktCredentials;
  debrid: DebridSettings;
}

export interface VideoInfo {
  uri: string;
  title: string;
  showName?: string;
  season?: number;
  episode?: number;
  imdbId?: string;
  duration: number;
  currentPosition: number;
  playbackSpeed: number;
  chapters: ChapterData[];
}

export interface ChapterData {
  title: string;
  startTime: number;
  endTime: number;
}

export type RootStackParamList = {
  Player: {
    uri?: string;
    title?: string;
    showName?: string;
    imdbId?: string;
    season?: number;
    episode?: number;
  } | undefined;
  Settings: undefined;
  SkipConfiguration: undefined;
  TraktAuth: undefined;
};

export const DEFAULT_SKIP_SETTINGS: SkipSettings = {
  enabledChapterSkip: true,
  enabledAudioSkip: true,
  enabledCommunitySkip: true,
  enabledManualSkip: true,
  autoSkipEnabled: false,
  skipFadeTimeMs: 500,
  globalIntroSkipSeconds: 0,
  globalCreditsSkipSeconds: 0,
};

export const DEFAULT_PLAYBACK_SETTINGS: PlaybackSettings = {
  defaultSpeed: 1.0,
  rememberPosition: true,
  autoPlayNext: true,
};

export const DEFAULT_TRAKT_CREDENTIALS: TraktCredentials = {
  accessToken: null,
  refreshToken: null,
  expiresAt: null,
  username: null,
};

export const DEFAULT_DEBRID_SETTINGS: DebridSettings = {
  service: "none",
  apiKey: "",
  isConnected: false,
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  skip: DEFAULT_SKIP_SETTINGS,
  playback: DEFAULT_PLAYBACK_SETTINGS,
  trakt: DEFAULT_TRAKT_CREDENTIALS,
  debrid: DEFAULT_DEBRID_SETTINGS,
};
