import React, { useState, useCallback, useRef, useEffect } from "react";
import { StyleSheet, View, Pressable, Platform, LayoutChangeEvent } from "react-native";
import Slider from "@react-native-community/slider";
import { PanGestureHandler, GestureHandlerRootView } from "react-native-gesture-handler";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEvent } from "expo";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { TimeDisplay } from "@/components/TimeDisplay";
import { SkipButton } from "@/components/SkipButton";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { SkipMarker, SkipSettings } from "@/types";

interface VideoPlayerProps {
  uri: string;
  title?: string;
  onSettingsPress: () => void;
  skipSettings: SkipSettings;
  communitySkipMarkers?: SkipMarker[];
  manualIntroSkip?: number;
  manualCreditsSkip?: number;
  onProgress?: (position: number, duration: number) => void;
  onPreviousEpisode?: () => void;
  onNextEpisode?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export function VideoPlayer({
  uri,
  title,
  onSettingsPress,
  skipSettings,
  communitySkipMarkers = [],
  manualIntroSkip = 0,
  manualCreditsSkip = 0,
  onProgress,
  onPreviousEpisode,
  onNextEpisode,
}: VideoPlayerProps) {
  const [controlsVisible, setControlsVisible] = useState(true);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [showSpeedSlider, setShowSpeedSlider] = useState(false);
  const [showAudioDelay, setShowAudioDelay] = useState(false);
  const [showSubtitleDelay, setShowSubtitleDelay] = useState(false);
  const [showTrackSelection, setShowTrackSelection] = useState(false);
  const [audioDelay, setAudioDelay] = useState(0); // ms
  const [subtitleDelay, setSubtitleDelay] = useState(0); // ms
  const [ccEnabled, setCcEnabled] = useState(true);
  const [selectedAudioTrack, setSelectedAudioTrack] = useState("auto");
  const [selectedSubtitleTrack, setSelectedSubtitleTrack] = useState("auto");
  const [progressBarWidth, setProgressBarWidth] = useState(0);
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);
  const [previewPosition, setPreviewPosition] = useState(0);
  const [activeSkipMarker, setActiveSkipMarker] = useState<SkipMarker | null>(null);
  const [autoSkipCountdown, setAutoSkipCountdown] = useState<number | undefined>(undefined);
  
  // Speed slider config: maps 0-100 to 0.25x - 3.0x with 1.0x at middle (50)
  const MIN_SPEED = 0.25;
  const NORMAL_SPEED = 1.0;
  const MAX_SPEED = 3.0;
  
  const speedToSliderValue = (speed: number) => {
    if (speed <= NORMAL_SPEED) {
      // 0.25x to 1.0x maps to 0-50
      return ((speed - MIN_SPEED) / (NORMAL_SPEED - MIN_SPEED)) * 50;
    } else {
      // 1.0x to 3.0x maps to 50-100
      return 50 + ((speed - NORMAL_SPEED) / (MAX_SPEED - NORMAL_SPEED)) * 50;
    }
  };
  
  const sliderValueToSpeed = (value: number) => {
    let speed;
    if (value <= 50) {
      // 0-50 maps to 0.25x-1.0x
      speed = MIN_SPEED + (value / 50) * (NORMAL_SPEED - MIN_SPEED);
    } else {
      // 50-100 maps to 1.0x-3.0x
      speed = NORMAL_SPEED + ((value - 50) / 50) * (MAX_SPEED - NORMAL_SPEED);
    }
    // Snap to nearest 0.05 increment
    return Math.round(speed * 20) / 20;
  };

  // Audio/Subtitle delay config: -5000ms to +5000ms with 0 at middle (50)
  const MIN_DELAY = -5000;
  const NORMAL_DELAY = 0;
  const MAX_DELAY = 5000;

  const delayToSliderValue = (delay: number) => {
    if (delay <= NORMAL_DELAY) {
      // -5000 to 0 maps to 0-50
      return ((delay - MIN_DELAY) / (NORMAL_DELAY - MIN_DELAY)) * 50;
    } else {
      // 0 to 5000 maps to 50-100
      return 50 + ((delay - NORMAL_DELAY) / (MAX_DELAY - NORMAL_DELAY)) * 50;
    }
  };

  const sliderValueToDelay = (value: number) => {
    let delay;
    if (value <= 50) {
      // 0-50 maps to -5000 to 0
      delay = MIN_DELAY + (value / 50) * (NORMAL_DELAY - MIN_DELAY);
    } else {
      // 50-100 maps to 0 to 5000
      delay = NORMAL_DELAY + ((value - 50) / 50) * (MAX_DELAY - NORMAL_DELAY);
    }
    // Snap to nearest 50ms increment
    return Math.round(delay / 50) * 50;
  };
  
  const controlsOpacity = useSharedValue(1);
  const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null);
  const autoSkipInterval = useRef<NodeJS.Timeout | null>(null);
  const holdInterval = useRef<NodeJS.Timeout | null>(null);
  const isHoldingRef = useRef(false);
  const holdSpeedRef = useRef(1);
  const lastTapTime = useRef(0);
  const lastTapLocation = useRef<'left' | 'right' | 'middle' | null>(null);
  const doubleTapHoldInterval = useRef<NodeJS.Timeout | null>(null);
  const [videoWidth, setVideoWidth] = useState(0);

  const handleVideoLayout = useCallback((event: any) => {
    setVideoWidth(event.nativeEvent.layout.width);
  }, []);

  const player = useVideoPlayer(uri, (player) => {
    player.loop = false;
    player.play();
  });

  const { isPlaying: playerIsPlaying } = useEvent(player, "playingChange", {
    isPlaying: player.playing,
  });

  useEffect(() => {
    setIsPlaying(playerIsPlaying);
  }, [playerIsPlaying]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (player) {
        setCurrentPosition(player.currentTime);
        setDuration(player.duration || 0);
        onProgress?.(player.currentTime, player.duration || 0);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [player, onProgress]);

  useEffect(() => {
    if (duration === 0) {
      setActiveSkipMarker(null);
      return;
    }

    const position = currentPosition;
    
    // Priority 1: Check community skip markers
    if (skipSettings.enabledCommunitySkip && communitySkipMarkers.length > 0) {
      for (const marker of communitySkipMarkers) {
        if (marker.type === "intro" && position >= marker.startTime && position < marker.endTime) {
          setActiveSkipMarker(marker);
          return;
        }
        if (marker.type === "credits" && position >= marker.startTime - 10 && position < marker.endTime) {
          setActiveSkipMarker(marker);
          return;
        }
      }
    }

    // Priority 2: Use manual fallback settings
    if (!skipSettings.enabledManualSkip) {
      setActiveSkipMarker(null);
      return;
    }
    
    if (manualIntroSkip > 0 && position < manualIntroSkip) {
      setActiveSkipMarker({
        type: "intro",
        startTime: 0,
        endTime: manualIntroSkip,
        source: "manual",
      });
    } else if (manualCreditsSkip > 0 && duration > 0) {
      const creditsStart = duration - manualCreditsSkip;
      if (position >= creditsStart - 10 && position < duration - 5) {
        setActiveSkipMarker({
          type: "credits",
          startTime: creditsStart,
          endTime: duration,
          source: "manual",
        });
      } else if (activeSkipMarker?.type === "credits") {
        setActiveSkipMarker(null);
      }
    } else if (activeSkipMarker?.type === "intro") {
      setActiveSkipMarker(null);
    }
  }, [currentPosition, duration, manualIntroSkip, manualCreditsSkip, skipSettings.enabledManualSkip, skipSettings.enabledCommunitySkip, communitySkipMarkers, activeSkipMarker?.type]);

  useEffect(() => {
    if (activeSkipMarker && skipSettings.autoSkipEnabled) {
      let countdown = 3;
      setAutoSkipCountdown(countdown);
      
      autoSkipInterval.current = setInterval(() => {
        countdown -= 1;
        if (countdown <= 0) {
          handleSkip();
          setAutoSkipCountdown(undefined);
          if (autoSkipInterval.current) {
            clearInterval(autoSkipInterval.current);
          }
        } else {
          setAutoSkipCountdown(countdown);
        }
      }, 1000);
    } else {
      setAutoSkipCountdown(undefined);
    }

    return () => {
      if (autoSkipInterval.current) {
        clearInterval(autoSkipInterval.current);
      }
    };
  }, [activeSkipMarker, skipSettings.autoSkipEnabled]);

  const handleSkip = useCallback(() => {
    if (activeSkipMarker && player) {
      player.currentTime = activeSkipMarker.endTime;
      setActiveSkipMarker(null);
    }
  }, [activeSkipMarker, player]);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    controlsOpacity.value = withTiming(1, { duration: 200 });
    
    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current);
    }
    
    hideControlsTimeout.current = setTimeout(() => {
      if (isPlaying) {
        // Reset menus before hiding controls
        setShowSpeedSlider(false);
        setShowAudioDelay(false);
        setShowSubtitleDelay(false);
        setShowTrackSelection(false);
        controlsOpacity.value = withTiming(0, { duration: 300 });
        setControlsVisible(false);
      }
    }, 4000);
  }, [isPlaying, controlsOpacity]);

  const togglePlayPause = useCallback(() => {
    if (player) {
      if (isPlaying) {
        player.pause();
      } else {
        player.play();
      }
    }
    showControls();
  }, [player, isPlaying, showControls]);

  const seekRelative = useCallback((seconds: number) => {
    if (player) {
      player.currentTime = Math.max(0, Math.min(duration, player.currentTime + seconds));
    }
    showControls();
  }, [player, duration, showControls]);

  const handleRewindPress = useCallback(() => {
    seekRelative(-10);
  }, [seekRelative]);

  const handleRewindPressIn = useCallback(() => {
    isHoldingRef.current = true;
    holdSpeedRef.current = 1;
    
    holdInterval.current = setInterval(() => {
      if (player && isHoldingRef.current) {
        holdSpeedRef.current += 0.1;
        const seekAmount = -10 * holdSpeedRef.current;
        seekRelative(seekAmount);
      }
    }, 100);
  }, [player, seekRelative]);

  const handleRewindPressOut = useCallback(() => {
    isHoldingRef.current = false;
    if (holdInterval.current) {
      clearInterval(holdInterval.current);
    }
  }, []);

  const handleForwardPressIn = useCallback(() => {
    isHoldingRef.current = true;
    holdSpeedRef.current = 1;
    
    holdInterval.current = setInterval(() => {
      if (player && isHoldingRef.current) {
        holdSpeedRef.current += 0.1;
        const seekAmount = 10 * holdSpeedRef.current;
        seekRelative(seekAmount);
      }
    }, 100);
  }, [player, seekRelative]);

  const handleForwardPressOut = useCallback(() => {
    isHoldingRef.current = false;
    if (holdInterval.current) {
      clearInterval(holdInterval.current);
    }
  }, []);

  const handleSpeedChange = useCallback((value: number) => {
    const newSpeed = parseFloat(sliderValueToSpeed(value).toFixed(2));
    setPlaybackSpeed(newSpeed);
    if (player) {
      player.playbackRate = newSpeed;
    }
  }, [player, sliderValueToSpeed]);

  const toggleSpeedSlider = useCallback(() => {
    setShowSpeedSlider(!showSpeedSlider);
    setShowAudioDelay(false);
    setShowSubtitleDelay(false);
    setShowTrackSelection(false);
    showControls();
  }, [showSpeedSlider, showControls]);

  const toggleAudioDelay = useCallback(() => {
    setShowAudioDelay(!showAudioDelay);
    setShowSpeedSlider(false);
    setShowSubtitleDelay(false);
    setShowTrackSelection(false);
    showControls();
  }, [showAudioDelay, showControls]);

  const toggleSubtitleDelay = useCallback(() => {
    setShowSubtitleDelay(!showSubtitleDelay);
    setShowSpeedSlider(false);
    setShowAudioDelay(false);
    setShowTrackSelection(false);
    showControls();
  }, [showSubtitleDelay, showControls]);

  const toggleTrackSelection = useCallback(() => {
    setShowTrackSelection(!showTrackSelection);
    setShowSpeedSlider(false);
    setShowAudioDelay(false);
    setShowSubtitleDelay(false);
    showControls();
  }, [showTrackSelection, showControls]);

  const handleAudioDelayChange = useCallback((value: number) => {
    const newDelay = sliderValueToDelay(value);
    setAudioDelay(newDelay);
  }, [sliderValueToDelay]);

  const handleSubtitleDelayChange = useCallback((value: number) => {
    const newDelay = sliderValueToDelay(value);
    setSubtitleDelay(newDelay);
  }, [sliderValueToDelay]);

  const handleProgressBarLayout = useCallback((event: LayoutChangeEvent) => {
    setProgressBarWidth(event.nativeEvent.layout.width);
  }, []);

  const handleProgressTap = useCallback((event: any) => {
    const { locationX } = event.nativeEvent;
    if (progressBarWidth > 0 && player && duration > 0) {
      const percentage = locationX / progressBarWidth;
      const newTime = percentage * duration;
      player.currentTime = Math.max(0, Math.min(duration, newTime));
    }
    showControls();
  }, [progressBarWidth, player, duration, showControls]);

  const handleProgressDragStart = useCallback(() => {
    setIsDraggingProgress(true);
  }, []);

  const handleProgressChange = useCallback((value: number) => {
    if (!player || duration === 0) return;
    const newTime = (value / 100) * duration;
    setPreviewTime(newTime);
    setPreviewPosition(value);
    if (isDraggingProgress) {
      player.currentTime = Math.max(0, Math.min(duration, newTime));
    }
  }, [player, duration, isDraggingProgress]);

  const handleProgressSliderStart = useCallback(() => {
    setIsDraggingProgress(true);
  }, []);

  const handleProgressSliderEnd = useCallback(() => {
    setIsDraggingProgress(false);
    showControls();
  }, [showControls]);

  const closeMenus = useCallback(() => {
    if (showSpeedSlider || showAudioDelay || showSubtitleDelay || showTrackSelection) {
      setShowSpeedSlider(false);
      setShowAudioDelay(false);
      setShowSubtitleDelay(false);
      setShowTrackSelection(false);
    }
  }, [showSpeedSlider, showAudioDelay, showSubtitleDelay, showTrackSelection]);

  const handleVideoPress = useCallback((event: any) => {
    const { locationX } = event.nativeEvent;
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTime.current;
    const isDoubleTap = timeSinceLastTap < 300 && lastTapLocation.current !== null;
    
    // Determine which region was tapped
    const thirdWidth = videoWidth / 3;
    let region: 'left' | 'right' | 'middle' = 'middle';
    if (locationX < thirdWidth) region = 'left';
    else if (locationX > thirdWidth * 2) region = 'right';
    
    if (isDoubleTap && lastTapLocation.current === region) {
      // Double tap on same region - start FF/RW hold
      if (doubleTapHoldInterval.current) {
        clearTimeout(doubleTapHoldInterval.current);
      }
      
      if (region === 'left') {
        handleRewindPressIn();
      } else if (region === 'right') {
        handleForwardPressIn();
      }
      
      // Stop the hold after user releases (simulated by timeout)
      doubleTapHoldInterval.current = setTimeout(() => {
        if (region === 'left') {
          handleRewindPressOut();
        } else if (region === 'right') {
          handleForwardPressOut();
        }
      }, 3000); // 3 second max hold
      
      lastTapTime.current = 0; // Reset to prevent triple-tap
      lastTapLocation.current = null;
    } else {
      // Single tap
      if (showSpeedSlider || showAudioDelay || showSubtitleDelay || showTrackSelection) {
        closeMenus();
      } else if (region === 'middle') {
        togglePlayPause();
      } else {
        showControls();
      }
      
      lastTapTime.current = now;
      lastTapLocation.current = region;
    }
  }, [videoWidth, togglePlayPause, closeMenus, showControls, handleRewindPressIn, handleRewindPressOut, handleForwardPressIn, handleForwardPressOut, showSpeedSlider, showAudioDelay, showSubtitleDelay, showTrackSelection]);

  const controlsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: controlsOpacity.value,
  }));

  const progress = duration > 0 ? (currentPosition / duration) * 100 : 0;

  const MediaButtonItem = ({ 
    icon, 
    label, 
    onPress, 
    disabled, 
    onPressIn, 
    onPressOut 
  }: {
    icon: string;
    label: string;
    onPress?: () => void;
    disabled?: boolean;
    onPressIn?: () => void;
    onPressOut?: () => void;
  }) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
      if (!disabled) {
        scale.value = withSpring(1.15, { damping: 10, stiffness: 200 });
      }
      onPressIn?.();
    };

    const handlePressOut = () => {
      scale.value = withSpring(1, { damping: 10, stiffness: 200 });
      onPressOut?.();
    };

    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[
          styles.mediaButton,
          animatedStyle,
          { opacity: disabled ? 0.3 : 1 }
        ]}
      >
        <View style={styles.buttonIconContainer}>
          <Feather name={icon as any} size={22} color={Colors.dark.text} />
        </View>
        <ThemedText style={styles.buttonLabel}>{label}</ThemedText>
      </AnimatedPressable>
    );
  };

  return (
    <Pressable style={styles.container} onPress={showControls}>
      <Pressable
        onPress={handleVideoPress}
        onLayout={handleVideoLayout}
        style={styles.video}
      >
        <VideoView
          style={styles.videoInner}
          player={player}
          contentFit="contain"
          nativeControls={false}
        />
      </Pressable>

      <TimeDisplay
        currentPosition={currentPosition}
        duration={duration}
        playbackSpeed={playbackSpeed}
        visible={controlsVisible}
      />

      <Animated.View style={[styles.controls, controlsAnimatedStyle]} pointerEvents={controlsVisible ? "box-none" : "none"}>
        {title ? (
          <View style={styles.titleContainer}>
            <ThemedText style={styles.title} numberOfLines={1}>
              {title}
            </ThemedText>
          </View>
        ) : null}

        <Pressable 
          onPress={closeMenus}
          style={{ flex: 1 }}
          pointerEvents={showSpeedSlider || showAudioDelay || showSubtitleDelay || showTrackSelection ? "auto" : "none"}
        />

        <View style={styles.bottomControlsContainer}>
          {!showSpeedSlider && !showAudioDelay && !showSubtitleDelay && !showTrackSelection ? (
            <>
              <View style={styles.progressContainer}>
                <ThemedText style={styles.timeText}>{formatTime(currentPosition)}</ThemedText>
                <View style={styles.progressBarWrapper}>
                  <Slider
                    style={styles.progressSlider}
                    minimumValue={0}
                    maximumValue={100}
                    value={progress}
                    onValueChange={handleProgressChange}
                    onSlidingStart={handleProgressSliderStart}
                    onSlidingComplete={handleProgressSliderEnd}
                    minimumTrackTintColor={Colors.dark.accent}
                    maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
                    thumbTintColor={Colors.dark.accent}
                  />
                  {isDraggingProgress && (
                    <View style={[styles.previewWindow, { left: `${previewPosition}%` }]}>
                      <ThemedText style={styles.previewTime}>{formatTime(previewTime)}</ThemedText>
                    </View>
                  )}
                </View>
                <ThemedText style={styles.timeText}>{formatTime(duration)}</ThemedText>
              </View>

              {/* Media Controls Row */}
              <View style={styles.mediaControlsContainer}>
                <MediaButtonItem
                  icon="skip-back"
                  label="Prev Ep"
                  onPress={onPreviousEpisode}
                  disabled={!onPreviousEpisode}
                />
                <MediaButtonItem
                  icon="arrow-left"
                  label="Prev Ch"
                  onPress={() => seekRelative(-30)}
                />
                <MediaButtonItem
                  icon="rewind"
                  label="Rewind"
                  onPress={handleRewindPress}
                  onPressIn={handleRewindPressIn}
                  onPressOut={handleRewindPressOut}
                />
                <AnimatedPressable
                  onPress={togglePlayPause}
                  style={({ pressed }) => [
                    styles.playButtonCenter,
                    { opacity: pressed ? 0.8 : 1 }
                  ]}
                >
                  <Feather
                    name={isPlaying ? "pause" : "play"}
                    size={28}
                    color={Colors.dark.text}
                  />
                </AnimatedPressable>
                <MediaButtonItem
                  icon="fast-forward"
                  label="Forward"
                  onPress={() => seekRelative(10)}
                  onPressIn={handleForwardPressIn}
                  onPressOut={handleForwardPressOut}
                />
                <MediaButtonItem
                  icon="arrow-right"
                  label="Next Ch"
                  onPress={() => seekRelative(30)}
                />
                <MediaButtonItem
                  icon="skip-forward"
                  label="Next Ep"
                  onPress={onNextEpisode}
                  disabled={!onNextEpisode}
                />
              </View>
            </>
          ) : showSpeedSlider ? (
            /* Speed Slider */
            <View style={styles.speedSliderContainer}>
              <ThemedText style={styles.speedSliderLabel}>Speed: {playbackSpeed.toFixed(2)}x</ThemedText>
              <Slider
                style={styles.speedSlider}
                minimumValue={0}
                maximumValue={100}
                value={speedToSliderValue(playbackSpeed)}
                onValueChange={handleSpeedChange}
                minimumTrackTintColor={Colors.dark.accent}
                maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
                thumbTintColor={Colors.dark.accent}
              />
              <View style={styles.speedRangeLabels}>
                <ThemedText style={styles.speedRangeLabel}>0.25x</ThemedText>
                <ThemedText style={styles.speedRangeLabel}>1.0x</ThemedText>
                <ThemedText style={styles.speedRangeLabel}>3.0x</ThemedText>
              </View>
            </View>
          ) : showAudioDelay ? (
            /* Audio Delay Slider */
            <View style={styles.speedSliderContainer}>
              <ThemedText style={styles.speedSliderLabel}>Audio Delay: {audioDelay}ms</ThemedText>
              <Slider
                style={styles.speedSlider}
                minimumValue={0}
                maximumValue={100}
                value={delayToSliderValue(audioDelay)}
                onValueChange={handleAudioDelayChange}
                minimumTrackTintColor={Colors.dark.accent}
                maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
                thumbTintColor={Colors.dark.accent}
              />
              <View style={styles.speedRangeLabels}>
                <ThemedText style={styles.speedRangeLabel}>-5s</ThemedText>
                <ThemedText style={styles.speedRangeLabel}>0ms</ThemedText>
                <ThemedText style={styles.speedRangeLabel}>+5s</ThemedText>
              </View>
            </View>
          ) : showSubtitleDelay ? (
            /* Subtitle Delay Slider */
            <View style={styles.speedSliderContainer}>
              <ThemedText style={styles.speedSliderLabel}>Subtitle Delay: {subtitleDelay}ms</ThemedText>
              <Slider
                style={styles.speedSlider}
                minimumValue={0}
                maximumValue={100}
                value={delayToSliderValue(subtitleDelay)}
                onValueChange={handleSubtitleDelayChange}
                minimumTrackTintColor={Colors.dark.accent}
                maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
                thumbTintColor={Colors.dark.accent}
              />
              <View style={styles.speedRangeLabels}>
                <ThemedText style={styles.speedRangeLabel}>-5s</ThemedText>
                <ThemedText style={styles.speedRangeLabel}>0ms</ThemedText>
                <ThemedText style={styles.speedRangeLabel}>+5s</ThemedText>
              </View>
            </View>
          ) : (
            /* Track Selection */
            <View style={styles.trackSelectionContainer}>
              <View style={styles.trackRow}>
                <ThemedText style={styles.trackLabel}>Audio:</ThemedText>
                <Pressable onPress={() => setSelectedAudioTrack(selectedAudioTrack === "auto" ? "eng" : "auto")} style={styles.trackButton}>
                  <ThemedText style={styles.trackButtonText}>{selectedAudioTrack}</ThemedText>
                </Pressable>
              </View>
              <View style={styles.trackRow}>
                <ThemedText style={styles.trackLabel}>Subtitles:</ThemedText>
                <Pressable onPress={() => setSelectedSubtitleTrack(selectedSubtitleTrack === "auto" ? "eng" : "auto")} style={styles.trackButton}>
                  <ThemedText style={styles.trackButtonText}>{selectedSubtitleTrack}</ThemedText>
                </Pressable>
              </View>
              <View style={styles.trackRow}>
                <Pressable onPress={() => setCcEnabled(!ccEnabled)} style={[styles.trackButton, { flex: 1 }]}>
                  <ThemedText style={styles.trackButtonText}>{ccEnabled ? "CC On" : "CC Off"}</ThemedText>
                </Pressable>
              </View>
            </View>
          )}

          {/* Bottom Actions Row */}
          <View style={styles.bottomActions}>
            <Pressable
              onPress={toggleSpeedSlider}
              style={({ pressed }) => [styles.speedButton, { opacity: pressed ? 0.6 : 1 }]}
            >
              <ThemedText style={styles.speedText}>{playbackSpeed.toFixed(2)}x</ThemedText>
            </Pressable>
            <Pressable
              onPress={toggleAudioDelay}
              style={({ pressed }) => [styles.speedButton, { opacity: pressed ? 0.6 : 1 }]}
            >
              <ThemedText style={styles.speedText}>A.Delay</ThemedText>
            </Pressable>
            <Pressable
              onPress={toggleSubtitleDelay}
              style={({ pressed }) => [styles.speedButton, { opacity: pressed ? 0.6 : 1 }]}
            >
              <ThemedText style={styles.speedText}>S.Delay</ThemedText>
            </Pressable>
            <Pressable
              onPress={toggleTrackSelection}
              style={({ pressed }) => [styles.speedButton, { opacity: pressed ? 0.6 : 1 }]}
            >
              <ThemedText style={styles.speedText}>Tracks</ThemedText>
            </Pressable>
            <Pressable
              onPress={onSettingsPress}
              style={({ pressed }) => [styles.settingsButton, { opacity: pressed ? 0.6 : 1 }]}
            >
              <Feather name="settings" size={24} color={Colors.dark.text} />
            </Pressable>
          </View>
        </View>
      </Animated.View>

      {activeSkipMarker ? (
        <SkipButton
          type={activeSkipMarker.type}
          duration={Math.floor(activeSkipMarker.endTime - activeSkipMarker.startTime)}
          onSkip={handleSkip}
          visible={!!activeSkipMarker}
          autoSkipCountdown={autoSkipCountdown}
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundRoot,
  },
  video: {
    flex: 1,
  },
  videoInner: {
    flex: 1,
  },
  controls: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "space-between",
    padding: Spacing["2xl"],
  },
  titleContainer: {
    paddingTop: Platform.OS === "ios" ? 44 : Spacing.xl,
  },
  title: {
    ...Typography.h4,
    color: Colors.dark.text,
  },
  bottomControlsContainer: {
    gap: Spacing.lg,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  timeText: {
    ...Typography.small,
    color: Colors.dark.text,
    minWidth: 50,
    textAlign: "center",
  },
  progressBarWrapper: {
    flex: 1,
    justifyContent: "center",
    position: "relative",
  },
  progressSlider: {
    width: "100%",
    height: 30,
  },
  previewWindow: {
    position: "absolute",
    bottom: 40,
    backgroundColor: "rgba(20, 20, 30, 0.95)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginLeft: -50,
    zIndex: 20,
    borderWidth: 2,
    borderColor: Colors.dark.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  previewTime: {
    ...Typography.small,
    color: Colors.dark.accent,
    fontWeight: "700",
    fontSize: 14,
  },
  mediaControlsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
  },
  mediaButton: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    flex: 1,
    minHeight: 56,
  },
  buttonIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },
  buttonLabel: {
    ...Typography.tiny,
    color: Colors.dark.text,
    fontSize: 10,
    fontWeight: "500",
  },
  playButtonCenter: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.dark.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  speedSliderContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  speedSliderLabel: {
    ...Typography.small,
    color: Colors.dark.text,
    textAlign: "center",
    fontWeight: "600",
  },
  speedSlider: {
    width: "100%",
    height: 32,
  },
  speedRangeLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xs,
  },
  speedRangeLabel: {
    ...Typography.tiny,
    color: Colors.dark.disabled,
    fontSize: 9,
  },
  bottomActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
  },
  speedButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: BorderRadius.sm,
  },
  speedText: {
    ...Typography.body,
    fontWeight: "600",
    color: Colors.dark.text,
  },
  settingsButton: {
    padding: Spacing.sm,
  },
  trackSelectionContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  trackRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
  },
  trackLabel: {
    ...Typography.small,
    color: Colors.dark.text,
    fontWeight: "600",
    flex: 1,
  },
  trackButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: BorderRadius.sm,
    minWidth: 80,
    alignItems: "center",
  },
  trackButtonText: {
    ...Typography.small,
    color: Colors.dark.text,
    fontWeight: "500",
  },
});
