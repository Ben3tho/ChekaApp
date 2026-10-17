/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Smile, 
  PlusCircle, 
  Layers, 
  Sparkles, 
  Globe, 
  Coins, 
  Flame, 
  Tv, 
  Share2, 
  Server, 
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  User as UserIcon,
  LogOut,
  LogIn
} from 'lucide-react';
import { MemeVideo, Language, Comment, GiftItem } from './types';
import { INITIAL_MEME_VIDEOS, INITIAL_COMMENTS, GIFTS_CATALOG } from './data/initialData';
import { ReelPlayer } from './components/ReelPlayer';
import { CreatorStudio } from './components/CreatorStudio';
import { RecommendationEngineExplorer } from './components/RecommendationEngineExplorer';
import { ArchitectureView } from './components/ArchitectureView';
import { CommentsDrawer } from './components/CommentsDrawer';
import { ShareModal } from './components/ShareModal';
import { GiftModal } from './components/GiftModal';
import { SafetyReportModal } from './components/SafetyReportModal';
import { AuthModal } from './components/AuthModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import { memeAudio } from './utils/audioSynth';

function AppContent() {
  const { user, logout, authFetch } = useAuth();
  const [language, setLanguage] = useState<Language>('sw');
  const [activeTab, setActiveTab] = useState<'feed' | 'studio' | 'algorithm' | 'architecture'>('feed');
  const [feedFilter, setFeedFilter] = useState<'foryou' | 'following' | 'latest' | 'trending'>('foryou');
  const [videos, setVideos] = useState<MemeVideo[]>(INITIAL_MEME_VIDEOS);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [commentsMap, setCommentsMap] = useState<Record<string, Comment[]>>(INITIAL_COMMENTS);
  const [userCoins, setUserCoins] = useState<number>(250);

  // Database health state
  const [dbHealth, setDbHealth] = useState<{
    status: 'ok' | 'error' | 'loading';
    database?: string;
    pool?: { total: number; idle: number; waiting: number };
    error?: string;
  }>({ status: 'loading' });

  // Modals state
  const [isCommentsOpen, setIsCommentsOpen] = useState<boolean>(false);
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);
  const [isGiftOpen, setIsGiftOpen] = useState<boolean>(false);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);

  // 1. Fetch real PostgreSQL health status via /api/health (SELECT 1 ping)
  const checkDbHealth = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setDbHealth({ status: 'ok', database: data.database, pool: data.pool });
      } else {
        const errData = await res.json().catch(() => ({}));
        setDbHealth({ status: 'error', error: errData.error || `HTTP ${res.status}` });
      }
    } catch (err: any) {
      setDbHealth({ status: 'error', error: err.message });
    }
  };

  // Cursor pagination state (no OFFSET)
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [isLoadingFeed, setIsLoadingFeed] = useState<boolean>(false);

  // 2. Fetch live video feed from PostgreSQL (Cursor pagination & Cloudflare Stream playback)
  const loadFeed = async (isAppend = false, cursorParam?: string) => {
    setIsLoadingFeed(true);
    try {
      // Use /api/for-you when in For You mode, otherwise /api/feed
      const endpoint = feedFilter === 'foryou' ? '/api/for-you' : '/api/feed';
      const url = new URL(endpoint, window.location.origin);
      if (feedFilter !== 'foryou') {
        url.searchParams.set('filter', feedFilter);
      }
      url.searchParams.set('limit', '10');
      if (cursorParam) {
        url.searchParams.set('cursor', cursorParam);
      }

      const res = await authFetch(url.pathname + url.search);
      if (res.ok) {
        const data = await res.json();
        const feedList = data.videos || [];
        const next = data.nextCursor || data.next_cursor || null;
        const more = Boolean(data.hasMore ?? data.has_more);
        setNextCursor(next);
        setHasMore(more);

        if (Array.isArray(feedList) && feedList.length > 0) {
          const mappedVideos: MemeVideo[] = feedList.map((dv: any, idx: number) => {
            const fallback = INITIAL_MEME_VIDEOS[idx % INITIAL_MEME_VIDEOS.length];
            const isVideo = Boolean(
              dv.videoUid && 
              !dv.videoUid.startsWith('vid_') && 
              !dv.videoUid.startsWith('meme_')
            );

            return {
              id: dv.id,
              title: dv.caption.slice(0, 30),
              caption: dv.caption,
              creator: {
                id: dv.creator?.id || 'u_' + idx,
                name: dv.creator?.username ? `@${dv.creator.username}` : fallback.creator.name,
                username: dv.creator?.username || fallback.creator.username,
                avatar: dv.creator?.avatarUrl || fallback.creator.avatar,
                bio: 'Creator on PostgreSQL',
                verified: true,
                followersCount: 15000 + idx * 5000,
              },
              videoUid: dv.videoUid,
              status: dv.status,
              mediaUrl: dv.thumbnailUrl || fallback.mediaUrl,
              mediaType: isVideo ? 'video' : 'image',
              duration: dv.durationSec || 15,
              likesCount: Number(dv.likes_count ?? dv.likesCount) || 0,
              commentsCount: Number(dv.comments_count ?? dv.commentsCount) || 0,
              sharesCount: fallback.sharesCount,
              savesCount: Number(dv.saves_count ?? dv.savesCount) || 0,
              laughsCount: fallback.laughsCount,
              viewsCount: Number(dv.views_count ?? dv.viewsCount) || 0,
              tags: fallback.tags,
              soundTrack: fallback.soundTrack,
              topOverlayText: fallback.topOverlayText,
              bottomOverlayText: fallback.bottomOverlayText,
              createdAt: dv.createdAt,
              isLiked: Boolean(dv.liked_by_me ?? dv.isLiked),
              isSaved: Boolean(dv.saved_by_me ?? dv.isSaved),
              isFollowed: false,
              signals: {
                ...fallback.signals,
                likes: Number(dv.likes_count ?? dv.likesCount) || 0,
                comments: Number(dv.comments_count ?? dv.commentsCount) || 0,
              },
              streamPlayback: dv.streamPlayback,
              moderationStatus: 'APPROVED',
            };
          });

          if (isAppend) {
            setVideos(prev => [...prev, ...mappedVideos]);
          } else {
            setVideos(mappedVideos);
            setCurrentIndex(0);
          }
        }
      }
    } catch (err) {
      console.warn('Could not load feed from PostgreSQL, using fallback:', err);
    } finally {
      setIsLoadingFeed(false);
    }
  };

  useEffect(() => {
    checkDbHealth();
    loadFeed(false);
    const interval = setInterval(checkDbHealth, 10000);
    return () => clearInterval(interval);
  }, [user, feedFilter]);

  const currentVideo = videos[currentIndex] || videos[0];

  // Record view in PostgreSQL with 1-minute window
  useEffect(() => {
    if (!currentVideo?.id) return;
    const timer = setTimeout(async () => {
      try {
        const res = await authFetch(`/api/videos/${currentVideo.id}/view`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ watch_ms: 15000 }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.recorded && (data.viewsCount || data.views_count)) {
            const count = Number(data.viewsCount || data.views_count);
            setVideos(prev =>
              prev.map(v => (v.id === currentVideo.id ? { ...v, viewsCount: count } : v))
            );
          }
        }
      } catch {
        // silently ignore background view signal
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [currentVideo?.id]);

  // 3. PostgreSQL Database Like transaction (Optimistic UI + Server source of truth)
  const handleLikeToggle = async (videoId: string) => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }

    const target = videos.find(v => v.id === videoId);
    const willLike = target ? !target.isLiked : true;

    // Optimistic UI update
    setVideos(prev =>
      prev.map(v => {
        if (v.id === videoId) {
          const newLikes = willLike ? v.likesCount + 1 : Math.max(0, v.likesCount - 1);
          return {
            ...v,
            isLiked: willLike,
            likesCount: newLikes,
            signals: {
              ...v.signals,
              likes: newLikes,
            },
          };
        }
        return v;
      })
    );

    try {
      // POST to like (idempotent ON CONFLICT DO NOTHING), DELETE to unlike
      const res = await authFetch(`/api/videos/${videoId}/like`, {
        method: willLike ? 'POST' : 'DELETE',
      });
      if (res.ok) {
        const data = await res.json();
        // Server source of truth synchronization
        setVideos(prev =>
          prev.map(v => {
            if (v.id === videoId) {
              const serverLiked = Boolean(data.liked ?? data.liked_by_me);
              const serverCount = Number(data.likesCount ?? data.likes_count);
              return {
                ...v,
                isLiked: serverLiked,
                likesCount: !isNaN(serverCount) ? serverCount : v.likesCount,
              };
            }
            return v;
          })
        );
      }
    } catch (err) {
      console.error('Failed to persist like in PostgreSQL:', err);
    }
  };

  // 4. PostgreSQL Database Save transaction (Optimistic UI + Server source of truth)
  const handleSaveToggle = async (videoId: string) => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }

    const target = videos.find(v => v.id === videoId);
    const willSave = target ? !target.isSaved : true;

    // Optimistic UI update
    setVideos(prev =>
      prev.map(v => {
        if (v.id === videoId) {
          const newSaves = willSave ? v.savesCount + 1 : Math.max(0, v.savesCount - 1);
          return {
            ...v,
            isSaved: willSave,
            savesCount: newSaves,
          };
        }
        return v;
      })
    );

    try {
      const res = await authFetch(`/api/videos/${videoId}/save`, {
        method: willSave ? 'POST' : 'DELETE',
      });
      if (res.ok) {
        const data = await res.json();
        setVideos(prev =>
          prev.map(v => {
            if (v.id === videoId) {
              const serverSaved = Boolean(data.saved ?? data.saved_by_me);
              const serverCount = Number(data.savesCount ?? data.saves_count);
              return {
                ...v,
                isSaved: serverSaved,
                savesCount: !isNaN(serverCount) ? serverCount : v.savesCount,
              };
            }
            return v;
          })
        );
      }
    } catch (err) {
      console.error('Failed to persist save in PostgreSQL:', err);
    }
  };

  const handleFollowToggle = (creatorId: string) => {
    setVideos(prev =>
      prev.map(v => {
        if (v.creator.id === creatorId) {
          return { ...v, isFollowed: !v.isFollowed };
        }
        return v;
      })
    );
    memeAudio.playBoing();
  };

  // 5. PostgreSQL Database Comment transaction
  const handleAddComment = async (text: string) => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }

    const newComment: Comment = {
      id: 'c_' + Date.now(),
      videoId: currentVideo.id,
      user: {
        name: user.username,
        username: user.username,
        avatar: user.avatarUrl || '/src/assets/images/swahili_comedian_avatar_1792057038016.jpg'
      },
      text,
      timestamp: language === 'sw' ? 'Sasa hivi' : 'Just now',
      likes: 0,
      isLiked: false
    };

    setCommentsMap(prev => ({
      ...prev,
      [currentVideo.id]: [newComment, ...(prev[currentVideo.id] || [])]
    }));

    setVideos(prev =>
      prev.map(v => {
        if (v.id === currentVideo.id) {
          return {
            ...v,
            commentsCount: v.commentsCount + 1,
            signals: {
              ...v.signals,
              comments: v.signals.comments + 1
            }
          };
        }
        return v;
      })
    );

    try {
      await authFetch(`/api/videos/${currentVideo.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
    } catch (err) {
      console.error('Failed to persist comment to PostgreSQL:', err);
    }
  };

  const handleLikeComment = (commentId: string) => {
    setCommentsMap(prev => {
      const currentList = prev[currentVideo.id] || [];
      const updated = currentList.map(c => {
        if (c.id === commentId) {
          const nextLiked = !c.isLiked;
          return {
            ...c,
            isLiked: nextLiked,
            likes: nextLiked ? c.likes + 1 : c.likes - 1
          };
        }
        return c;
      });
      return {
        ...prev,
        [currentVideo.id]: updated
      };
    });
    memeAudio.playBoing();
  };

  const handleSendGift = (gift: GiftItem) => {
    setUserCoins(prev => Math.max(0, prev - gift.coinPrice));
    setVideos(prev =>
      prev.map(v => {
        if (v.id === currentVideo.id) {
          return {
            ...v,
            signals: {
              ...v.signals,
              shares: v.signals.shares + 1
            }
          };
        }
        return v;
      })
    );
  };

  const handleAddFreeCoins = () => {
    setUserCoins(prev => prev + 50);
  };

  // 6. Handle Video Published via Cloudflare Stream pipeline
  const handlePublishReel = async (newReel: MemeVideo) => {
    setVideos(prev => [newReel, ...prev]);
    setCurrentIndex(0);
    setActiveTab('feed');
    // Refresh feed from database
    loadFeed(false);
  };

  const handleReport = (_reason: string, blockUser: boolean) => {
    if (blockUser) {
      setVideos(prev => prev.filter(v => v.creator.id !== currentVideo.creator.id));
      setCurrentIndex(0);
    }
  };

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'sw' ? 'en' : 'sw'));
    memeAudio.playBoing();
  };

  // Handle fast skip (< 2s): Ingest watch time and remove video from current For You feed
  const handleFastSkip = async (videoId: string, watchMs: number) => {
    try {
      await authFetch(`/api/videos/${videoId}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ watch_ms: Math.min(1900, watchMs) }),
      });
      // "Video niliyoskip haraka (2 sec) haionekani tena kwenye feed yangu"
      if (feedFilter === 'foryou') {
        setVideos(prev => prev.filter(v => v.id !== videoId));
      }
    } catch {
      // ignore
    }
  };

  const activeVideos = videos;

  return (
    <div className={`bg-neutral-950 text-neutral-100 flex flex-col justify-between selection:bg-amber-500/30 selection:text-amber-200 ${
      activeTab === 'feed' ? 'h-[100dvh] overflow-hidden' : 'min-h-screen'
    }`}>
      {/* TOP NAVIGATION BAR */}
      <header className={`${
        activeTab === 'feed'
          ? 'fixed top-0 left-0 right-0 z-40 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800/60'
          : 'sticky top-0 z-40 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800/80'
      } px-4 md:px-8 py-3 flex items-center justify-between gap-4 transition-colors`}>
        {/* Zone 1: Brand Wordmark */}
        <div 
          onClick={() => {
            setActiveTab('feed');
            memeAudio.playBoing();
          }}
          className="flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 group select-none"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-neutral-950 flex items-center justify-center font-black text-lg shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
            😂
          </div>
          <span className="text-lg font-extrabold tracking-tight text-white">
            Cheka<span className="text-amber-500">.</span>
          </span>
        </div>

        {/* Zone 2: Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-neutral-400">
          <button
            onClick={() => {
              setActiveTab('feed');
              memeAudio.playBoing();
            }}
            className={`whitespace-nowrap shrink-0 hover:text-white transition-colors flex items-center gap-1.5 ${
              activeTab === 'feed' ? 'text-amber-400 border-b-2 border-amber-500 pb-0.5' : ''
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>{language === 'sw' ? 'Vunja Mbavu (Feed)' : 'Reel Feed'}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('studio');
              memeAudio.playBoing();
            }}
            className={`whitespace-nowrap shrink-0 hover:text-white transition-colors flex items-center gap-1.5 ${
              activeTab === 'studio' ? 'text-amber-400 border-b-2 border-amber-500 pb-0.5' : ''
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{language === 'sw' ? 'Studio ya Meme' : 'Creator Studio'}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('algorithm');
              memeAudio.playBoing();
            }}
            className={`whitespace-nowrap shrink-0 hover:text-white transition-colors flex items-center gap-1.5 ${
              activeTab === 'algorithm' ? 'text-amber-400 border-b-2 border-amber-500 pb-0.5' : ''
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{language === 'sw' ? 'Algorithm ya For You' : 'Recommendation Engine'}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('architecture');
              memeAudio.playBoing();
            }}
            className={`whitespace-nowrap shrink-0 hover:text-white transition-colors flex items-center gap-1.5 ${
              activeTab === 'architecture' ? 'text-amber-400 border-b-2 border-amber-500 pb-0.5' : ''
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>{language === 'sw' ? 'Mfumo & Database' : 'Database & Architecture'}</span>
          </button>
        </nav>

        {/* Zone 3: Actions + Real Auth Status & Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Database Health Pill */}
          <div
            className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-mono ${
              dbHealth.status === 'ok'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
            title="PostgreSQL Cloud SQL Health"
          >
            {dbHealth.status === 'ok' ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Postgres: UP</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3 h-3 text-rose-400" />
                <span>Postgres: DOWN</span>
              </>
            )}
          </div>

          {/* User Auth Profile or Login Button */}
          {user ? (
            <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-xl px-2.5 py-1 text-xs">
              <img
                src={user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
                alt={user.username}
                className="w-5 h-5 rounded-full object-cover border border-amber-400/50"
              />
              <span className="font-semibold text-neutral-200 hidden sm:inline max-w-[100px] truncate">
                @{user.username}
              </span>
              <button
                onClick={() => {
                  logout();
                  memeAudio.playBoing();
                }}
                className="text-neutral-400 hover:text-rose-400 p-0.5 transition-colors"
                title={language === 'sw' ? 'Toka kwenye akaunti' : 'Log out'}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setIsAuthOpen(true);
                memeAudio.playBoing();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs text-neutral-200 hover:text-white transition-colors"
            >
              <LogIn className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'sw' ? 'Ingia' : 'Sign In'}</span>
            </button>
          )}

          {/* Coins Pill */}
          <button
            onClick={() => setIsGiftOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-amber-400 hover:bg-neutral-800 transition-colors"
            title="Sarafu zako za zawadi"
          >
            <Coins className="w-3.5 h-3.5" />
            <span className="font-mono tabular-nums font-bold">{userCoins}</span>
          </button>

          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 hover:text-white transition-colors"
            title="Badili lugha / Switch language"
          >
            <Globe className="w-3.5 h-3.5 text-neutral-400" />
            <span className="font-mono font-bold uppercase">{language}</span>
          </button>

          {/* Primary Action Button */}
          <button
            onClick={() => {
              if (!user) {
                setIsAuthOpen(true);
              } else {
                setActiveTab('studio');
              }
              memeAudio.playBoing();
            }}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-neutral-950 bg-amber-500 rounded-lg hover:bg-amber-400 transition-colors shadow-sm whitespace-nowrap shrink-0"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{language === 'sw' ? 'Chapisha Meme' : 'Create Reel'}</span>
          </button>
        </div>
      </header>

      {/* MAIN VIEWPORT */}
      <main className={`flex-1 w-full ${
        activeTab === 'feed'
          ? 'h-[100dvh] p-0 m-0 overflow-hidden flex items-center justify-center'
          : 'max-w-7xl mx-auto px-3 sm:px-6 py-4 flex flex-col justify-center'
      }`}>
        {activeTab === 'feed' && (
          <ReelPlayer
            videos={activeVideos.length > 0 ? activeVideos : videos}
            currentIndex={currentIndex}
            onNavigate={idx => setCurrentIndex(idx)}
            onLikeToggle={handleLikeToggle}
            onSaveToggle={handleSaveToggle}
            onFollowToggle={handleFollowToggle}
            onOpenComments={() => setIsCommentsOpen(true)}
            onOpenShare={() => setIsShareOpen(true)}
            onOpenGift={() => setIsGiftOpen(true)}
            onOpenReport={() => setIsReportOpen(true)}
            onOpenAlgorithm={() => setActiveTab('algorithm')}
            language={language}
            feedFilter={feedFilter}
            onFeedFilterChange={setFeedFilter}
            hasMore={hasMore}
            isLoadingMore={isLoadingFeed}
            onLoadMore={() => {
              if (nextCursor) {
                loadFeed(true, nextCursor);
              }
            }}
            onFastSkip={handleFastSkip}
          />
        )}

        {activeTab === 'studio' && (
          <CreatorStudio onPublish={handlePublishReel} language={language} />
        )}

        {activeTab === 'algorithm' && (
          <div className="max-w-4xl mx-auto w-full py-4 space-y-4">
            <RecommendationEngineExplorer currentVideo={currentVideo} language={language} />
          </div>
        )}

        {activeTab === 'architecture' && (
          <ArchitectureView language={language} />
        )}
      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-neutral-950/95 backdrop-blur-md border-t border-neutral-800 grid grid-cols-5 items-center h-14 pb-safe">
        <button
          onClick={() => {
            setActiveTab('feed');
            memeAudio.playBoing();
          }}
          className={`flex flex-col items-center justify-center h-full ${
            activeTab === 'feed' ? 'text-amber-400' : 'text-neutral-400'
          }`}
        >
          <Tv className="w-4 h-4" />
          <span className="text-[10px] font-medium mt-0.5">Feed</span>
        </button>

        <button
          onClick={() => {
            if (!user) {
              setIsAuthOpen(true);
            } else {
              setActiveTab('studio');
            }
            memeAudio.playBoing();
          }}
          className={`flex flex-col items-center justify-center h-full ${
            activeTab === 'studio' ? 'text-amber-400' : 'text-neutral-400'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span className="text-[10px] font-medium mt-0.5">Studio</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('algorithm');
            memeAudio.playBoing();
          }}
          className={`flex flex-col items-center justify-center h-full ${
            activeTab === 'algorithm' ? 'text-amber-400' : 'text-neutral-400'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-[10px] font-medium mt-0.5">For You</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('architecture');
            memeAudio.playBoing();
          }}
          className={`flex flex-col items-center justify-center h-full ${
            activeTab === 'architecture' ? 'text-amber-400' : 'text-neutral-400'
          }`}
        >
          <Server className="w-4 h-4" />
          <span className="text-[10px] font-medium mt-0.5">Stack</span>
        </button>

        <button
          onClick={() => {
            if (user) {
              logout();
            } else {
              setIsAuthOpen(true);
            }
            memeAudio.playBoing();
          }}
          className={`flex flex-col items-center justify-center h-full text-neutral-400 hover:text-white`}
        >
          <UserIcon className="w-4 h-4" />
          <span className="text-[10px] font-medium mt-0.5">
            {user ? 'Toka' : 'Akaunti'}
          </span>
        </button>
      </div>

      {/* MODALS */}
      <CommentsDrawer
        isOpen={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
        videoId={currentVideo.id}
        onRequireAuth={() => setIsAuthOpen(true)}
        onCommentCountChange={(vId, newCount) => {
          setVideos(prev =>
            prev.map(v => (v.id === vId ? { ...v, commentsCount: newCount } : v))
          );
        }}
        language={language}
      />

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        video={currentVideo}
        language={language}
      />

      <GiftModal
        isOpen={isGiftOpen}
        onClose={() => setIsGiftOpen(false)}
        video={currentVideo}
        gifts={GIFTS_CATALOG}
        userCoins={userCoins}
        onSendGift={handleSendGift}
        onAddFreeCoins={handleAddFreeCoins}
        language={language}
      />

      <SafetyReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        video={currentVideo}
        onReport={handleReport}
        language={language}
      />

      {/* Real Login / Signup Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        language={language}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
