import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  AppSettings,
  EpisodeSkipData,
  SkipSettings,
  PlaybackSettings,
  TraktCredentials,
  DebridSettings,
  DEFAULT_APP_SETTINGS,
  DEFAULT_SKIP_SETTINGS,
  DEFAULT_PLAYBACK_SETTINGS,
  DEFAULT_TRAKT_CREDENTIALS,
  DEFAULT_DEBRID_SETTINGS,
} from "@/types";

const STORAGE_KEYS = {
  SKIP_SETTINGS: "@streamplayer/skip_settings",
  PLAYBACK_SETTINGS: "@streamplayer/playback_settings",
  TRAKT_CREDENTIALS: "@streamplayer/trakt_credentials",
  DEBRID_SETTINGS: "@streamplayer/debrid_settings",
  MANUAL_SKIPS_PREFIX: "@streamplayer/manual_skip_",
  PLAYBACK_POSITION_PREFIX: "@streamplayer/position_",
};

export async function loadSkipSettings(): Promise<SkipSettings> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SKIP_SETTINGS);
    if (data) {
      return { ...DEFAULT_SKIP_SETTINGS, ...JSON.parse(data) };
    }
    return DEFAULT_SKIP_SETTINGS;
  } catch (error) {
    console.error("Failed to load skip settings:", error);
    return DEFAULT_SKIP_SETTINGS;
  }
}

export async function saveSkipSettings(settings: SkipSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SKIP_SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save skip settings:", error);
  }
}

export async function loadPlaybackSettings(): Promise<PlaybackSettings> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PLAYBACK_SETTINGS);
    if (data) {
      return { ...DEFAULT_PLAYBACK_SETTINGS, ...JSON.parse(data) };
    }
    return DEFAULT_PLAYBACK_SETTINGS;
  } catch (error) {
    console.error("Failed to load playback settings:", error);
    return DEFAULT_PLAYBACK_SETTINGS;
  }
}

export async function savePlaybackSettings(settings: PlaybackSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.PLAYBACK_SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save playback settings:", error);
  }
}

export async function loadTraktCredentials(): Promise<TraktCredentials> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.TRAKT_CREDENTIALS);
    if (data) {
      return { ...DEFAULT_TRAKT_CREDENTIALS, ...JSON.parse(data) };
    }
    return DEFAULT_TRAKT_CREDENTIALS;
  } catch (error) {
    console.error("Failed to load Trakt credentials:", error);
    return DEFAULT_TRAKT_CREDENTIALS;
  }
}

export async function saveTraktCredentials(credentials: TraktCredentials): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.TRAKT_CREDENTIALS, JSON.stringify(credentials));
  } catch (error) {
    console.error("Failed to save Trakt credentials:", error);
  }
}

export async function clearTraktCredentials(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.TRAKT_CREDENTIALS);
  } catch (error) {
    console.error("Failed to clear Trakt credentials:", error);
  }
}

export async function loadDebridSettings(): Promise<DebridSettings> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.DEBRID_SETTINGS);
    if (data) {
      return { ...DEFAULT_DEBRID_SETTINGS, ...JSON.parse(data) };
    }
    return DEFAULT_DEBRID_SETTINGS;
  } catch (error) {
    console.error("Failed to load Debrid settings:", error);
    return DEFAULT_DEBRID_SETTINGS;
  }
}

export async function saveDebridSettings(settings: DebridSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.DEBRID_SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save Debrid settings:", error);
  }
}

export function getEpisodeStorageKey(imdbId: string, season: number, episode: number): string {
  return `${STORAGE_KEYS.MANUAL_SKIPS_PREFIX}${imdbId}_s${String(season).padStart(2, "0")}e${String(episode).padStart(2, "0")}`;
}

export async function loadManualSkipData(imdbId: string, season: number, episode: number): Promise<EpisodeSkipData | null> {
  try {
    const key = getEpisodeStorageKey(imdbId, season, episode);
    const data = await AsyncStorage.getItem(key);
    if (data) {
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.error("Failed to load manual skip data:", error);
    return null;
  }
}

export async function saveManualSkipData(data: EpisodeSkipData): Promise<void> {
  try {
    const imdbId = data.episodeId.split("_")[0];
    const key = getEpisodeStorageKey(imdbId, data.season, data.episode);
    await AsyncStorage.setItem(key, JSON.stringify({ ...data, lastUpdated: Date.now() }));
  } catch (error) {
    console.error("Failed to save manual skip data:", error);
  }
}

export async function loadPlaybackPosition(videoUri: string): Promise<number> {
  try {
    const key = `${STORAGE_KEYS.PLAYBACK_POSITION_PREFIX}${encodeURIComponent(videoUri)}`;
    const data = await AsyncStorage.getItem(key);
    if (data) {
      return parseInt(data, 10);
    }
    return 0;
  } catch (error) {
    console.error("Failed to load playback position:", error);
    return 0;
  }
}

export async function savePlaybackPosition(videoUri: string, position: number): Promise<void> {
  try {
    const key = `${STORAGE_KEYS.PLAYBACK_POSITION_PREFIX}${encodeURIComponent(videoUri)}`;
    await AsyncStorage.setItem(key, String(Math.floor(position)));
  } catch (error) {
    console.error("Failed to save playback position:", error);
  }
}

export async function loadAllSettings(): Promise<AppSettings> {
  const [skip, playback, trakt, debrid] = await Promise.all([
    loadSkipSettings(),
    loadPlaybackSettings(),
    loadTraktCredentials(),
    loadDebridSettings(),
  ]);
  
  return { skip, playback, trakt, debrid };
}

export async function clearAllSettings(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const appKeys = keys.filter((key) => key.startsWith("@streamplayer/"));
    await AsyncStorage.multiRemove(appKeys);
  } catch (error) {
    console.error("Failed to clear all settings:", error);
  }
}
