"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  RotateCcw,
  SkipForward,
  SkipBack,
  Check,
  Captions,
  CaptionsOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "next-intl";
import { useAuth } from "@/providers/AuthProvider";

interface VideoPlayerProps {
  title: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number; // in seconds
  initialPosition?: number; // in seconds
  watchPercentage?: number;
  onProgress?: (percentage: number, position: number) => void;
  onComplete?: () => void;
  className?: string;
}

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const PROGRESS_UPDATE_INTERVAL = 10; // seconds

export function VideoPlayer({
  title,
  videoUrl,
  thumbnailUrl,
  duration = 0,
  initialPosition = 0,
  watchPercentage = 0,
  onProgress,
  onComplete,
  className,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const lastProgressUpdateRef = useRef<number>(0);
  const hlsRef = useRef<import("hls.js").default | null>(null);

  // Anti-piracy watermark: the viewer's email drifts across the video so a
  // screen recording identifies whose account leaked the material.
  const { user } = useAuth();
  const WATERMARK_SPOTS = [
    "top-[8%] left-[6%]",
    "top-[8%] right-[6%]",
    "bottom-[18%] right-[8%]",
    "bottom-[18%] left-[8%]",
    "top-[45%] left-[38%]",
  ];
  const [watermarkSpot, setWatermarkSpot] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setWatermarkSpot((prev) => (prev + 1) % WATERMARK_SPOTS.length);
    }, 25000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(initialPosition);
  const [videoDuration, setVideoDuration] = useState(duration);
  const [progress, setProgress] = useState(watchPercentage);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [hasCaptions, setHasCaptions] = useState(false);
  const [captionsOn, setCaptionsOn] = useState(false);
  const [activeCueText, setActiveCueText] = useState("");
  const locale = useLocale();

  // Detect subtitle tracks in the stream (e.g. Mux generated captions) and
  // apply the user's on/off choice. Tracks arrive asynchronously with HLS.
  // Cues are rendered by our own overlay element, never natively: native cue
  // rendering draws a background box we can't reliably style across browsers.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const readActiveCues = (track: TextTrack) => {
      const cues = track.activeCues ? Array.from(track.activeCues) : [];
      setActiveCueText(
        cues
          .map((cue) => (cue as VTTCue).text.replace(/<[^>]+>/g, ""))
          .join("\n")
      );
    };

    function handleCueChange(this: TextTrack) {
      readActiveCues(this);
    }

    const applyCaptionState = () => {
      const tracks = Array.from(video.textTracks).filter(
        (track) => track.kind === "subtitles" || track.kind === "captions"
      );
      setHasCaptions(tracks.length > 0);
      // Never let hls.js flip tracks to "showing" — we render cues ourselves
      if (hlsRef.current) {
        hlsRef.current.subtitleDisplay = false;
      }
      // Prefer the caption language matching the site language
      const preferredIndex = Math.max(
        tracks.findIndex((track) => (track.language || "").startsWith(locale)),
        0
      );
      tracks.forEach((track, index) => {
        const active = captionsOn && index === preferredIndex;
        // "hidden" keeps cues loading and firing cuechange without native
        // rendering; "showing" would draw the browser's own black cue box
        track.mode = active ? "hidden" : "disabled";
        track.removeEventListener("cuechange", handleCueChange);
        if (active) {
          track.addEventListener("cuechange", handleCueChange);
          readActiveCues(track);
        }
      });
      if (!captionsOn) setActiveCueText("");
    };

    applyCaptionState();
    video.textTracks.addEventListener("addtrack", applyCaptionState);
    video.textTracks.addEventListener("removetrack", applyCaptionState);
    return () => {
      video.textTracks.removeEventListener("addtrack", applyCaptionState);
      video.textTracks.removeEventListener("removetrack", applyCaptionState);
      for (const track of Array.from(video.textTracks)) {
        track.removeEventListener("cuechange", handleCueChange);
      }
    };
  }, [captionsOn, videoUrl, locale]);

  // Hide controls after inactivity
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (isPlaying && showControls) {
      timeout = setTimeout(() => {
        setShowControls(false);
        setShowSettings(false);
      }, 3000);
    }

    return () => clearTimeout(timeout);
  }, [isPlaying, showControls]);

  // Attach the video source. Mux serves HLS (.m3u8). Prefer hls.js wherever
  // MSE is available - some browsers (e.g. newer Chrome) claim native HLS
  // support but don't expose subtitle tracks, so hls.js gives us consistent
  // captions. iOS Safari has no MSE and uses native playback, which does
  // expose subtitle tracks itself.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    const isHlsSource = videoUrl.includes(".m3u8");

    if (!isHlsSource) {
      video.src = videoUrl;
      return;
    }

    let hls: import("hls.js").default | null = null;
    let cancelled = false;

    import("hls.js").then(({ default: Hls }) => {
      if (cancelled || !videoRef.current) return;
      if (Hls.isSupported()) {
        hls = new Hls();
        // Captions render only when the user toggles them on
        hls.subtitleDisplay = false;
        hls.loadSource(videoUrl);
        hls.attachMedia(videoRef.current);
        hlsRef.current = hls;
      } else {
        // No MSE (iOS Safari): native HLS playback
        videoRef.current.src = videoUrl;
      }
    });

    return () => {
      cancelled = true;
      hlsRef.current = null;
      hls?.destroy();
    };
  }, [videoUrl]);

  // Handle video events
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const time = video.currentTime;
    const dur = video.duration || videoDuration;

    setCurrentTime(time);

    // Calculate progress percentage
    const newProgress = dur > 0 ? Math.round((time / dur) * 100) : 0;
    setProgress(newProgress);

    // Send progress updates periodically
    const now = Date.now();
    if (now - lastProgressUpdateRef.current > PROGRESS_UPDATE_INTERVAL * 1000) {
      onProgress?.(newProgress, time);
      lastProgressUpdateRef.current = now;
    }
  }, [videoDuration, onProgress]);

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    setVideoDuration(video.duration);

    // Seek to initial position if provided
    if (initialPosition > 0 && video.duration > initialPosition) {
      video.currentTime = initialPosition;
    }
  }, [initialPosition]);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setProgress(100);
    onProgress?.(100, videoDuration);
    onComplete?.();
  }, [videoDuration, onProgress, onComplete]);

  const handleWaiting = () => setIsBuffering(true);
  const handlePlaying = () => setIsBuffering(false);

  // Play/Pause
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
      setHasStarted(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  // Volume
  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  const handleVolumeChange = useCallback((newVolume: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  }, []);

  // Seek
  const seek = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = Math.max(0, Math.min(video.currentTime + seconds, video.duration));
  }, []);

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const video = videoRef.current;
      const progressBar = progressRef.current;
      if (!video || !progressBar) return;

      const rect = progressBar.getBoundingClientRect();
      const clickPosition = (e.clientX - rect.left) / rect.width;
      const newTime = clickPosition * (video.duration || videoDuration);

      video.currentTime = newTime;
      setCurrentTime(newTime);
    },
    [videoDuration]
  );

  // Playback speed
  const handleSpeedChange = useCallback((speed: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = speed;
    setPlaybackSpeed(speed);
    setShowSettings(false);
  }, []);

  // Fullscreen
  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement)) return;

      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          seek(-10);
          break;
        case "ArrowRight":
          e.preventDefault();
          seek(10);
          break;
        case "ArrowUp":
          e.preventDefault();
          handleVolumeChange(Math.min(volume + 0.1, 1));
          break;
        case "ArrowDown":
          e.preventDefault();
          handleVolumeChange(Math.max(volume - 0.1, 0));
          break;
        case "m":
          toggleMute();
          break;
        case "f":
          toggleFullscreen();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, seek, handleVolumeChange, volume, toggleMute, toggleFullscreen]);

  // If no video URL, show placeholder
  if (!videoUrl) {
    return (
      <div
        className={cn(
          "relative aspect-video bg-gray-900 rounded-xl overflow-hidden",
          className
        )}
      >
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
              <Play className="h-10 w-10 text-white ml-1" />
            </div>
            <p className="text-white/60 text-sm">Video preview</p>
            <p className="text-white font-medium mt-1">{title}</p>
          </div>
        </div>

        {/* Progress bar placeholder */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="h-1 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-secondary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative aspect-video bg-black rounded-xl overflow-hidden group",
        isFullscreen && "rounded-none",
        className
      )}
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Caption text style. Fixed px size applies at any player size,
          including fullscreen; text-shadow keeps it readable on bright
          footage without a background box. */}
      <style>{`
        .caption-overlay {
          font-size: 23px;
          line-height: 1.3;
          text-shadow:
            0 0 4px rgba(0, 0, 0, 0.9),
            0 1px 2px rgba(0, 0, 0, 0.9),
            0 0 8px rgba(0, 0, 0, 0.7);
        }
        /* Tablets: touch device at tablet width (phones are narrower,
           desktops have a fine pointer) */
        @media (pointer: coarse) and (min-width: 768px) {
          .caption-overlay {
            font-size: 18px;
          }
        }
      `}</style>

      {/* Video element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        poster={thumbnailUrl}
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onWaiting={handleWaiting}
        onPlaying={handlePlaying}
        onClick={togglePlay}
      />

      {/* Watermark: identifies the logged-in viewer on any screen capture */}
      {user?.email && (
        <div
          className={cn(
            "pointer-events-none select-none absolute z-10 transition-all duration-1000",
            WATERMARK_SPOTS[watermarkSpot]
          )}
          aria-hidden="true"
        >
          <span
            className="text-white/30 text-xs sm:text-sm font-medium tracking-wide"
            style={{ textShadow: "0 0 4px rgba(0,0,0,0.35)" }}
          >
            {user.email} · Brendia Pro®
          </span>
        </div>
      )}

      {/* Subtitles: our own cue rendering (no native black box). Sits above
          the control bar while it's visible, drops lower when it hides. */}
      {captionsOn && activeCueText && (
        <div
          className={cn(
            "caption-overlay pointer-events-none absolute left-0 right-0 flex justify-center px-6 transition-all duration-300",
            showControls ? "bottom-20" : "bottom-6"
          )}
        >
          <span className="text-white text-center whitespace-pre-line">
            {activeCueText}
          </span>
        </div>
      )}

      {/* Buffering indicator */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Play button overlay (before video starts) */}
      {!hasStarted && !isPlaying && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
        >
          <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center">
            <Play className="h-10 w-10 text-gray-900 ml-1" />
          </div>
        </button>
      )}

      {/* Controls overlay */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-20 pb-4 px-4 transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0"
        )}
      >
        {/* Progress bar */}
        <div
          ref={progressRef}
          className="mb-3 cursor-pointer group/progress"
          onClick={handleProgressClick}
        >
          <div className="h-1 group-hover/progress:h-2 bg-white/30 rounded-full overflow-hidden transition-all">
            <div
              className="h-full bg-secondary transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5 text-white" />
              ) : (
                <Play className="h-5 w-5 text-white ml-0.5" />
              )}
            </button>

            {/* Skip back/forward */}
            <button
              onClick={() => seek(-10)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Skip back 10 seconds"
            >
              <SkipBack className="h-5 w-5 text-white" />
            </button>
            <button
              onClick={() => seek(10)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Skip forward 10 seconds"
            >
              <SkipForward className="h-5 w-5 text-white" />
            </button>

            {/* Volume */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-5 w-5 text-white" />
                ) : (
                  <Volume2 className="h-5 w-5 text-white" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-20 h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
              />
            </div>

            {/* Time display */}
            <span className="text-white/80 text-sm tabular-nums">
              {formatTime(currentTime)} / {formatTime(videoDuration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Captions */}
            {hasCaptions && (
              <button
                onClick={() => setCaptionsOn((prev) => !prev)}
                className={cn(
                  "p-2 hover:bg-white/20 rounded-lg transition-colors",
                  captionsOn && "bg-white/20"
                )}
                aria-label={captionsOn ? "Isključi titlove" : "Uključi titlove"}
              >
                {captionsOn ? (
                  <Captions className="h-5 w-5 text-secondary" />
                ) : (
                  <CaptionsOff className="h-5 w-5 text-white" />
                )}
              </button>
            )}

            {/* Settings */}
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Settings"
              >
                <Settings className="h-5 w-5 text-white" />
              </button>

              {showSettings && (
                <div className="absolute bottom-full right-0 mb-2 bg-gray-900/95 rounded-lg py-2 min-w-32 shadow-xl">
                  <p className="text-white/60 text-xs px-3 pb-2">Playback Speed</p>
                  {PLAYBACK_SPEEDS.map((speed) => (
                    <button
                      key={speed}
                      onClick={() => handleSpeedChange(speed)}
                      className="w-full px-3 py-1.5 text-sm text-white hover:bg-white/10 text-left flex items-center justify-between"
                    >
                      {speed}x
                      {playbackSpeed === speed && (
                        <Check className="h-4 w-4 text-secondary" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Fullscreen"
            >
              <Maximize className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
