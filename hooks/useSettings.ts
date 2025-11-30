import { useState, useEffect, useCallback } from "react";
import {
  AppSettings,
  SkipSettings,
  PlaybackSettings,
  TraktCredentials,
  DebridSettings,
  DEFAULT_APP_SETTINGS,
} from "@/types";
import {
  loadAllSettings,
  saveSkipSettings,
  savePlaybackSettings,
  saveTraktCredentials,
  saveDebridSettings,
  clearTraktCredentials,
} from "@/storage/settingsStorage";

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAllSettings().then((loaded) => {
      setSettings(loaded);
      setIsLoading(false);
    });
  }, []);

  const updateSkipSettings = useCallback(async (updates: Partial<SkipSettings>) => {
    const newSkipSettings = { ...settings.skip, ...updates };
    setSettings((prev) => ({ ...prev, skip: newSkipSettings }));
    await saveSkipSettings(newSkipSettings);
  }, [settings.skip]);

  const updatePlaybackSettings = useCallback(async (updates: Partial<PlaybackSettings>) => {
    const newPlaybackSettings = { ...settings.playback, ...updates };
    setSettings((prev) => ({ ...prev, playback: newPlaybackSettings }));
    await savePlaybackSettings(newPlaybackSettings);
  }, [settings.playback]);

  const updateTraktCredentials = useCallback(async (credentials: TraktCredentials) => {
    setSettings((prev) => ({ ...prev, trakt: credentials }));
    await saveTraktCredentials(credentials);
  }, []);

  const disconnectTrakt = useCallback(async () => {
    const emptyCredentials: TraktCredentials = {
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      username: null,
    };
    setSettings((prev) => ({ ...prev, trakt: emptyCredentials }));
    await clearTraktCredentials();
  }, []);

  const updateDebridSettings = useCallback(async (updates: Partial<DebridSettings>) => {
    const newDebridSettings = { ...settings.debrid, ...updates };
    setSettings((prev) => ({ ...prev, debrid: newDebridSettings }));
    await saveDebridSettings(newDebridSettings);
  }, [settings.debrid]);

  return {
    settings,
    isLoading,
    updateSkipSettings,
    updatePlaybackSettings,
    updateTraktCredentials,
    disconnectTrakt,
    updateDebridSettings,
  };
}
