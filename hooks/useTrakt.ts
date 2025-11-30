import { useEffect, useCallback, useRef } from "react";
import { traktService, createScrobbleData } from "@/services/traktService";
import { useSettings } from "@/hooks/useSettings";

interface UseTraktOptions {
  imdbId?: string;
  title: string;
  season?: number;
  episode?: number;
}

export function useTrakt(options: UseTraktOptions) {
  const { settings } = useSettings();
  const lastProgress = useRef(0);
  const hasScrobbledStart = useRef(false);
  const hasScrobbled80 = useRef(false);
  const isPlaying = useRef(false);

  useEffect(() => {
    traktService.initialize();
  }, []);

  const resetScrobbleState = useCallback(() => {
    hasScrobbledStart.current = false;
    hasScrobbled80.current = false;
    lastProgress.current = 0;
  }, []);

  const scrobbleStart = useCallback(async () => {
    if (!settings.trakt.accessToken) return;
    if (hasScrobbledStart.current) return;

    const data = createScrobbleData(
      options.imdbId,
      options.title,
      options.season,
      options.episode,
      0
    );

    const success = await traktService.scrobbleStart(data);
    if (success) {
      hasScrobbledStart.current = true;
      isPlaying.current = true;
    }
  }, [settings.trakt.accessToken, options]);

  const scrobblePause = useCallback(async (progress: number) => {
    if (!settings.trakt.accessToken) return;
    if (!isPlaying.current) return;

    const data = createScrobbleData(
      options.imdbId,
      options.title,
      options.season,
      options.episode,
      progress
    );

    await traktService.scrobblePause(data);
    isPlaying.current = false;
  }, [settings.trakt.accessToken, options]);

  const scrobbleStop = useCallback(async (progress: number) => {
    if (!settings.trakt.accessToken) return;

    const data = createScrobbleData(
      options.imdbId,
      options.title,
      options.season,
      options.episode,
      progress
    );

    await traktService.scrobbleStop(data);
    isPlaying.current = false;
  }, [settings.trakt.accessToken, options]);

  const updateProgress = useCallback(async (currentTime: number, duration: number) => {
    if (!settings.trakt.accessToken || duration === 0) return;

    const progress = (currentTime / duration) * 100;
    lastProgress.current = progress;

    if (progress >= 80 && !hasScrobbled80.current) {
      hasScrobbled80.current = true;
      
      const data = createScrobbleData(
        options.imdbId,
        options.title,
        options.season,
        options.episode,
        progress
      );
      await traktService.scrobbleStop(data);
    }
  }, [settings.trakt.accessToken, options]);

  const onPlay = useCallback(async () => {
    if (!hasScrobbledStart.current) {
      await scrobbleStart();
    } else if (!isPlaying.current) {
      const data = createScrobbleData(
        options.imdbId,
        options.title,
        options.season,
        options.episode,
        lastProgress.current
      );
      await traktService.scrobbleStart(data);
      isPlaying.current = true;
    }
  }, [scrobbleStart, options]);

  const onPause = useCallback(async () => {
    await scrobblePause(lastProgress.current);
  }, [scrobblePause]);

  const onStop = useCallback(async () => {
    await scrobbleStop(lastProgress.current);
    resetScrobbleState();
  }, [scrobbleStop, resetScrobbleState]);

  return {
    onPlay,
    onPause,
    onStop,
    updateProgress,
    resetScrobbleState,
    isAuthenticated: !!settings.trakt.accessToken,
  };
}
