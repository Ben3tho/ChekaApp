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
  ChevronDown
} from 'lucide-react';
import { MemeVideo, Language } from '../types';
import { memeAudio } from '../utils/audioSynth';

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
  onOpenReport: () => void;
  onOpenAlgorithm: () => void;
  language: Language;
  feedFilter: 'foryou' | 'following' | 'latest' | 'trending';
  onFeedFilterChange: (filter: 'foryou' | 'following' | 'latest' | 'trending') => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  onFastSkip?: (videoId: string, watchMs: number) => void;
}

interface SingleReelItemProps {
  video: MemeVideo;
  index: number;
  isActive: boolean;
  isPreload: boolean;
  isPlaying: boolean;
  isMuted: boolean;
  onTogglePlayPause: () => void;
  onToggleMute: () => void;
  onLikeClick: (videoId: string) => void;
  onSaveToggle: (videoId: string) => void;
  onFollowToggle: (creatorId: string) => void;
  onOpenComments: () => void;
  onOpenShare: () => void;
  onOpenGift: () => void;
  onOpenReport: () => void;
  onOpenAlgorithm: () => void;
  language: Language;
}

const SingleReelItem = React.memo<SingleReelItemProps>(({
  video,
  index,
  isActive,
  isPreload,
  isPlaying,
  isMuted,
  onTogglePlayPause,
  onToggleMute,
  onLikeClick,
  onSaveToggle,
  onFollowToggle,
  onOpenComments,
  onOpenShare,
  onOpenGift,
  onOpenReport,
  onOpenAlgorithm,
  language,
}) => {
  const [playbackSec, setPlaybackSec] = useState<number>(0);
  const [showHeartBurst, setShowHeartBurst] = useState<boolean>(false);
  const [showPlayOverlay, setShowPlayOverlay] = useState<boolean>(false);
  const videoElemRef = useRef<HTMLVideoElement | null>(null);

  // Pointer gesture tracker for tap vs swipe distinction
  const pointerStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // Track playback progress when this reel is active
  useEffect(() => {
    if (!isActive) {
      setPlaybackSec(0);
      if (videoElemRef.current) {
        videoElemRef.current.pause();
        videoElemRef.current.currentTime = 0;
      }
      return;
    }

    if (videoElemRef.current) {
      if (isPlaying) {
        videoElemRef.current.play().catch(() => {});
      } else {
        videoElemRef.current.pause();
      }
    }

    let intervalId: number | null = null;
    if (isPlaying) {
      intervalId = window.setInterval(() => {
        setPlaybackSec(prev => {
          if (prev >= video.duration) {
            return 0; // Loop seamlessly
          }
          return prev + 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isActive, isPlaying, video.duration]);

  // Sync mute state on HTML5 video element
  useEffect(() => {
    if (videoElemRef.current) {
      videoElemRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Pointer down: record start coordinates without preventDefault
  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    // Don't intercept button clicks or interactive drawer triggers
    if (target.closest('button') || target.closest('a') || target.closest('input')) {
      return;
    }
    pointerStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now(),
    };
  };

  // Pointer up: Check threshold for tap vs swipe
  // Rule: dx < 10px && dy < 10px && dt < 250ms -> Tap to Play/Pause
  // Anything more -> Swipe gesture; let browser native scroll-snap do its job!
  const handlePointerUp = (e: React.PointerEvent) => {
    if (!pointerStartRef.current) return;
    const start = pointerStartRef.current;
    pointerStartRef.current = null;

    const dx = Math.abs(e.clientX - start.x);
    const dy = Math.abs(e.clientY - start.y);
    const dt = Date.now() - start.time;

    if (dx < 10 && dy < 10 && dt < 250) {
      onTogglePlayPause();
      setShowPlayOverlay(true);
      setTimeout(() => setShowPlayOverlay(false), 700);
    }
  };

  const handlePointerCancel = () => {
    pointerStartRef.current = null;
  };

  const handleLike = () => {
    onLikeClick(video.id);
    if (!video.isLiked) {
      setShowHeartBurst(true);
      setTimeout(() => setShowHeartBurst(false), 800);
    }
  };

  const isCloudflareStream = Boolean(
    video.videoUid &&
    (video.mediaType === 'video' || (!video.videoUid.startsWith('vid_') && !video.videoUid.startsWith('meme_')))
  );

  const isDirectVideo = Boolean(
    !isCloudflareStream && (video.mediaType === 'video' || video.mediaUrl?.endsWith('.mp4') || video.streamPlayback?.mp4)
  );

  // Live formula score calculation
  const score = Math.round(
    ((video.signals?.watchRatio || 1) * 3 * 1000) +
    ((video.likesCount || 0) / 5) +
    (video.sharesCount || 0) +
    (video.commentsCount || 0) -
    ((video.signals?.skips || 0) * 20)
  );

  const progressPercent = Math.min(100, (playbackSec / Math.max(1, video.duration)) * 100);

  return (
    <div
      data-reel-index={index}
      className="w-full h-[100dvh] snap-start shrink-0 relative flex flex-col justify-between overflow-hidden bg-black select-none"
      style={{
        scrollSnapAlign: 'start',
        scrollSnapStop: 'always',
        height: '100dvh',
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      {/* Background Media Layer */}
      <div className="absolute inset-0 overflow-hidden bg-neutral-950">
        {isCloudflareStream ? (
          (isActive || isPreload) ? (
            <div className="absolute inset-0 w-full h-full">
              <iframe
                src={`https://iframe.videodelivery.net/${video.videoUid}?autoplay=${isActive && isPlaying ? 'true' : 'false'}&loop=true&muted=${isMuted ? 'true' : 'false'}&controls=false`}
                className="w-full h-full border-0 absolute inset-0 pointer-events-none"
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                loading={isActive ? 'eager' : 'lazy'}
                title={video.title}
              />
              <div className="absolute top-14 left-4 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 border border-amber-500/40 text-[10px] text-amber-300 font-mono pointer-events-none shadow-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>Cloudflare Stream HLS</span>
              </div>
            </div>
          ) : (
            <img
              src={video.mediaUrl}
              alt={video.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          )
        ) : isDirectVideo ? (
          (isActive || isPreload) ? (
            <video
              ref={videoElemRef}
              src={video.streamPlayback?.mp4 || video.mediaUrl}
              className="w-full h-full object-cover"
              playsInline
              loop
              muted={isMuted}
              preload={isActive ? 'auto' : 'metadata'}
            />
          ) : (
            <img
              src={video.mediaUrl}
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

      {/* Heart Burst on Like */}
      {showHeartBurst && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-ping">
          <Heart className="w-24 h-24 text-rose-500 fill-rose-500 drop-shadow-2xl opacity-90" />
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

      {/* TOP OVERLAY CONTROLS (Positioned below top header safe area) */}
      <div className="relative z-20 pt-16 md:pt-14 px-4 flex items-center justify-between text-white pointer-events-auto">
        {/* Telemetry pill */}
        <button
          onClick={e => {
            e.stopPropagation();
            onOpenAlgorithm();
          }}
          className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md border border-neutral-700/60 rounded-full px-2.5 py-1 text-[11px] font-mono text-amber-300 hover:bg-black/80 transition-colors shadow-md"
          title="Angalia algorithm ya video hii"
        >
          <Activity className="w-3 h-3 text-amber-400" />
          <span>Score: {score.toLocaleString()}</span>
        </button>

        {/* Mute and Report controls */}
        <div className="flex items-center gap-2">
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

      {/* TOP MEME IMPACT TEXT */}
      {video.topOverlayText && (
        <div className="relative z-10 px-6 text-center select-none pointer-events-none mt-2">
          <span className="font-black text-white text-base md:text-lg uppercase tracking-wider leading-snug drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] [text-shadow:_2px_2px_0_rgb(0_0_0),_-2px_-2px_0_rgb(0_0_0),_2px_-2px_0_rgb(0_0_0),_-2px_2px_0_rgb(0_0_0)]">
            {video.topOverlayText}
          </span>
        </div>
      )}

      {/* BOTTOM MEME IMPACT TEXT */}
      {video.bottomOverlayText && (
        <div className="relative z-10 px-6 text-center select-none pointer-events-none mt-auto mb-2">
          <span className="font-black text-amber-300 text-base md:text-lg uppercase tracking-wider leading-snug drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] [text-shadow:_2px_2px_0_rgb(0_0_0),_-2px_-2px_0_rgb(0_0_0),_2px_-2px_0_rgb(0_0_0),_-2px_2px_0_rgb(0_0_0)]">
            {video.bottomOverlayText}
          </span>
        </div>
      )}

      {/* BOTTOM ACTION BAR & CREATOR INFO (Safe area above bottom nav) */}
      <div className="relative z-20 px-4 pb-20 md:pb-6 flex items-end justify-between gap-3 text-white pointer-events-auto">
        {/* Left column: Creator, Caption, Tags, Music */}
        <div className="flex-1 space-y-2 pr-2">
          {/* Creator handle */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-neutral-100 hover:underline cursor-pointer">
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
              <span key={tag} className="hover:underline cursor-pointer">
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

        {/* Right column: Vertical Action Rail */}
        <div className="flex flex-col items-center gap-3 pb-2 shrink-0">
          {/* Creator Avatar with Follow Button */}
          <div className="relative mb-1">
            <img
              src={video.creator?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=creator'}
              alt={video.creator?.name || 'Creator'}
              className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md"
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

          {/* Like Button */}
          <button
            onClick={e => {
              e.stopPropagation();
              handleLike();
            }}
            className="flex flex-col items-center gap-0.5 group"
            aria-label="Like meme"
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform group-active:scale-125 ${
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

          {/* Instant Laugh Button (Web Audio Swahili Laugh) */}
          <button
            onClick={e => {
              e.stopPropagation();
              memeAudio.playLaugh();
            }}
            className="flex flex-col items-center gap-0.5 group"
            title="Cheka / Play Laugh sound"
          >
            <div className="w-10 h-10 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 flex items-center justify-center backdrop-blur-md border border-amber-500/30 group-active:scale-125 transition-transform">
              <Smile className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono tabular-nums text-amber-300 font-bold">
              {language === 'sw' ? 'Cheka!' : 'Laugh!'}
            </span>
          </button>

          {/* Comments Button */}
          <button
            onClick={e => {
              e.stopPropagation();
              onOpenComments();
            }}
            className="flex flex-col items-center gap-0.5 group"
            aria-label="Open comments"
          >
            <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/70 flex items-center justify-center group-active:scale-110 transition-transform">
              <MessageCircle className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono tabular-nums text-neutral-200">
              {(video.commentsCount || 0).toLocaleString()}
            </span>
          </button>

          {/* Share Button */}
          <button
            onClick={e => {
              e.stopPropagation();
              onOpenShare();
            }}
            className="flex flex-col items-center gap-0.5 group"
            aria-label="Share meme"
          >
            <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/70 flex items-center justify-center group-active:scale-110 transition-transform">
              <Share2 className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono tabular-nums text-neutral-200">
              {(video.sharesCount || 0).toLocaleString()}
            </span>
          </button>

          {/* Bookmark / Save Button */}
          <button
            onClick={e => {
              e.stopPropagation();
              onSaveToggle(video.id);
            }}
            className="flex flex-col items-center gap-0.5 group"
            aria-label="Save meme"
          >
            <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/70 flex items-center justify-center group-active:scale-110 transition-transform">
              <Bookmark
                className={`w-5 h-5 ${
                  video.isSaved ? 'fill-amber-400 text-amber-400' : ''
                }`}
              />
            </div>
            <span className="text-[10px] font-mono tabular-nums text-neutral-200">
              {(video.savesCount || 0).toLocaleString()}
            </span>
          </button>

          {/* Gift Button */}
          <button
            onClick={e => {
              e.stopPropagation();
              onOpenGift();
            }}
            className="flex flex-col items-center gap-0.5 group"
            title="Tuma Zawadi / Gift creator"
          >
            <div className="w-10 h-10 rounded-full bg-amber-500/30 hover:bg-amber-500 text-amber-300 hover:text-neutral-950 flex items-center justify-center backdrop-blur-md border border-amber-400/40 group-active:scale-125 transition-transform">
              <Gift className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono tabular-nums text-amber-300">
              {language === 'sw' ? 'Zawadi' : 'Gift'}
            </span>
          </button>
        </div>
      </div>

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

SingleReelItem.displayName = 'SingleReelItem';

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
  onOpenReport,
  onOpenAlgorithm,
  language,
  feedFilter,
  onFeedFilterChange,
  hasMore,
  isLoadingMore,
  onLoadMore,
  onFastSkip,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const reelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [preloadedSet, setPreloadedSet] = useState<Set<number>>(new Set([0, 1, 2]));

  // Track start time of active reel to detect fast skips (< 2s)
  const activeStartTimeRef = useRef<number>(Date.now());
  const activeIndexRef = useRef<number>(currentIndex);

  useEffect(() => {
    activeIndexRef.current = currentIndex;
    activeStartTimeRef.current = Date.now();
  }, [currentIndex]);

  const togglePlayPause = useCallback(() => {
    setIsPlaying(prev => !prev);
    memeAudio.playBoing();
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      memeAudio.setMuted(next);
      if (!next) {
        memeAudio.playBoing();
      }
      return next;
    });
  }, []);

  const handleLikeClick = useCallback((videoId: string) => {
    onLikeToggle(videoId);
    memeAudio.playLikeSound();
  }, [onLikeToggle]);

  // Smooth scroll to a specific reel (for desktop arrows/keyboard)
  const scrollToReel = useCallback((targetIndex: number) => {
    if (targetIndex >= 0 && targetIndex < videos.length) {
      const targetEl = reelRefs.current[targetIndex];
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [videos.length]);

  // Handle fast skip detection and update active reel
  const handleReelActiveChange = useCallback((newIndex: number) => {
    const prevIndex = activeIndexRef.current;
    if (newIndex === prevIndex) return;

    const elapsedMs = Date.now() - activeStartTimeRef.current;
    // Fast skip check: if skipping forward and watched < 2s
    if (newIndex > prevIndex && elapsedMs < 2000 && onFastSkip) {
      const prevVideo = videos[prevIndex];
      if (prevVideo?.id) {
        onFastSkip(prevVideo.id, Math.max(400, elapsedMs));
      }
    }

    onNavigate(newIndex);
  }, [videos, onFastSkip, onNavigate]);

  // 1. PRIMARY IntersectionObserver (threshold: 0.6)
  // Detects which reel occupies 60%+ of the viewport.
  // The intersecting reel becomes the active playing reel; all others pause!
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const activeObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const indexAttr = entry.target.getAttribute('data-reel-index');
            if (indexAttr !== null) {
              const idx = parseInt(indexAttr, 10);
              if (!isNaN(idx)) {
                handleReelActiveChange(idx);
              }
            }
          }
        });
      },
      {
        root: container,
        threshold: 0.6,
      }
    );

    reelRefs.current.forEach((el) => {
      if (el) activeObserver.observe(el);
    });

    return () => {
      activeObserver.disconnect();
    };
  }, [videos.length, handleReelActiveChange]);

  // 2. SECONDARY IntersectionObserver (rootMargin: '200% 0px')
  // Preloads the next 2 videos as they approach the screen.
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
                  // Also preload adjacent
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

  // Automatic infinite feed loading when scrolling near the end
  useEffect(() => {
    if (currentIndex >= videos.length - 2 && hasMore && !isLoadingMore && onLoadMore) {
      onLoadMore();
    }
  }, [currentIndex, videos.length, hasMore, isLoadingMore, onLoadMore]);

  // Desktop keyboard navigation (ArrowUp, ArrowDown, 'j', 'k', Space, 'm', 'l')
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in a modal or input
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
      {/* Floating Filter Tabs (Kwa Ajili Yako / Kufuata / Mpya / Zinazovuma) */}
      <div className="absolute top-3 left-0 right-0 z-30 flex justify-center pointer-events-none px-4">
        <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md p-1 rounded-full border border-white/10 text-xs font-semibold shadow-2xl pointer-events-auto">
          <button
            onClick={() => {
              onFeedFilterChange('foryou');
              memeAudio.playBoing();
            }}
            className={`px-3 py-1.5 rounded-full transition-all text-[11px] sm:text-xs ${
              feedFilter === 'foryou'
                ? 'bg-amber-500 text-neutral-950 font-bold shadow-md'
                : 'text-neutral-300 hover:text-white'
            }`}
          >
            {language === 'sw' ? 'Kwa Ajili Yako' : 'For You'}
          </button>
          <button
            onClick={() => {
              onFeedFilterChange('following');
              memeAudio.playBoing();
            }}
            className={`px-3 py-1.5 rounded-full transition-all text-[11px] sm:text-xs ${
              feedFilter === 'following'
                ? 'bg-amber-500 text-neutral-950 font-bold shadow-md'
                : 'text-neutral-300 hover:text-white'
            }`}
          >
            {language === 'sw' ? 'Kufuata' : 'Following'}
          </button>
          <button
            onClick={() => {
              onFeedFilterChange('latest');
              memeAudio.playBoing();
            }}
            className={`px-3 py-1.5 rounded-full transition-all text-[11px] sm:text-xs ${
              feedFilter === 'latest'
                ? 'bg-amber-500 text-neutral-950 font-bold shadow-md'
                : 'text-neutral-300 hover:text-white'
            }`}
          >
            {language === 'sw' ? 'Mpya' : 'Latest'}
          </button>
          <button
            onClick={() => {
              onFeedFilterChange('trending');
              memeAudio.playBoing();
            }}
            className={`px-3 py-1.5 rounded-full transition-all text-[11px] sm:text-xs ${
              feedFilter === 'trending'
                ? 'bg-amber-500 text-neutral-950 font-bold shadow-md'
                : 'text-neutral-300 hover:text-white'
            }`}
          >
            {language === 'sw' ? 'Zinazovuma 🔥' : 'Trending 🔥'}
          </button>
        </div>
      </div>

      {/* NATIVE SCROLL-SNAP CONTAINER */}
      {/* 
        - overflow-y: scroll
        - scroll-snap-type: y mandatory
        - height: 100dvh
        - touch-action: pan-y (no preventDefault on touches, native swipe gestures)
      */}
      <div
        ref={containerRef}
        className="w-full max-w-[440px] h-[100dvh] overflow-y-scroll snap-y snap-mandatory touch-pan-y no-scrollbar relative select-none bg-neutral-950 sm:border-x sm:border-neutral-800"
        style={{
          scrollSnapType: 'y mandatory',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
          height: '100dvh',
        }}
      >
        {videos.map((video, idx) => {
          const isActive = idx === currentIndex;
          const isPreload = preloadedSet.has(idx) || Math.abs(idx - currentIndex) <= 2;

          return (
            <div
              key={video.id || `video-${idx}`}
              ref={el => {
                reelRefs.current[idx] = el;
              }}
            >
              <SingleReelItem
                video={video}
                index={idx}
                isActive={isActive}
                isPreload={isPreload}
                isPlaying={isPlaying}
                isMuted={isMuted}
                onTogglePlayPause={togglePlayPause}
                onToggleMute={toggleMute}
                onLikeClick={handleLikeClick}
                onSaveToggle={onSaveToggle}
                onFollowToggle={onFollowToggle}
                onOpenComments={onOpenComments}
                onOpenShare={onOpenShare}
                onOpenGift={onOpenGift}
                onOpenReport={onOpenReport}
                onOpenAlgorithm={onOpenAlgorithm}
                language={language}
              />
            </div>
          );
        })}
      </div>

      {/* DESKTOP-ONLY FLOATING CONTROLS (Hidden on mobile / touchscreens) */}
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
