import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  Volume2, 
  VolumeX, 
  Music, 
  Plus, 
  Check, 
  Flag, 
  Gift, 
  Smile, 
  Activity,
  Play, 
  Pause,
  ChevronUp, 
  ChevronDown, 
  Sparkles, 
  Zap, 
  Split, 
  Search,
  Settings as SettingsIcon,
  RefreshCw,
  Download,
  X,
  ArrowDown
} from 'lucide-react';
import { MemeVideo, Language, Creator } from '../types';
import { memeAudio } from '../utils/audioSynth';
import { recordLocalWatchTime } from '../algorithms/recommendation';
import Hls from 'hls.js';
import { SponsoredAdCard } from './SponsoredAdCard';

interface ReelPlayerProps {
  videos: MemeVideo[];
  currentIndex: number;
  onNavigate: (index: number) => void;
  onLikeToggle: (videoId: string) => void;
  onSaveToggle: (videoId: string) => void;
  onFollowToggle: (creatorId: string) => void;
  onOpenComments: () => void;
  onOpenShare: () => void;
  onOpenGift: () => void;
  onOpenDuet?: () => void;
  onOpenReport: () => void;
  onOpenAlgorithm: () => void;
  onOpenSettings?: () => void;
  onOpenCreatorProfile?: (creator: Creator) => void;
  onOpenDirectChat?: (creator: Creator) => void;
  onOpenAdCampaign?: () => void;
  onOpenSearch?: () => void;
  onOpenInstallModal?: () => void;
  onRefresh?: () => Promise<void> | void;
  isOwner?: boolean;
  language: Language;
  feedFilter: 'foryou' | 'following' | 'latest' | 'trending';
  onFeedFilterChange: (filter: 'foryou' | 'following' | 'latest' | 'trending') => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  onFastSkip?: (videoId: string, watchMs: number) => void;
  onWatchTimeRecorded?: (videoId: string, watchMs: number, loops: number, isFastSkip: boolean) => void;
}

interface SingleReelItemProps {
  video: MemeVideo;
  index: number;
  isActive: boolean;
  isPreload: boolean;
  isPlaying: boolean;
  isMuted: boolean;
  isOwner?: boolean;
  onTogglePlayPause: () => void;
  onToggleMute: () => void;
  onLikeClick: (videoId: string) => void;
  onSaveToggle: (videoId: string) => void;
  onFollowToggle: (creatorId: string) => void;
  onOpenComments: () => void;
  onOpenShare: () => void;
  onOpenGift: () => void;
  onOpenDuet?: () => void;
  onOpenReport: () => void;
  onOpenAlgorithm: () => void;
  onOpenCreatorProfile?: (creator: Creator) => void;
  onOpenDirectChat?: (creator: Creator) => void;
  onOpenSearch?: () => void;
  language: Language;
  autoScroll?: boolean;
  onAutoAdvance?: () => void;
}

const SingleReelItem = React.memo<SingleReelItemProps>(({
  video,
  index,
  isActive,
  isPreload,
  isPlaying,
  isMuted,
  isOwner = false,
  onTogglePlayPause,
  onToggleMute,
  onLikeClick,
  onSaveToggle,
  onFollowToggle,
  onOpenComments,
  onOpenShare,
  onOpenGift,
  onOpenDuet,
  onOpenReport,
  onOpenAlgorithm,
  onOpenCreatorProfile,
  onOpenSearch,
  language,
  autoScroll = false,
  onAutoAdvance,
}) => {
  const [playbackSec, setPlaybackSec] = useState<number>(0);
  const [showHeartBurst, setShowHeartBurst] = useState<boolean>(false);
  const [showLaughBurst, setShowLaughBurst] = useState<boolean>(false);
  const [showPlayOverlay, setShowPlayOverlay] = useState<boolean>(false);
  const [isAutoAdvancing, setIsAutoAdvancing] = useState<boolean>(false);

  // Long-press hold state & timer
  const [isHolding, setIsHolding] = useState<boolean>(false);
  const [holdProgress, setHoldProgress] = useState<number>(0);
  const [showLongPressSheet, setShowLongPressSheet] = useState<boolean>(false);
  const [dataSaver, setDataSaver] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('cheka_data_saver') === 'true';
    }
    return false;
  });
  const [dataSaverToast, setDataSaverToast] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  const handleDownloadVideo = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsDownloading(true);
    setDownloadToast(language === 'sw' ? 'Inatayarisha video yenye alama ya @Cheka...' : 'Preparing video with @Cheka mark...');
    memeAudio.playBoing();

    try {
      const videoSrc = video.streamPlayback?.mp4 || video.mediaUrl;
      const creatorName = video.creator?.username || 'mchekeshaji';
      const cleanTitle = (video.caption || video.title || 'meme').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 20);
      const filename = `ChekaApp_@${creatorName}_${cleanTitle}.mp4`;

      const response = await fetch(videoSrc, { mode: 'cors' }).catch(() => null);
      if (response && response.ok) {
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      } else {
        const a = document.createElement('a');
        a.href = videoSrc;
        a.download = filename;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }

      memeAudio.playReward();
      setDownloadToast(language === 'sw' ? '✅ Imepakuliwa na alama ya @Cheka!' : '✅ Downloaded with @Cheka mark!');
      setTimeout(() => setDownloadToast(null), 3500);
    } catch (err) {
      console.error('Download error:', err);
      window.open(video.streamPlayback?.mp4 || video.mediaUrl, '_blank');
      setDownloadToast(language === 'sw' ? 'Imefunguliwa kwa ajili ya kupakua' : 'Opened for download');
      setTimeout(() => setDownloadToast(null), 3000);
    } finally {
      setIsDownloading(false);
    }
  };

  const toggleDataSaver = () => {
    const nextVal = !dataSaver;
    setDataSaver(nextVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cheka_data_saver', String(nextVal));
    }
    memeAudio.playPop();
    setDataSaverToast(
      nextVal
        ? (language === 'sw' ? '⚡ Bana Bando IMEWASHWA (360p - MB Chache)' : '⚡ Data Saver ON (Low MB)')
        : (language === 'sw' ? '⚡ Bana Bando IMEZIMWA (Ubora wa HD)' : '⚡ Data Saver OFF (HD Quality)')
    );
    setTimeout(() => setDataSaverToast(null), 3000);
  };

  const holdTimerRef = useRef<any>(null);
  const holdIntervalRef = useRef<any>(null);
  const holdTriggeredRef = useRef<boolean>(false);

  const videoElemRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Pointer gesture tracker for tap vs swipe vs hold distinction
  const pointerStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const isCloudflareStream = Boolean(
    video.videoUid &&
    !video.videoUid.startsWith('local_') &&
    !video.videoUid.startsWith('/uploads/') &&
    !video.streamPlayback?.hls?.endsWith('.mp4') &&
    (video.mediaType === 'video' || (!video.videoUid.startsWith('vid_') && !video.videoUid.startsWith('meme_')))
  );

  const isDirectVideo = Boolean(
    !isCloudflareStream && (video.mediaType === 'video' || video.mediaUrl?.endsWith('.mp4') || video.streamPlayback?.mp4 || video.videoUid?.startsWith('local_'))
  );

  const isVideo = isCloudflareStream || isDirectVideo;

  // Initialize and attach HLS stream or direct video source
  useEffect(() => {
    const videoEl = videoElemRef.current;
    if (!videoEl) return;

    if (!isActive && !isPreload) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      return;
    }

    if (isCloudflareStream) {
      const hlsUrl = video.streamPlayback?.hls || `https://videodelivery.net/${video.videoUid}/manifest/video.m3u8`;

      if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
        if (videoEl.src !== hlsUrl) {
          videoEl.src = hlsUrl;
        }
      } else if (Hls.isSupported()) {
        if (!hlsRef.current) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 30,
          });
          hls.loadSource(hlsUrl);
          hls.attachMedia(videoEl);
          hlsRef.current = hls;

          hls.on(Hls.Events.ERROR, (_event, data) => {
            if (data.fatal) {
              if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                hls.startLoad();
              } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                hls.recoverMediaError();
              } else {
                hls.destroy();
                hlsRef.current = null;
                const fallbackMp4 = video.streamPlayback?.mp4 || (video.videoUid ? `https://videodelivery.net/${video.videoUid}/downloads/default.mp4` : video.mediaUrl);
                if (fallbackMp4 && videoEl) {
                  videoEl.src = fallbackMp4;
                  videoEl.load();
                  if (isPlaying) {
                    videoEl.play().catch(() => {});
                  }
                }
              }
            }
          });
        }
      }
    } else if (isDirectVideo) {
      const directSrc = video.streamPlayback?.mp4 || video.mediaUrl;
      if (directSrc && videoEl.src !== directSrc) {
        videoEl.src = directSrc;
      }
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [isActive, isPreload, isCloudflareStream, isDirectVideo, video.videoUid, video.streamPlayback?.hls, video.streamPlayback?.mp4, video.mediaUrl]);

  // Synchronize playback and volume on HTML5 video element with strict single-audio isolation
  useEffect(() => {
    const videoEl = videoElemRef.current;
    if (!videoEl) return;

    if (!isActive) {
      videoEl.pause();
      videoEl.muted = true;
      videoEl.volume = 0;
      try {
        videoEl.currentTime = 0;
      } catch (_) {}
      setPlaybackSec(0);
      return;
    }

    videoEl.muted = isMuted;
    videoEl.volume = isMuted ? 0 : 1.0;

    if (isPlaying) {
      const playPromise = videoEl.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          videoEl.muted = true;
          videoEl.play().catch(() => {});
        });
      }
    } else {
      videoEl.pause();
    }
  }, [isActive, isPlaying, isMuted]);

  // Videos or memes never change by themselves; they loop continuously until user scrolls
  useEffect(() => {
    // Auto-advance disabled: user controls all navigation
  }, []);

  const handleVideoEnded = () => {
    // Video ended: loop seamlessly from start
    if (videoElemRef.current) {
      videoElemRef.current.currentTime = 0;
      videoElemRef.current.play().catch(() => {});
    }
  };

  // Listen for global scroll & touchmove events to immediately cancel any hold attempts
  useEffect(() => {
    const handleGlobalScroll = () => {
      clearHold();
    };
    window.addEventListener('cheka_scroll_active', handleGlobalScroll, { passive: true });
    window.addEventListener('scroll', handleGlobalScroll, { passive: true });
    window.addEventListener('touchmove', handleGlobalScroll, { passive: true });
    return () => {
      window.removeEventListener('cheka_scroll_active', handleGlobalScroll);
      window.removeEventListener('scroll', handleGlobalScroll);
      window.removeEventListener('touchmove', handleGlobalScroll);
    };
  }, []);

  const clearHold = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    setIsHolding(false);
    setHoldProgress(0);
  };

  // Pointer down: initiate motionless hold timer without showing visual circle immediately
  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('input')) {
      return;
    }

    pointerStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now(),
    };
    holdTriggeredRef.current = false;
    setIsHolding(true);

    // Responsive 480ms hold threshold for native mobile app feel
    const HOLD_THRESHOLD = 480;
    holdTimerRef.current = setTimeout(() => {
      holdTriggeredRef.current = true;
      clearHold();
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(35);
        } catch (_) {}
      }
      setShowLongPressSheet(true);
      memeAudio.playPop();
    }, HOLD_THRESHOLD);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointerStartRef.current) return;
    const dx = Math.abs(e.clientX - pointerStartRef.current.x);
    const dy = Math.abs(e.clientY - pointerStartRef.current.y);
    // If finger moves more than 12px in any direction, user is scrolling or swiping!
    // ABORT HOLD IMMEDIATELY!
    if (dx > 12 || dy > 12) {
      clearHold();
    }
  };

  // Pointer up: Tap vs Hold
  const handlePointerUp = (e: React.PointerEvent) => {
    const wasHoldTriggered = holdTriggeredRef.current;
    clearHold();

    if (!pointerStartRef.current || wasHoldTriggered) {
      pointerStartRef.current = null;
      return;
    }

    const start = pointerStartRef.current;
    pointerStartRef.current = null;

    const dx = Math.abs(e.clientX - start.x);
    const dy = Math.abs(e.clientY - start.y);
    const dt = Date.now() - start.time;

    // Clean stationary tap (< 10px movement and < 300ms duration) toggles play/mute
    if (dx < 10 && dy < 10 && dt < 300) {
      if (isMuted && isVideo) {
        onToggleMute();
      } else {
        onTogglePlayPause();
      }
      setShowPlayOverlay(true);
      setTimeout(() => setShowPlayOverlay(false), 700);
    }
  };

  const handlePointerCancel = () => {
    clearHold();
    pointerStartRef.current = null;
  };

  const handleLike = () => {
    onLikeClick(video.id);
    if (!video.isLiked) {
      setShowHeartBurst(true);
      setTimeout(() => setShowHeartBurst(false), 800);
    }
  };

  const handleLongPressCheka = () => {
    memeAudio.playLaugh();
    setShowLaughBurst(true);
    setTimeout(() => setShowLaughBurst(false), 1000);
    setShowLongPressSheet(false);
  };

  // Live formula score calculation
  const score = Math.round(
    ((video.signals?.watchRatio || 1) * 3 * 1000) +
    ((video.likesCount || 0) / 5) +
    (video.sharesCount || 0) +
    (video.commentsCount || 0) -
    ((video.signals?.skips || 0) * 20)
  );

  const progressPercent = Math.min(100, (playbackSec / Math.max(1, video.duration || 15)) * 100);

  return (
    <div
      className="w-full h-full relative flex flex-col justify-between overflow-hidden bg-black select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      {/* Background Media Layer */}
      <div className="absolute inset-0 overflow-hidden bg-neutral-950">
        {isVideo ? (
          (isActive || isPreload) ? (
            <div className="absolute inset-0 w-full h-full">
              <video
                ref={videoElemRef}
                className="w-full h-full object-cover"
                playsInline
                loop
                muted={!isActive || isMuted}
                preload={isActive ? 'auto' : 'metadata'}
                onEnded={handleVideoEnded}
                onTimeUpdate={(e) => {
                  if (isActive) {
                    setPlaybackSec(Math.floor(e.currentTarget.currentTime));
                  }
                }}
              />
              {isCloudflareStream && (
                <div className="absolute top-16 left-4 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 border border-amber-500/40 text-[10px] text-amber-300 font-mono pointer-events-none shadow-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>Cloudflare Stream HLS</span>
                </div>
              )}
            </div>
          ) : (
            <img
              src={video.streamPlayback?.thumbnail || video.mediaUrl}
              alt={video.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          )
        ) : (
          <img
            src={video.mediaUrl}
            alt={video.title}
            className={`w-full h-full object-cover transition-transform duration-1000 ${
              isActive && isPlaying ? 'scale-105' : 'scale-100'
            }`}
            loading={isActive ? 'eager' : 'lazy'}
          />
        )}

        {/* Ambient gradient overlays for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-black/60 pointer-events-none" />
      </div>

      {/* Visual Hold Indicator while user is pressing the screen */}
      {isHolding && (
        <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none animate-fade-in bg-black/30 backdrop-blur-[2px]">
          <div className="flex flex-col items-center gap-2 p-5 rounded-3xl bg-neutral-950/80 border border-amber-500/50 shadow-2xl">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-16 h-16 -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  className="stroke-neutral-800"
                  strokeWidth="4"
                  fill="transparent"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  className="stroke-amber-400 transition-all duration-75"
                  strokeWidth="4"
                  strokeDasharray={176}
                  strokeDashoffset={176 - (176 * holdProgress) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <Smile className="w-7 h-7 text-amber-400 absolute" />
            </div>
            <p className="text-xs font-bold text-amber-300">
              {language === 'sw' ? 'Endelea Kushikilia...' : 'Hold to open actions...'}
            </p>
          </div>
        </div>
      )}



      {/* Heart Burst on Like */}
      {showHeartBurst && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-ping">
          <Heart className="w-24 h-24 text-rose-500 fill-rose-500 drop-shadow-2xl opacity-90" />
        </div>
      )}

      {/* Laugh Burst on Hold Reaction */}
      {showLaughBurst && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-bounce">
          <div className="p-6 rounded-full bg-amber-500/90 text-neutral-950 shadow-2xl scale-125 border-4 border-amber-300 flex items-center gap-2">
            <Smile className="w-14 h-14" />
            <span className="text-2xl font-black">VUNJA MBAVU! 🤣</span>
          </div>
        </div>
      )}

      {/* Play/Pause indicator on tap */}
      {showPlayOverlay && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <div className="p-4 rounded-full bg-black/70 backdrop-blur-md text-white animate-scale-up shadow-2xl">
            {isPlaying ? (
              <Play className="w-8 h-8 fill-white" />
            ) : (
              <Pause className="w-8 h-8 fill-white" />
            )}
          </div>
        </div>
      )}

      {/* TOP OVERLAY CONTROLS (Below top bar safe area) */}
      <div className="relative z-20 pt-16 md:pt-14 px-4 flex items-center justify-between text-white pointer-events-auto">
        {/* Telemetry pill - ONLY VISIBLE TO OWNER */}
        {isOwner ? (
          <button
            onClick={e => {
              e.stopPropagation();
              onOpenAlgorithm();
            }}
            className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md border border-amber-500/40 rounded-full px-2.5 py-1 text-[11px] font-mono text-amber-300 hover:bg-black/80 transition-colors shadow-md"
            title="Angalia AI Watch-Time Algorithm (Mmiliki Pekee)"
          >
            <Activity className="w-3 h-3 text-amber-400" />
            <span>Score: {(video.recommendationScore || score).toLocaleString()}</span>
          </button>
        ) : (
          <div />
        )}

        {/* Top Right Controls: Bana Bando, Mute, Report */}
        <div className="flex items-center gap-2">
          {/* Data Saver Mode Toggle (Bana Bando) */}
          <button
            onClick={e => {
              e.stopPropagation();
              toggleDataSaver();
            }}
            className={`p-2 rounded-full backdrop-blur-md transition-all border shadow-md flex items-center justify-center ${
              dataSaver
                ? 'bg-amber-400 text-neutral-950 border-amber-300 font-bold scale-105 shadow-amber-500/40'
                : 'bg-black/60 hover:bg-black/80 text-neutral-300 hover:text-white border-white/10'
            }`}
            aria-label="Hali ya Kubana Bando"
            title={dataSaver ? 'Bana Bando IMEWASHWA (360p / MB Chache)' : 'Washa Bana Bando (MB Chache)'}
          >
            <Zap className={`w-3.5 h-3.5 ${dataSaver ? 'fill-current' : ''}`} />
          </button>

          <button
            onClick={e => {
              e.stopPropagation();
              onToggleMute();
            }}
            className="p-2 rounded-full bg-black/60 backdrop-blur-md hover:bg-black/80 text-white transition-colors border border-white/10 shadow-md"
            aria-label="Toggle mute"
            title={isMuted ? 'Washa sauti' : 'Zima sauti'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            )}
          </button>

          <button
            onClick={e => {
              e.stopPropagation();
              onOpenReport();
            }}
            className="p-2 rounded-full bg-black/60 backdrop-blur-md hover:bg-black/80 text-neutral-300 hover:text-rose-400 transition-colors border border-white/10 shadow-md"
            aria-label="Ripoti maudhui"
            title="Ripoti maudhui"
          >
            <Flag className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Toast Alert for Data Saver Mode */}
      {dataSaverToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 px-3.5 py-1.5 rounded-full bg-amber-400 text-neutral-950 font-extrabold text-xs shadow-2xl animate-bounce flex items-center gap-1.5 pointer-events-none">
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>{dataSaverToast}</span>
        </div>
      )}

      {/* TIKTOK-STYLE WATERMARK BADGE */}
      <div className="absolute top-20 left-4 z-20 pointer-events-none select-none flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white shadow-xl animate-fade-in">
        <Smile className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
        <span className="text-xs font-black tracking-wider text-amber-300 font-mono">@Cheka</span>
        <span className="text-[11px] text-neutral-300 font-sans">· @{video.creator?.username || 'cheka'}</span>
      </div>

      {/* Toast Alert for Video Download */}
      {downloadToast && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-full bg-emerald-500 text-neutral-950 font-black text-xs shadow-2xl animate-bounce flex items-center gap-2 pointer-events-none border border-emerald-300">
          <Download className="w-4 h-4" />
          <span>{downloadToast}</span>
        </div>
      )}

      {/* BOTTOM ACTION BAR & CREATOR INFO (Safe area above bottom nav) */}
      <div className="relative z-20 px-4 pb-20 md:pb-6 flex items-end justify-between gap-3 text-white pointer-events-auto">
        {/* Left column: Creator, Caption, Tags, Music */}
        <div className="flex-1 space-y-1.5 pr-2">
          {/* Dopamine Hook Badge or Matched Reason */}
          {((video as any).scoreBreakdown?.hookBadge || video.scoreBreakdown?.matchedReason) && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/35 via-yellow-500/20 to-black/60 backdrop-blur-md border border-amber-400/50 text-[11px] text-amber-200 font-extrabold w-fit shadow-lg">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span className="truncate max-w-[260px]">{(video as any).scoreBreakdown?.hookBadge || video.scoreBreakdown?.matchedReason}</span>
            </div>
          )}

          {/* Creator handle */}
          <div 
            onClick={e => {
              e.stopPropagation();
              onOpenCreatorProfile?.(video.creator);
            }}
            className="flex items-center gap-2 cursor-pointer group w-fit"
            title="Tazama wasifu wa mchekeshaji"
          >
            <span className="font-bold text-sm text-neutral-100 group-hover:text-amber-400 group-hover:underline transition-colors">
              @{video.creator?.username || 'mchekeshaji'}
            </span>
            {video.creator?.verified && (
              <span className="w-3.5 h-3.5 rounded-full bg-amber-500 text-neutral-950 flex items-center justify-center text-[9px] font-bold">
                ✓
              </span>
            )}
          </div>

          {/* Caption */}
          <p className="text-xs text-neutral-200 line-clamp-3 leading-relaxed drop-shadow-sm font-normal">
            {video.caption}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 text-[11px] text-amber-400 font-medium">
            {video.tags?.map(tag => (
              <span 
                key={tag} 
                onClick={e => {
                  e.stopPropagation();
                  onOpenSearch?.();
                }}
                className="hover:underline cursor-pointer bg-black/40 px-1.5 py-0.5 rounded-md backdrop-blur-xs hover:bg-amber-500/20 transition-colors"
                title="Tafuta lebo hii"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Soundtrack pill */}
          {video.soundTrack && (
            <div className="flex items-center gap-1.5 text-[11px] text-neutral-300 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 w-fit">
              <Music className={`w-3 h-3 text-amber-400 shrink-0 ${isActive && isPlaying ? 'animate-spin' : ''}`} />
              <span className="truncate max-w-[170px]">
                {video.soundTrack.title} · {video.soundTrack.artist}
              </span>
            </div>
          )}
        </div>

        {/* Right column: VERTICAL ACTION RAIL (Exactly 4 items: Profile, Like, Comment, Zawadi) */}
        <div className="flex flex-col items-center gap-3.5 pb-2 shrink-0">
          {/* 1. Creator Avatar with Follow Button */}
          <div 
            className="relative mb-1 cursor-pointer group"
            onClick={e => {
              e.stopPropagation();
              onOpenCreatorProfile?.(video.creator);
            }}
            title="Tazama wasifu wa mchekeshaji"
          >
            <img
              src={video.creator?.avatar || '/assets/images/swahili_comedian_avatar_1792057038016.jpg'}
              alt={video.creator?.name || 'Creator'}
              className="w-11 h-11 rounded-full object-cover border-2 border-white group-hover:border-amber-400 shadow-md group-hover:scale-105 transition-all"
            />
            <button
              onClick={e => {
                e.stopPropagation();
                onFollowToggle(video.creator?.id || '');
              }}
              className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] shadow-sm transition-colors ${
                video.isFollowed
                  ? 'bg-neutral-800 text-neutral-300 border border-neutral-600'
                  : 'bg-amber-500 text-neutral-950 font-bold hover:bg-amber-400'
              }`}
              aria-label="Follow creator"
            >
              {video.isFollowed ? (
                <Check className="w-3 h-3" />
              ) : (
                <Plus className="w-3 h-3 stroke-[3]" />
              )}
            </button>
          </div>

          {/* 2. Like Button */}
          <button
            onClick={e => {
              e.stopPropagation();
              handleLike();
            }}
            className="flex flex-col items-center gap-0.5 group"
            aria-label="Like meme"
          >
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-transform group-active:scale-125 ${
                video.isLiked
                  ? 'bg-rose-500/20 text-rose-500'
                  : 'bg-black/50 backdrop-blur-md text-white hover:bg-black/70'
              }`}
            >
              <Heart
                className={`w-5 h-5 transition-colors ${
                  video.isLiked ? 'fill-rose-500 text-rose-500' : ''
                }`}
              />
            </div>
            <span className="text-[10px] font-mono tabular-nums text-neutral-200">
              {(video.likesCount || 0).toLocaleString()}
            </span>
          </button>

          {/* 3. Comments Button */}
          <button
            onClick={e => {
              e.stopPropagation();
              onOpenComments();
            }}
            className="flex flex-col items-center gap-0.5 group"
            aria-label="Open comments"
          >
            <div className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/70 flex items-center justify-center group-active:scale-110 transition-transform">
              <MessageCircle className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono tabular-nums text-neutral-200">
              {(video.commentsCount || 0).toLocaleString()}
            </span>
          </button>

          {/* 4. Zawadi (Gift) Button */}
          <button
            onClick={e => {
              e.stopPropagation();
              onOpenGift();
            }}
            className="flex flex-col items-center gap-0.5 group"
            title="Tuma Zawadi / Gift creator"
          >
            <div className="w-11 h-11 rounded-full bg-amber-500/30 hover:bg-amber-500 text-amber-300 hover:text-neutral-950 flex items-center justify-center backdrop-blur-md border border-amber-400/40 group-active:scale-125 transition-transform">
              <Gift className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono tabular-nums text-amber-300 font-bold">
              {language === 'sw' ? 'Zawadi' : 'Gift'}
            </span>
          </button>

          {/* 5. Pakua (Download with @Cheka watermark) Button */}
          <button
            onClick={handleDownloadVideo}
            disabled={isDownloading}
            className="flex flex-col items-center gap-0.5 group"
            title="Pakua video yenye alama ya @Cheka"
          >
            <div className="w-11 h-11 rounded-full bg-black/50 hover:bg-emerald-600 text-white flex items-center justify-center backdrop-blur-md border border-white/10 group-active:scale-110 transition-transform">
              <Download className={`w-5 h-5 ${isDownloading ? 'animate-bounce text-emerald-400' : ''}`} />
            </div>
            <span className="text-[10px] font-mono tabular-nums text-neutral-300 font-medium">
              {isDownloading ? (language === 'sw' ? 'Inapakua...' : 'Saving...') : (language === 'sw' ? 'Pakua' : 'Save')}
            </span>
          </button>
        </div>
      </div>

      {/* SUBTLE HOLD VISUAL FEEDBACK (PULSE HINT BEFORE SHEET POPS) */}
      {isHolding && (
        <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center animate-fade-in">
          <div className="flex flex-col items-center gap-2 p-3.5 px-5 rounded-2xl bg-black/70 backdrop-blur-md border border-amber-500/50 text-amber-300 shadow-2xl scale-100 transition-all">
            <Sparkles className="w-5 h-5 text-amber-400 animate-spin" />
            <span className="text-xs font-bold text-white tracking-wide">
              {language === 'sw' ? 'Shikilia: Inafungua Duet & Chaguo...' : 'Holding: Opening Duet & Options...'}
            </span>
          </div>
        </div>
      )}

      {/* HOLD SCREEN QUICK ACTIONS SHEET (Appears on holding video: Duet, Laugh, Share, Save, Report) */}
      {showLongPressSheet && (
        <div 
          className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
          onClick={() => setShowLongPressSheet(false)}
        >
          <div 
            className="w-full max-w-sm bg-neutral-900/95 border border-amber-500/40 rounded-3xl p-5 shadow-2xl space-y-4 animate-scale-up"
            onClick={e => e.stopPropagation()}
          >
            {/* Sheet Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Smile className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-extrabold text-sm text-white">
                    {language === 'sw' ? 'Chaguo za Video & Duet' : 'Video Options & Duet'}
                  </h3>
                  <p className="text-[10px] text-neutral-400">
                    {language === 'sw' ? 'Chagua kitendo unachotaka kufanya' : 'Select an action'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowLongPressSheet(false)}
                className="p-1 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white"
                aria-label="Funga"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 1. DUET / REACTION (Prominent Featured Action) */}
            <button
              onClick={() => {
                setShowLongPressSheet(false);
                if (isPlaying) {
                  onTogglePlayPause();
                }
                onOpenDuet?.();
                memeAudio.playBoing();
              }}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-pink-600/30 via-rose-500/20 to-purple-600/25 hover:from-pink-600/40 hover:to-purple-600/35 border border-pink-500/40 text-left transition-all active:scale-98 group shadow-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-pink-500 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                  <Split className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-extrabold text-pink-300">
                      Duet & Reaction 🎙️
                    </p>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-pink-500/30 text-pink-200 border border-pink-400/30 uppercase">
                      Mpya
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-300">
                    {language === 'sw' ? 'Rekodi video yako pembeni ya hii (Split screen)' : 'Record side-by-side reaction'}
                  </p>
                </div>
              </div>
            </button>

            {/* Action Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* 2. CHEKA LAUGH REACTION */}
              <button
                onClick={handleLongPressCheka}
                className="flex items-center gap-3 p-3 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-left transition-all active:scale-95 group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-neutral-950 flex items-center justify-center shadow-md">
                  <Smile className="w-6 h-6 fill-neutral-950" />
                </div>
                <div>
                  <p className="text-xs font-bold text-amber-300">
                    {language === 'sw' ? 'Cheka! 🤣' : 'Laugh! 🤣'}
                  </p>
                  <p className="text-[10px] text-neutral-400">
                    {language === 'sw' ? 'Mcheko wa Swahili' : 'Play sound'}
                  </p>
                </div>
              </button>

              {/* 3. SHARE */}
              <button
                onClick={() => {
                  setShowLongPressSheet(false);
                  onOpenShare();
                }}
                className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-800 hover:bg-neutral-700/80 border border-neutral-700 text-left transition-all active:scale-95"
              >
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-100">
                    {language === 'sw' ? 'Shiriki' : 'Share'}
                  </p>
                  <p className="text-[10px] text-neutral-400">WhatsApp / Copy</p>
                </div>
              </button>

              {/* 4. SAVE / BOOKMARK */}
              <button
                onClick={() => {
                  onSaveToggle(video.id);
                  memeAudio.playBoing();
                  setShowLongPressSheet(false);
                }}
                className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-800 hover:bg-neutral-700/80 border border-neutral-700 text-left transition-all active:scale-95"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  video.isSaved ? 'bg-amber-500/20 text-amber-400' : 'bg-neutral-700 text-neutral-300'
                }`}>
                  <Bookmark className={`w-5 h-5 ${video.isSaved ? 'fill-amber-400 text-amber-400' : ''}`} />
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-100">
                    {video.isSaved 
                      ? (language === 'sw' ? 'Imehifadhiwa' : 'Saved') 
                      : (language === 'sw' ? 'Hifadhi' : 'Save')}
                  </p>
                  <p className="text-[10px] text-neutral-400">
                    {language === 'sw' ? 'Kwenye orodha' : 'Bookmark'}
                  </p>
                </div>
              </button>

              {/* 5. Creator Profile */}
              <button
                onClick={() => {
                  setShowLongPressSheet(false);
                  onOpenCreatorProfile?.(video.creator);
                }}
                className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-800 hover:bg-neutral-700/80 border border-neutral-700 text-left transition-all active:scale-95"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center overflow-hidden">
                  <img
                    src={video.creator?.avatar || '/assets/images/swahili_comedian_avatar_1792057038016.jpg'}
                    alt="Creator"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-100 truncate max-w-[90px]">
                    @{video.creator?.username || 'mchekeshaji'}
                  </p>
                  <p className="text-[10px] text-neutral-400">
                    {language === 'sw' ? 'Wasifu kamili' : 'Profile'}
                  </p>
                </div>
              </button>
            </div>

            {/* 6. PAKUA VIDEO YENYE ALAMA YA @CHEKA */}
            <button
              onClick={(e) => {
                setShowLongPressSheet(false);
                handleDownloadVideo(e);
              }}
              disabled={isDownloading}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-left transition-all active:scale-98 group shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-neutral-950 flex items-center justify-center shadow-md font-black">
                  <Download className={`w-5 h-5 ${isDownloading ? 'animate-bounce' : ''}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-black text-emerald-300">
                      {language === 'sw' ? 'Pakua Video Yenye Alama ya @Cheka' : 'Download Video with @Cheka mark'}
                    </p>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                      HD MP4
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-300">
                    {language === 'sw' ? 'Hifadhi kwenye simu yako ikiwa na alama ya @Cheka' : 'Save to device with @Cheka watermark'}
                  </p>
                </div>
              </div>
            </button>

            {/* 7. SIPENDEZWI / RIPOTI */}
            <button
              onClick={() => {
                setShowLongPressSheet(false);
                onOpenReport();
              }}
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-colors"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>{language === 'sw' ? 'Sipendezwi nayo / Ripoti Maudhui' : 'Not Interested / Report Content'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Bottom video progress scrubber */}
      <div className="absolute bottom-0 left-0 right-0 z-30 w-full bg-neutral-900/60 h-1">
        <div
          className="h-full bg-amber-500 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
});

export const ReelPlayer: React.FC<ReelPlayerProps> = ({
  videos,
  currentIndex,
  onNavigate,
  onLikeToggle,
  onSaveToggle,
  onFollowToggle,
  onOpenComments,
  onOpenShare,
  onOpenGift,
  onOpenDuet,
  onOpenReport,
  onOpenAlgorithm,
  onOpenSettings,
  onOpenCreatorProfile,
  onOpenDirectChat,
  onOpenAdCampaign,
  onOpenSearch,
  onOpenInstallModal,
  onRefresh,
  isOwner = false,
  language,
  feedFilter,
  onFeedFilterChange,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  onFastSkip,
  onWatchTimeRecorded,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [preloadedSet, setPreloadedSet] = useState<Set<number>>(new Set([0, 1]));

  // Pull to refresh tracking
  const [pullY, setPullY] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const pullStartRef = useRef<number | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const reelRefs = useRef<(HTMLDivElement | null)[]>([]);

  const activeIndexRef = useRef<number>(currentIndex);
  const activeStartTimeRef = useRef<number>(Date.now());

  const videosRef = useRef(videos);
  useEffect(() => {
    videosRef.current = videos;
  }, [videos]);

  const isMutedRef = useRef(isMuted);
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  const togglePlayPause = useCallback(() => {
    setIsPlaying(prev => !prev);
    memeAudio.playBoing();
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
    memeAudio.playPop();
  }, []);

  const handleLikeClick = useCallback((videoId: string) => {
    onLikeToggle(videoId);
    memeAudio.playLikeSound();
  }, [onLikeToggle]);

  const scrollToReel = useCallback((targetIndex: number) => {
    if (targetIndex >= 0 && targetIndex < videosRef.current.length) {
      const targetEl = reelRefs.current[targetIndex];
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, []);

  const handleAutoAdvance = useCallback(() => {
    const nextIdx = activeIndexRef.current + 1;
    if (nextIdx < videosRef.current.length) {
      scrollToReel(nextIdx);
    } else if (hasMore && onLoadMore) {
      onLoadMore();
    }
  }, [scrollToReel, hasMore, onLoadMore]);

  // Handle watch time recording & taste affinity update when reel changes
  const handleReelActiveChange = useCallback((newIndex: number) => {
    const prevIndex = activeIndexRef.current;
    if (newIndex === prevIndex) return;

    if (containerRef.current) {
      const allVideoElements = containerRef.current.querySelectorAll('video');
      allVideoElements.forEach(el => {
        const parent = el.closest('[data-reel-index]');
        const reelIdx = parent ? parseInt(parent.getAttribute('data-reel-index') || '-1', 10) : -1;
        if (reelIdx !== newIndex) {
          el.muted = true;
          el.volume = 0;
          el.pause();
        } else {
          el.muted = isMutedRef.current;
          el.volume = isMutedRef.current ? 0 : 1.0;
          const p = el.play();
          if (p !== undefined) {
            p.catch(() => {
              el.muted = true;
              el.play().catch(() => {});
            });
          }
        }
      });
    }

    const elapsedMs = Date.now() - activeStartTimeRef.current;
    const prevVideo = videosRef.current[prevIndex];
    if (prevVideo?.id && elapsedMs >= 400) {
      const isFastSkip = newIndex > prevIndex && elapsedMs < 2000;
      const durationSec = Math.max(1, prevVideo.duration || 15);
      const loops = Math.max(0, Math.floor(elapsedMs / (durationSec * 1000)) - 1);

      recordLocalWatchTime(prevVideo, elapsedMs, loops);

      if (onWatchTimeRecorded) {
        onWatchTimeRecorded(prevVideo.id, elapsedMs, loops, isFastSkip);
      } else if (isFastSkip && onFastSkip) {
        onFastSkip(prevVideo.id, Math.max(400, elapsedMs));
      }
    }

    activeIndexRef.current = newIndex;
    activeStartTimeRef.current = Date.now();
    onNavigate(newIndex);
  }, [onWatchTimeRecorded, onFastSkip, onNavigate]);

  useEffect(() => {
    return () => {
      const curIdx = activeIndexRef.current;
      const curVideo = videosRef.current[curIdx];
      const elapsedMs = Date.now() - activeStartTimeRef.current;
      if (curVideo?.id && elapsedMs >= 800) {
        const durationSec = Math.max(1, curVideo.duration || 15);
        const loops = Math.max(0, Math.floor(elapsedMs / (durationSec * 1000)) - 1);
        recordLocalWatchTime(curVideo, elapsedMs, loops);
        if (onWatchTimeRecorded) {
          onWatchTimeRecorded(curVideo.id, elapsedMs, loops, elapsedMs < 2000);
        }
      }
    };
  }, [onWatchTimeRecorded]);

  // Pull-to-refresh touch event handlers (strictly gated so it never triggers accidentally while scrolling)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop === 0 && currentIndex === 0) {
      pullStartRef.current = e.touches[0].clientY;
    } else {
      pullStartRef.current = null;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Instantly abort any hold menu when user touches and drags
    window.dispatchEvent(new CustomEvent('cheka_scroll_active'));

    if (pullStartRef.current !== null && !isRefreshing && containerRef.current && containerRef.current.scrollTop === 0) {
      const currentY = e.touches[0].clientY;
      const delta = currentY - pullStartRef.current;
      // Only recognize downward pull if delta exceeds 25px threshold
      if (delta > 25) {
        setPullY(Math.min(90, (delta - 25) * 0.4));
      }
    }
  };

  const handleTouchEnd = async () => {
    if (pullY >= 75 && onRefresh && !isRefreshing) {
      setIsRefreshing(true);
      memeAudio.playBoing();
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullY(0);
      }
    } else {
      setPullY(0);
    }
    pullStartRef.current = null;
  };

  // Scroll listener: dispatches cancel event for hold gesture & isolates audio on swipe
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onScroll = () => {
      // 1. Instantly abort any hold menu during scrolling
      window.dispatchEvent(new CustomEvent('cheka_scroll_active'));

      // 2. Audio isolation:
      // If user scrolls even 35px away from active reel, mute outgoing video immediately
      // so previous video's sound never bleeds into the next video!
      const itemHeight = container.clientHeight || window.innerHeight;
      const currentScroll = container.scrollTop;
      const activeTop = activeIndexRef.current * itemHeight;
      const scrollOffset = Math.abs(currentScroll - activeTop);

      const allVideoElements = container.querySelectorAll('video');
      allVideoElements.forEach(el => {
        const parent = el.closest('[data-reel-index]');
        const reelIdx = parent ? parseInt(parent.getAttribute('data-reel-index') || '-1', 10) : -1;
        if (reelIdx !== activeIndexRef.current) {
          el.muted = true;
          el.volume = 0;
          el.pause();
        } else if (scrollOffset > 35) {
          // Outgoing video is being scrolled away - immediately silence it
          el.muted = true;
          el.volume = 0;
        }
      });
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', onScroll);
    };
  }, []);

  // Primary IntersectionObserver: Single authoritative source of truth for active reel index
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const activeObserver = new IntersectionObserver(
      (entries) => {
        let bestEntry: IntersectionObserverEntry | null = null;
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.45) {
            if (!bestEntry || entry.intersectionRatio > bestEntry.intersectionRatio) {
              bestEntry = entry;
            }
          }
        });

        if (bestEntry) {
          const indexAttr = (bestEntry as IntersectionObserverEntry).target.getAttribute('data-reel-index');
          if (indexAttr !== null) {
            const idx = parseInt(indexAttr, 10);
            if (!isNaN(idx) && idx !== activeIndexRef.current) {
              handleReelActiveChange(idx);
            }
          }
        }
      },
      {
        root: container,
        threshold: [0.45, 0.70],
      }
    );

    reelRefs.current.forEach((el) => {
      if (el) activeObserver.observe(el);
    });

    return () => {
      activeObserver.disconnect();
    };
  }, [videos.length, handleReelActiveChange]);


  // Preload Observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preloadObserver = new IntersectionObserver(
      (entries) => {
        setPreloadedSet(prev => {
          const nextSet = new Set(prev);
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const idxAttr = entry.target.getAttribute('data-reel-index');
              if (idxAttr !== null) {
                const idx = parseInt(idxAttr, 10);
                if (!isNaN(idx)) {
                  nextSet.add(idx);
                  if (idx + 1 < videos.length) nextSet.add(idx + 1);
                  if (idx + 2 < videos.length) nextSet.add(idx + 2);
                }
              }
            }
          });
          return nextSet;
        });
      },
      {
        root: container,
        rootMargin: '200% 0px',
        threshold: 0.01,
      }
    );

    reelRefs.current.forEach((el) => {
      if (el) preloadObserver.observe(el);
    });

    return () => {
      preloadObserver.disconnect();
    };
  }, [videos.length]);

  // Infinite feed loading
  useEffect(() => {
    if (currentIndex >= videos.length - 2 && hasMore && !isLoadingMore && onLoadMore) {
      onLoadMore();
    }
  }, [currentIndex, videos.length, hasMore, isLoadingMore, onLoadMore]);

  // Desktop keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.key === 'ArrowUp' || e.key === 'k') {
        if (currentIndex > 0) {
          scrollToReel(currentIndex - 1);
          memeAudio.playBoing();
        }
      } else if (e.key === 'ArrowDown' || e.key === 'j') {
        if (currentIndex < videos.length - 1) {
          scrollToReel(currentIndex + 1);
          memeAudio.playBoing();
        }
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === 'm') {
        toggleMute();
      } else if (e.key === 'l') {
        const curVideo = videos[currentIndex];
        if (curVideo) {
          handleLikeClick(curVideo.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, videos, scrollToReel, togglePlayPause, toggleMute, handleLikeClick]);

  return (
    <div className="relative w-full h-[100dvh] flex items-center justify-center bg-black overflow-hidden">
      {/* PULL TO REFRESH BANNER AT TOP */}
      {(pullY > 0 || isRefreshing) && (
        <div 
          className="absolute top-2 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500 text-neutral-950 font-bold text-xs shadow-2xl transition-transform"
          style={{ transform: `translate(-50%, ${pullY}px)` }}
        >
          {isRefreshing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>{language === 'sw' ? 'Inapakia vichekesho vipya...' : 'Refreshing feed...'}</span>
            </>
          ) : (
            <>
              <ArrowDown className={`w-3.5 h-3.5 transition-transform ${pullY > 50 ? 'rotate-180' : ''}`} />
              <span>{pullY > 50 ? (language === 'sw' ? 'Achilia kupakia!' : 'Release to refresh') : (language === 'sw' ? 'Vuta chini upate mpya' : 'Pull down to refresh')}</span>
            </>
          )}
        </div>
      )}

      {/* TOP HEADER CONTROLS (Kwa Ajili Yako | Search Bar | Zinazovuma | Settings Icon) */}
      <div className="absolute top-3 left-0 right-0 z-30 flex items-center justify-between px-3 sm:px-5 pointer-events-none max-w-lg mx-auto">
        {/* Left: Feed Filters (Kwa Ajili Yako & Zinazovuma) */}
        <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md p-1 rounded-full border border-white/10 text-xs font-semibold shadow-2xl pointer-events-auto">
          <button
            onClick={() => {
              onFeedFilterChange('foryou');
              memeAudio.playBoing();
            }}
            className={`px-3 py-1.5 rounded-full transition-all text-xs whitespace-nowrap ${
              feedFilter === 'foryou'
                ? 'bg-amber-500 text-neutral-950 font-bold shadow-md'
                : 'text-neutral-300 hover:text-white'
            }`}
          >
            {language === 'sw' ? 'Kwa Ajili Yako' : 'For You'}
          </button>

          <button
            onClick={() => {
              onFeedFilterChange('trending');
              memeAudio.playBoing();
            }}
            className={`px-3 py-1.5 rounded-full transition-all text-xs whitespace-nowrap flex items-center gap-1 ${
              feedFilter === 'trending'
                ? 'bg-amber-500 text-neutral-950 font-bold shadow-md'
                : 'text-neutral-300 hover:text-white'
            }`}
          >
            <span>{language === 'sw' ? 'Zinazovuma' : 'Trending'}</span>
            <span>🔥</span>
          </button>
        </div>

        {/* Right: Search Bar & Setting Button */}
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
          {/* Search Trigger */}
          <button
            onClick={() => {
              onOpenSearch?.();
              memeAudio.playPop();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 hover:bg-neutral-800 backdrop-blur-md border border-white/10 text-amber-400 hover:text-amber-300 text-xs font-bold shadow-md transition-all active:scale-95"
            title={language === 'sw' ? 'Tafuta vichekesho na lebo (#Hashtags)' : 'Search memes and tags'}
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden xs:inline text-neutral-300 font-normal">{language === 'sw' ? 'Tafuta' : 'Search'}</span>
          </button>

          {/* Setting Icon Button */}
          <button
            onClick={() => {
              onOpenSettings?.();
              memeAudio.playPop();
            }}
            className="p-2 rounded-full bg-black/60 hover:bg-neutral-800 backdrop-blur-md border border-white/10 text-neutral-200 hover:text-amber-400 shadow-md transition-all active:scale-95"
            title={language === 'sw' ? 'Mipangilio ya App (Settings)' : 'Settings'}
            aria-label="Settings"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* NATIVE SCROLL-SNAP CONTAINER */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="w-full md:max-w-[430px] h-[100dvh] overflow-y-scroll snap-y snap-mandatory touch-pan-y no-scrollbar relative select-none bg-neutral-950 md:border-x md:border-neutral-800"
        style={{
          scrollSnapType: 'y mandatory',
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
          overscrollBehaviorY: 'contain',
          height: '100dvh',
        }}
      >
        {videos.map((video, idx) => {
          const isActive = idx === currentIndex;
          const isPreload = preloadedSet.has(idx) || Math.abs(idx - currentIndex) <= 1;
          const showAdAfter = (idx + 1) % 6 === 0;

          return (
            <div
              key={`${video.id || 'video'}-${idx}`}
              ref={el => {
                reelRefs.current[idx] = el;
              }}
              data-reel-index={idx}
              className="w-full h-[100dvh] snap-start shrink-0 relative"
              style={{
                scrollSnapAlign: 'start',
                scrollSnapStop: 'always',
                height: '100dvh',
              }}
            >
              <SingleReelItem
                video={video}
                index={idx}
                isActive={isActive}
                isPreload={isPreload}
                isPlaying={isPlaying}
                isMuted={isMuted}
                autoScroll={false}
                onAutoAdvance={handleAutoAdvance}
                onTogglePlayPause={togglePlayPause}
                onToggleMute={toggleMute}
                onLikeClick={handleLikeClick}
                onSaveToggle={onSaveToggle}
                onFollowToggle={onFollowToggle}
                onOpenComments={onOpenComments}
                onOpenShare={onOpenShare}
                onOpenGift={onOpenGift}
                onOpenDuet={onOpenDuet}
                onOpenReport={onOpenReport}
                onOpenAlgorithm={onOpenAlgorithm}
                onOpenCreatorProfile={onOpenCreatorProfile}
                onOpenSearch={onOpenSearch}
                isOwner={isOwner}
                language={language}
              />
            </div>
          );
        })}
      </div>

      {/* DESKTOP-ONLY FLOATING NAVIGATION BUTTONS */}
      <div className="hidden lg:flex flex-col items-center gap-2 absolute right-8 bottom-1/2 translate-y-1/2 z-30">
        <button
          onClick={() => {
            if (currentIndex > 0) {
              scrollToReel(currentIndex - 1);
              memeAudio.playBoing();
            }
          }}
          disabled={currentIndex === 0}
          className="p-3 rounded-full bg-neutral-900/90 border border-neutral-700/80 hover:bg-neutral-800 disabled:opacity-30 text-white shadow-xl transition-all hover:scale-110"
          title="Video Iliyotangulia (↑ au k)"
          aria-label="Previous reel"
        >
          <ChevronUp className="w-5 h-5 text-amber-400" />
        </button>

        <button
          onClick={() => {
            if (currentIndex < videos.length - 1) {
              scrollToReel(currentIndex + 1);
              memeAudio.playBoing();
            }
          }}
          disabled={currentIndex === videos.length - 1}
          className="p-3 rounded-full bg-neutral-900/90 border border-neutral-700/80 hover:bg-neutral-800 disabled:opacity-30 text-white shadow-xl transition-all hover:scale-110"
          title="Video Inayofuata (↓ au j)"
          aria-label="Next reel"
        >
          <ChevronDown className="w-5 h-5 text-amber-400" />
        </button>
      </div>
    </div>
  );
};
