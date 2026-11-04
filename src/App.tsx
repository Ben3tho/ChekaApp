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
  LogIn,
  Smartphone,
  Download,
  Settings as SettingsIcon,
  ArrowLeft,
  Search,
  MessageCircle,
  Megaphone,
  Crown,
  Bell
} from 'lucide-react';
import { MemeVideo, Language, Comment, GiftItem, Creator } from './types';
import { INITIAL_MEME_VIDEOS, INITIAL_COMMENTS, GIFTS_CATALOG } from './data/initialData';
import { ReelPlayer } from './components/ReelPlayer';
import { CreatorStudio } from './components/CreatorStudio';
import { RecommendationEngineExplorer } from './components/RecommendationEngineExplorer';
import { ArchitectureView } from './components/ArchitectureView';
import { SettingsView } from './components/SettingsView';
import { OwnerAdminDashboard } from './components/OwnerAdminDashboard';
import { CommentsDrawer } from './components/CommentsDrawer';
import { ShareModal } from './components/ShareModal';
import { GiftModal } from './components/GiftModal';
import { BuyCoinsModal } from './components/BuyCoinsModal';
import { DuetReactionModal } from './components/DuetReactionModal';
import { SafetyReportModal } from './components/SafetyReportModal';
import { AuthModal } from './components/AuthModal';
import { ApkDownloadModal } from './components/ApkDownloadModal';
import { DailyRewardsModal, getLocalStreakState } from './components/DailyRewardsModal';
import { CreatorProfileModal } from './components/CreatorProfileModal';
import { SearchExploreModal } from './components/SearchExploreModal';
import { DirectMessagesDrawer } from './components/DirectMessagesDrawer';
import { AdCampaignModal } from './components/AdCampaignModal';
import { CreatorWalletModal } from './components/CreatorWalletModal';
import { NotificationsDrawer, AppNotification } from './components/NotificationsDrawer';
import { AuthProvider, useAuth } from './context/AuthContext';
import { memeAudio } from './utils/audioSynth';
import { setupBackgroundReengagement } from './utils/notifications';

function AppContent() {
  const { user, logout, authFetch, isOwner } = useAuth();
  const [isOwnerDashboardOpen, setIsOwnerDashboardOpen] = useState<boolean>(false);
  const [language, setLanguage] = useState<Language>('sw');
  const [activeTab, setActiveTab] = useState<'feed' | 'studio' | 'algorithm' | 'settings' | 'architecture'>('feed');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [feedFilter, setFeedFilter] = useState<'foryou' | 'following' | 'latest' | 'trending'>('foryou');
  const [videos, setVideos] = useState<MemeVideo[]>(INITIAL_MEME_VIDEOS);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [commentsMap, setCommentsMap] = useState<Record<string, Comment[]>>(INITIAL_COMMENTS);
  const [userCoins, setUserCoins] = useState<number>(250);
  const [isDailyRewardsOpen, setIsDailyRewardsOpen] = useState<boolean>(false);
  const [streakDays, setStreakDays] = useState<number>(() => getLocalStreakState().currentStreak);
  const [todayWatchSec, setTodayWatchSec] = useState<number>(0);

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
  const [isBuyCoinsOpen, setIsBuyCoinsOpen] = useState<boolean>(false);
  const [isDuetOpen, setIsDuetOpen] = useState<boolean>(false);
  const [duetTargetVideo, setDuetTargetVideo] = useState<MemeVideo | null>(null);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState<boolean>(false);
  const [isCreatorProfileOpen, setIsCreatorProfileOpen] = useState<boolean>(false);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isDirectMessagesOpen, setIsDirectMessagesOpen] = useState<boolean>(false);
  const [directChatTarget, setDirectChatTarget] = useState<Creator | null>(null);
  const [isAdCampaignOpen, setIsAdCampaignOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('cheka_notifications');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter((n: any) => !n.is_read).length;
        }
      }
    } catch (_) {}
    return 3;
  });

  const sendInAppNotification = (notif: {
    type: 'like' | 'comment' | 'gift' | 'video' | 'system' | 'payout' | 'follow';
    title: string;
    body: string;
  }) => {
    const newNotif: AppNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...notif,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    try {
      const stored = localStorage.getItem('cheka_notifications');
      const list = stored ? JSON.parse(stored) : [];
      const updated = [newNotif, ...(Array.isArray(list) ? list : [])];
      localStorage.setItem('cheka_notifications', JSON.stringify(updated));
    } catch (_) {}
    setUnreadNotificationsCount(prev => prev + 1);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cheka_new_notification', { detail: newNotif }));
    }
  };

  // Listen for real-time notifications to sync unread badge
  useEffect(() => {
    const handleNewNotif = () => {
      setUnreadNotificationsCount(prev => prev + 1);
    };
    window.addEventListener('cheka_new_notification', handleNewNotif);
    return () => window.removeEventListener('cheka_new_notification', handleNewNotif);
  }, []);

  // Simulate an incoming follower alert after user browses for 7 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      sendInAppNotification({
        type: 'follow',
        title: language === 'sw' ? '👤 Shabiki Mpya (Follower)!' : '👤 New Follower!',
        body: language === 'sw'
          ? '@daudi_tz amekufuata sasa hivi! Ameanza kutazama vichekesho vyako.'
          : '@daudi_tz started following you just now!',
      });
    }, 7000);
    return () => clearTimeout(timer);
  }, [language]);

  const handleOpenCreatorProfile = (creator: Creator) => {
    setSelectedCreator(creator);
    setIsCreatorProfileOpen(true);
    memeAudio.playPop();
  };

  const handleSelectVideoFromModal = (videoId: string) => {
    const idx = videos.findIndex(v => v.id === videoId);
    if (idx !== -1) {
      setCurrentIndex(idx);
    }
    setActiveTab('feed');
  };

  // Initialize Web Push Background Re-engagement
  useEffect(() => {
    setupBackgroundReengagement();
  }, []);

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

  // Daily Laugh-O-Meter Watch Time Tracker
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === 'feed' && document.visibilityState === 'visible') {
        setTodayWatchSec(prev => prev + 1);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTab]);

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
            setVideos(prev => {
              const seen = new Set(prev.map(v => v.id));
              const newUnique = mappedVideos.filter(v => !seen.has(v.id));
              return [...prev, ...newUnique];
            });
          } else {
            const seen = new Set<string>();
            const deduplicated = mappedVideos.filter(v => {
              if (seen.has(v.id)) return false;
              seen.add(v.id);
              return true;
            });
            setVideos(deduplicated);
            setCurrentIndex(prev => (prev < deduplicated.length ? prev : 0));
          }
        } else if (!isAppend) {
          // If live feed returns empty, preserve default meme videos
          setVideos(prev => (prev && prev.length > 0 ? prev : INITIAL_MEME_VIDEOS));
        }
      }
    } catch (err) {
      console.warn('Could not load feed from PostgreSQL, using fallback:', err);
      if (!isAppend) {
        setVideos(prev => (prev && prev.length > 0 ? prev : INITIAL_MEME_VIDEOS));
      }
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

  // Guaranteed fallback video so currentVideo is never undefined
  const currentVideo: MemeVideo = 
    (videos && videos.length > 0 && videos[currentIndex]) || 
    (videos && videos[0]) || 
    INITIAL_MEME_VIDEOS[0];

  // Prevent currentIndex out of bounds when list is filtered or skipped
  useEffect(() => {
    if (videos && videos.length > 0) {
      if (currentIndex >= videos.length) {
        setCurrentIndex(Math.max(0, videos.length - 1));
      }
    } else {
      setVideos(INITIAL_MEME_VIDEOS);
      setCurrentIndex(0);
    }
  }, [videos?.length, currentIndex]);

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

    if (willLike && target) {
      sendInAppNotification({
        type: 'like',
        title: language === 'sw' ? '❤️ Like Mpya!' : '❤️ New Like!',
        body: language === 'sw'
          ? `Umependa video ya @${target.creator?.username || 'mchekeshaji'}: "${target.caption?.slice(0, 45) || 'Meme'}"`
          : `You liked @${target.creator?.username || 'creator'}'s video!`,
      });
    }

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
    const creator = videos.find(v => v.creator.id === creatorId)?.creator;
    const isNowFollowed = !videos.find(v => v.creator.id === creatorId)?.isFollowed;

    setVideos(prev =>
      prev.map(v => {
        if (v.creator.id === creatorId) {
          return { ...v, isFollowed: !v.isFollowed };
        }
        return v;
      })
    );

    if (isNowFollowed) {
      memeAudio.playReward();
      sendInAppNotification({
        type: 'follow',
        title: language === 'sw' ? '👤 Shabiki Mpya (Follower)!' : '👤 New Follower!',
        body: language === 'sw'
          ? `Umefuata @${creator?.username || 'mchekeshaji'}! Sasa utapata taarifa za video zao zote mpya.`
          : `You followed @${creator?.username || 'creator'}!`,
      });
    } else {
      memeAudio.playBoing();
    }
  };

  // 5. PostgreSQL Database Comment transaction
  const handleAddComment = async (text: string) => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }

    sendInAppNotification({
      type: 'comment',
      title: language === 'sw' ? '💬 Maoni Mapya!' : '💬 New Comment!',
      body: language === 'sw'
        ? `Umetoa maoni kwenye video ya @${currentVideo.creator?.username || 'mchekeshaji'}: "${text.slice(0, 45)}..."`
        : `Comment posted on @${currentVideo.creator?.username || 'creator'}'s video.`,
    });
    if (!currentVideo?.id) return;

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
    if (!currentVideo?.id) return;
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
    sendInAppNotification({
      type: 'gift',
      title: language === 'sw' ? '🎁 Zawadi Imetumwa!' : '🎁 Gift Sent!',
      body: language === 'sw'
        ? `Umemzawadia @${currentVideo.creator?.username || 'mchekeshaji'} zawadi ya ${gift.nameSw} (${gift.coinPrice} Coins)!`
        : `You sent ${gift.nameEn} to @${currentVideo.creator?.username || 'creator'}!`,
    });
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
    sendInAppNotification({
      type: 'video',
      title: language === 'sw' ? '🎬 Video Imepakiwa Kikamilifu!' : '🎬 Video Uploaded!',
      body: language === 'sw'
        ? `Video yako "${newReel.title}" ipo hewani sasa hivi na mashabiki wanaanza kuitazama!`
        : `Your video "${newReel.title}" is now live for viewers!`,
    });
  };

  // 6b. Handle Duet Reaction Published
  const handlePublishDuet = async (duetPayload: Partial<MemeVideo>) => {
    const newDuet: MemeVideo = {
      id: 'duet_' + Date.now(),
      title: duetPayload.title || `Duet na @${currentVideo.creator.username}`,
      caption: duetPayload.caption || `Duet na @${currentVideo.creator.username}`,
      creator: user ? {
        id: user.id,
        name: user.username,
        username: user.username,
        avatar: user.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + user.username,
        bio: 'ChekaApp Creator',
        verified: false,
        followersCount: 1,
      } : {
        id: 'creator_guest',
        name: 'Mchekeshaji',
        username: 'cheka_star',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Duet',
        bio: 'ChekaApp Star',
        verified: false,
        followersCount: 12,
      },
      mediaUrl: duetPayload.mediaUrl || currentVideo.mediaUrl,
      mediaType: duetPayload.mediaType || currentVideo.mediaType,
      duration: duetPayload.duration || currentVideo.duration || 15,
      likesCount: 1,
      commentsCount: 0,
      sharesCount: 0,
      savesCount: 0,
      viewsCount: 1,
      laughsCount: 1,
      soundTrack: currentVideo.soundTrack,
      moderationStatus: 'APPROVED',
      tags: duetPayload.tags || ['#Duet', '#Reaction'],
      topOverlayText: duetPayload.topOverlayText,
      bottomOverlayText: duetPayload.bottomOverlayText,
      createdAt: new Date().toISOString(),
      isLiked: true,
      signals: {
        watchRatio: 1.0,
        watchMs: 15000,
        likes: 1,
        shares: 0,
        comments: 0,
        skips: 0,
        ageHours: 0,
      },
    };

    setVideos(prev => [newDuet, ...prev]);
    setCurrentIndex(0);
    setActiveTab('feed');
    sendInAppNotification({
      type: 'video',
      title: language === 'sw' ? '🎭 Duet Imechapishwa!' : '🎭 Duet Published!',
      body: language === 'sw'
        ? `Duet yako na @${currentVideo.creator?.username || 'mchekeshaji'} iko hewani!`
        : `Your duet with @${currentVideo.creator?.username || 'creator'} is now published!`,
    });
  };

  const handleReport = async (reason: string, blockUser: boolean) => {
    try {
      await authFetch(`/api/videos/${currentVideo.id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, blockUser }),
      });
      if (blockUser && currentVideo.creator?.id) {
        await authFetch(`/api/users/${currentVideo.creator.id}/block`, {
          method: 'POST',
        });
      }
    } catch (err) {
      console.warn('Report submission notice:', err);
    }

    if (blockUser) {
      setVideos(prev => prev.filter(v => v.creator.id !== currentVideo.creator.id));
      setCurrentIndex(0);
    }
  };

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'sw' ? 'en' : 'sw'));
    memeAudio.playBoing();
  };

  const handleToggleSound = () => {
    setSoundEnabled(prev => {
      const next = !prev;
      memeAudio.setMuted(!next);
      if (next) memeAudio.playBoing();
      return next;
    });
  };

  const [phoneFrameMode, setPhoneFrameMode] = useState<boolean>(true);

  // Handle watch time recorded: Send telemetry to AI recommendation engine and update state
  const handleWatchTimeRecorded = async (videoId: string, watchMs: number, loops: number, isFastSkip: boolean) => {
    try {
      // 1. Dispatch beacon to backend watch-time endpoint
      await authFetch(`/api/videos/${videoId}/watch-time`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          watch_ms: Math.round(watchMs),
          loops,
          fast_skip: isFastSkip,
        }),
      });

      // 2. Update local state in place WITHOUT filtering or reordering the active queue
      // (Mutating or reordering the array while the user is scrolling causes reels to jump/change unexpectedly!)
      setVideos(prev =>
        prev.map(v => {
          if (v.id === videoId) {
            const vDuration = Math.max(1, v.duration || 15);
            const curViews = (v.viewsCount || 0) + 1;
            const newTotalWatchMs = (v.signals?.totalWatchMs || 0) + watchMs;
            const newRatio = Number((newTotalWatchMs / (curViews * vDuration * 1000)).toFixed(2));
            return {
              ...v,
              viewsCount: curViews,
              signals: {
                ...v.signals,
                views: curViews,
                skips: isFastSkip ? (v.signals?.skips || 0) + 1 : (v.signals?.skips || 0),
                watchRatio: Math.max(v.signals?.watchRatio || 0.5, newRatio),
              },
            };
          }
          return v;
        })
      );
    } catch (err) {
      console.warn('Watch time beacon error:', err);
    }
  };

  // Backward compatible fast skip
  const handleFastSkip = async (videoId: string, watchMs: number) => {
    handleWatchTimeRecorded(videoId, watchMs, 0, true);
  };

  const activeVideos = videos;

  return (
    <div className={`bg-neutral-950 text-neutral-100 flex flex-col justify-between selection:bg-amber-500/30 selection:text-amber-200 ${
      activeTab === 'feed' ? 'h-[100dvh] overflow-hidden' : 'min-h-screen'
    }`}>
      {/* TOP NAVIGATION BAR: Hidden on mobile feed for full immersion; compact on other tabs */}
      <header className={`${
        activeTab === 'feed'
          ? 'hidden md:flex fixed top-0 left-0 right-0 z-40 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800/60'
          : 'sticky top-0 z-40 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800/80 flex'
      } px-3 sm:px-6 md:px-8 py-2.5 items-center justify-between gap-2 sm:gap-4 transition-colors w-full max-w-full overflow-hidden`}>
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

        {/* Zone 2: Desktop Nav Links (Hidden on mobile) */}
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
              setActiveTab('settings');
              memeAudio.playBoing();
            }}
            className={`whitespace-nowrap shrink-0 hover:text-white transition-colors flex items-center gap-1.5 ${
              activeTab === 'settings' || activeTab === 'architecture' ? 'text-amber-400 border-b-2 border-amber-500 pb-0.5' : ''
            }`}
          >
            <SettingsIcon className="w-3.5 h-3.5" />
            <span>{language === 'sw' ? 'Mipangilio' : 'Settings'}</span>
          </button>
        </nav>

        {/* Zone 3: Actions + Real Auth Status & Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Database Health Pill (Desktop only) */}
          <button
            onClick={() => {
              setActiveTab('architecture');
              memeAudio.playBoing();
            }}
            className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-mono cursor-pointer transition-colors ${
              dbHealth.status === 'ok'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
            }`}
            title="PostgreSQL Cloud SQL Health (Click to inspect)"
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
          </button>

          {/* User Auth Profile or Login Button */}
          {user ? (
            <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 rounded-xl px-2 py-1 text-xs">
              <button
                onClick={() => {
                  setActiveTab('settings');
                  memeAudio.playBoing();
                }}
                className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                title={language === 'sw' ? 'Fungua Mipangilio & Wasifu' : 'Open Settings & Profile'}
              >
                <img
                  src={user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
                  alt={user.username}
                  className="w-5 h-5 rounded-full object-cover border border-amber-400/50"
                />
                <span className="font-semibold text-neutral-200 hidden sm:inline max-w-[90px] truncate">
                  @{user.username}
                </span>
              </button>
              <button
                onClick={() => {
                  logout();
                  memeAudio.playBoing();
                }}
                className="text-neutral-400 hover:text-rose-400 p-0.5 transition-colors"
                title={language === 'sw' ? 'Toka kwenye akaunti' : 'Log out'}
              >
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setIsAuthOpen(true);
                memeAudio.playBoing();
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs text-neutral-200 hover:text-white transition-colors"
            >
              <LogIn className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'sw' ? 'Ingia' : 'Sign In'}</span>
            </button>
          )}

          {/* Daily Streak Flame Button */}
          <button
            onClick={() => {
              setIsDailyRewardsOpen(true);
              memeAudio.playBoing();
            }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-500/15 border border-orange-500/35 text-xs text-orange-400 hover:bg-orange-500/25 transition-all shadow-xs"
            title={language === 'sw' ? 'Mwendelezo wa Siku & Zawadi za Bure' : 'Daily Streak & Free Rewards'}
          >
            <Flame className="w-3.5 h-3.5 fill-current text-orange-400 animate-pulse" />
            <span className="font-mono tabular-nums font-bold text-[11px] sm:text-xs">{streakDays}d</span>
          </button>

          {/* Coins Pill */}
          <button
            onClick={() => {
              setIsBuyCoinsOpen(true);
              memeAudio.playBoing();
            }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-amber-400 hover:bg-neutral-800 transition-colors"
            title={language === 'sw' ? 'Sarafu zako za zawadi (Bofya kuongeza kwa M-Pesa)' : 'Your coins (Click to buy via Mobile Money)'}
          >
            <Coins className="w-3.5 h-3.5" />
            <span className="font-mono tabular-nums font-bold text-[11px] sm:text-xs">{userCoins}</span>
          </button>

          {/* Direct Messages (DM) Button */}
          <button
            onClick={() => {
              setDirectChatTarget(null);
              setIsDirectMessagesOpen(true);
              memeAudio.playPop();
            }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-sky-500/15 border border-sky-500/35 text-xs text-sky-400 hover:bg-sky-500/25 transition-all shadow-xs relative"
            title={language === 'sw' ? 'Jumbe za Moja kwa Moja (Direct Messages)' : 'Direct Messages'}
          >
            <MessageCircle className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline font-semibold text-[11px]">DM</span>
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
          </button>

          {/* Owner Dashboard Crown Button (OWNER ONLY) */}
          {isOwner && (
            <button
              onClick={() => {
                setIsOwnerDashboardOpen(true);
                memeAudio.playPop();
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/25 to-yellow-500/25 border border-amber-500/50 text-xs font-bold text-amber-300 hover:from-amber-500/35 hover:to-yellow-500/35 transition-all shadow-xs"
              title="Fungua Dashibodi Kuu ya Mmiliki"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400 fill-current" />
              <span className="hidden sm:inline">Mmiliki</span>
            </button>
          )}

          {/* Phone Frame Toggle for Desktop / Tablet Viewport */}
          <button
            onClick={() => {
              setPhoneFrameMode(prev => !prev);
              memeAudio.playBoing();
            }}
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              phoneFrameMode
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-sm'
                : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
            }`}
            title={phoneFrameMode ? 'Bonyeza kubadilisha kwenda Skrini Nzima (Wide)' : 'Bonyeza kuona Size ya Simu (Phone Frame)'}
          >
            <Smartphone className="w-3.5 h-3.5 text-amber-400" />
            <span>{phoneFrameMode ? (language === 'sw' ? 'Size ya Simu' : 'Phone Size') : (language === 'sw' ? 'Skrini Nzima' : 'Full Screen')}</span>
          </button>

          {/* Quick Search trigger button in header */}
          <button
            onClick={() => {
              setIsSearchOpen(true);
              memeAudio.playPop();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-neutral-300 hover:text-white transition-colors"
            title={language === 'sw' ? 'Tafuta vichekesho na wachekeshaji (#Hashtags)' : 'Search reels & creators'}
          >
            <Search className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">{language === 'sw' ? 'Tafuta' : 'Search'}</span>
          </button>

          {/* Creator Wallet Button */}
          <button
            onClick={() => {
              setIsWalletOpen(true);
              memeAudio.playPop();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-amber-300 hover:text-white transition-colors"
            title={language === 'sw' ? 'Pochi & Mapato (Wallet & Earnings)' : 'Wallet & Earnings'}
          >
            <Coins className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="font-mono font-bold">{userCoins}</span>
          </button>

          {/* Activity & Notifications Button */}
          <button
            onClick={() => {
              setIsNotificationsOpen(true);
              memeAudio.playPop();
            }}
            className="relative p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-colors"
            title={language === 'sw' ? 'Taarifa Zako (Notifications)' : 'Notifications'}
          >
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          </button>

          {/* Setting Button in Top Header */}
          <button
            onClick={() => {
              setActiveTab(prev => prev === 'settings' ? 'feed' : 'settings');
              memeAudio.playPop();
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
              activeTab === 'settings'
                ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-300 hover:text-white'
            }`}
            title={language === 'sw' ? 'Mipangilio ya App (Settings)' : 'Settings'}
          >
            <SettingsIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{language === 'sw' ? 'Setting' : 'Settings'}</span>
          </button>

          {/* Language Switcher - hidden on small mobile (accessible in Settings) */}
          <button
            onClick={toggleLanguage}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 hover:text-white transition-colors"
            title="Badili lugha / Switch language"
          >
            <Globe className="w-3.5 h-3.5 text-neutral-400" />
            <span className="font-mono font-bold uppercase">{language}</span>
          </button>

          {/* Primary Action Button (Desktop only) */}
          <button
            onClick={() => {
              if (!user) {
                setIsAuthOpen(true);
              } else {
                setActiveTab('studio');
              }
              memeAudio.playBoing();
            }}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-neutral-950 bg-amber-500 rounded-lg hover:bg-amber-400 transition-colors shadow-sm whitespace-nowrap shrink-0"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{language === 'sw' ? 'Chapisha Meme' : 'Create Reel'}</span>
          </button>
        </div>
      </header>

      {/* MAIN VIEWPORT */}
      <main className={`flex-1 w-full max-w-full flex ${
        activeTab === 'feed'
          ? 'h-[100dvh] p-0 m-0 overflow-hidden items-center justify-center'
          : 'px-3 sm:px-6 py-4 pb-32 flex-col items-center justify-start overflow-y-auto touch-pan-y overscroll-y-contain'
      }`}>
        <div className={`w-full transition-all duration-300 flex flex-col items-center justify-start ${
          activeTab === 'feed'
            ? phoneFrameMode
              ? 'md:max-w-[430px] md:h-[90vh] md:max-h-[890px] md:rounded-[40px] md:border-[8px] md:border-neutral-800 md:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] md:overflow-hidden relative bg-black items-center justify-center'
              : 'w-full h-full'
            : phoneFrameMode
              ? 'md:max-w-[560px] mx-auto w-full'
              : 'max-w-4xl mx-auto w-full'
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
              onOpenDuet={() => {
                setDuetTargetVideo(currentVideo);
                setIsDuetOpen(true);
                memeAudio.playBoing();
              }}
              onOpenReport={() => setIsReportOpen(true)}
              onOpenAlgorithm={() => setActiveTab('algorithm')}
              onOpenSettings={() => setActiveTab('settings')}
              onOpenCreatorProfile={handleOpenCreatorProfile}
              onOpenDirectChat={(c) => {
                setDirectChatTarget(c);
                setIsDirectMessagesOpen(true);
              }}
              onOpenAdCampaign={() => setIsAdCampaignOpen(true)}
              onOpenSearch={() => setIsSearchOpen(true)}
              onRefresh={() => loadFeed(false)}
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
              onWatchTimeRecorded={handleWatchTimeRecorded}
              isOwner={isOwner}
            />
          )}

          {activeTab === 'studio' && (
            <div className="w-full touch-pan-y">
              <CreatorStudio
                onPublish={handlePublishReel}
                language={language}
                onOpenAuth={() => setIsAuthOpen(true)}
              />
            </div>
          )}

          {activeTab === 'algorithm' && (
            <div className="w-full py-4 pb-28 space-y-4 touch-pan-y">
              <RecommendationEngineExplorer currentVideo={currentVideo} language={language} />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="w-full touch-pan-y">
              <SettingsView
                language={language}
                onLanguageChange={setLanguage}
                onOpenAuth={() => setIsAuthOpen(true)}
                onOpenArchitecture={() => {
                  setActiveTab('architecture');
                  memeAudio.playBoing();
                }}
                onOpenBuyCoins={() => setIsBuyCoinsOpen(true)}
                onOpenAdCampaign={() => setIsAdCampaignOpen(true)}
                onOpenAlgorithm={() => {
                  setActiveTab('algorithm');
                  memeAudio.playBoing();
                }}
                onOpenOwnerDashboard={() => setIsOwnerDashboardOpen(true)}
                soundEnabled={soundEnabled}
                onToggleSound={handleToggleSound}
                dbHealth={dbHealth}
              />
            </div>
          )}

          {activeTab === 'architecture' && (
            <div className="w-full py-4 pb-28 space-y-4">
              <button
                onClick={() => {
                  setActiveTab('settings');
                  memeAudio.playBoing();
                }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-semibold text-neutral-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
                <span>{language === 'sw' ? '← Rudi kwenye Mipangilio (Settings)' : '← Back to Settings'}</span>
              </button>
              <ArchitectureView language={language} />
            </div>
          )}
        </div>
      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR: 4 DISTINCT TABS (Feed, Studio, Taarifa, DM) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-neutral-950/95 backdrop-blur-md border-t border-neutral-800 grid grid-cols-4 items-center h-14 pb-safe">
        {/* Tab 1: Feed */}
        <button
          onClick={() => {
            setActiveTab('feed');
            memeAudio.playBoing();
          }}
          className={`flex flex-col items-center justify-center h-full transition-colors ${
            activeTab === 'feed' ? 'text-amber-400 font-bold' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Tv className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-0.5">Feed</span>
        </button>

        {/* Tab 2: Studio */}
        <button
          onClick={() => {
            if (!user) {
              setIsAuthOpen(true);
            } else {
              setActiveTab('studio');
            }
            memeAudio.playBoing();
          }}
          className={`flex flex-col items-center justify-center h-full transition-colors ${
            activeTab === 'studio' ? 'text-amber-400 font-bold' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <PlusCircle className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-0.5">Studio</span>
        </button>

        {/* Tab 3: Taarifa (All Notifications: Follows, Likes, Comments, Gifts) */}
        <button
          onClick={() => {
            setIsNotificationsOpen(true);
            memeAudio.playPop();
          }}
          className="flex flex-col items-center justify-center h-full text-neutral-400 hover:text-amber-400 transition-colors relative"
          title={language === 'sw' ? 'Taarifa Zote (Followers, Likes, Maoni)' : 'All Notifications'}
        >
          <div className="relative">
            <Bell className="w-5 h-5" />
            {unreadNotificationsCount > 0 ? (
              <span className="absolute -top-1.5 -right-2 px-1.5 py-0.5 bg-rose-500 text-[9px] font-black text-white rounded-full min-w-4 text-center leading-none shadow-md animate-pulse">
                {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
              </span>
            ) : (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400" />
            )}
          </div>
          <span className="text-[10px] font-semibold mt-0.5">
            {language === 'sw' ? 'Taarifa' : 'Alerts'}
          </span>
        </button>

        {/* Tab 4: DM (Direct Messages) */}
        <button
          onClick={() => {
            setDirectChatTarget(null);
            setIsDirectMessagesOpen(true);
            memeAudio.playPop();
          }}
          className="flex flex-col items-center justify-center h-full text-neutral-400 hover:text-sky-400 transition-colors relative"
          title="Direct Messages"
        >
          <div className="relative">
            <MessageCircle className="w-5 h-5" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
          </div>
          <span className="text-[10px] font-semibold mt-0.5">DM</span>
        </button>
      </div>

      {/* MODALS */}
      <CommentsDrawer
        isOpen={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
        videoId={currentVideo?.id || INITIAL_MEME_VIDEOS[0].id}
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
        video={currentVideo || INITIAL_MEME_VIDEOS[0]}
        language={language}
      />

      <GiftModal
        isOpen={isGiftOpen}
        onClose={() => setIsGiftOpen(false)}
        video={currentVideo || INITIAL_MEME_VIDEOS[0]}
        gifts={GIFTS_CATALOG}
        userCoins={userCoins}
        onSendGift={handleSendGift}
        onAddFreeCoins={handleAddFreeCoins}
        onOpenBuyCoins={() => setIsBuyCoinsOpen(true)}
        language={language}
      />

      {/* Tanzanian Mobile Money Checkout (M-Pesa, Tigo Pesa, Airtel Money, HaloPesa) */}
      <BuyCoinsModal
        isOpen={isBuyCoinsOpen}
        onClose={() => setIsBuyCoinsOpen(false)}
        userCoins={userCoins}
        onSuccess={(addedCoins) => {
          setUserCoins(prev => prev + addedCoins);
        }}
        language={language}
      />

      {/* Duet & Video Reaction Studio Modal */}
      {duetTargetVideo && (
        <DuetReactionModal
          isOpen={isDuetOpen}
          onClose={() => {
            setIsDuetOpen(false);
            setDuetTargetVideo(null);
          }}
          targetVideo={duetTargetVideo}
          onPublishReaction={handlePublishDuet}
          language={language}
        />
      )}

      <DailyRewardsModal
        isOpen={isDailyRewardsOpen}
        onClose={() => {
          setIsDailyRewardsOpen(false);
          setStreakDays(getLocalStreakState().currentStreak);
        }}
        userCoins={userCoins}
        onAddCoins={(amount) => {
          setUserCoins(prev => prev + amount);
        }}
        language={language}
        todayWatchSec={todayWatchSec}
      />

      <SafetyReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        video={currentVideo || INITIAL_MEME_VIDEOS[0]}
        onReport={handleReport}
        language={language}
      />

      {/* Real Login / Signup Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        language={language}
      />

      {/* Creator Profile & Video Grid Modal */}
      <CreatorProfileModal
        isOpen={isCreatorProfileOpen}
        onClose={() => {
          setIsCreatorProfileOpen(false);
          setSelectedCreator(null);
        }}
        creator={selectedCreator}
        allVideos={videos}
        onSelectVideo={handleSelectVideoFromModal}
        onFollowToggle={handleFollowToggle}
        onOpenGift={() => setIsGiftOpen(true)}
        onOpenDirectChat={(c) => {
          setIsCreatorProfileOpen(false);
          setDirectChatTarget(c);
          setIsDirectMessagesOpen(true);
        }}
        language={language}
      />

      {/* Direct 1-on-1 Messages & Chat Drawer */}
      <DirectMessagesDrawer
        isOpen={isDirectMessagesOpen}
        onClose={() => {
          setIsDirectMessagesOpen(false);
          setDirectChatTarget(null);
        }}
        targetCreator={directChatTarget}
        language={language}
        onOpenGift={() => setIsGiftOpen(true)}
        userCoins={userCoins}
      />

      {/* Ad Campaign & Promotion Manager Modal */}
      <AdCampaignModal
        isOpen={isAdCampaignOpen}
        onClose={() => setIsAdCampaignOpen(false)}
        language={language}
        onOpenBuyCoins={() => setIsBuyCoinsOpen(true)}
      />

      {/* Search & Trending Hashtags Modal */}
      <SearchExploreModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        videos={videos}
        onSelectVideo={handleSelectVideoFromModal}
        onSelectCreator={(c) => {
          setSelectedCreator(c);
          setIsCreatorProfileOpen(true);
        }}
        language={language}
      />

      {/* APK & PWA Download Modal */}
      <ApkDownloadModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
        language={language}
      />

      {/* Creator Wallet & Double-Entry Ledger Modal */}
      <CreatorWalletModal
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
        language={language}
        onOpenBuyCoins={() => {
          setIsWalletOpen(false);
          setIsBuyCoinsOpen(true);
        }}
      />

      {/* In-App Notifications Drawer */}
      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        language={language}
        onNotificationRead={() => {
          setUnreadNotificationsCount(0);
        }}
      />

      {/* Platform Owner / Super Admin Dashboard */}
      {isOwnerDashboardOpen && (
        <OwnerAdminDashboard
          videos={videos}
          onDeleteVideo={(vid) => {
            setVideos(prev => prev.filter(v => v.id !== vid));
            memeAudio.playBoing();
          }}
          onVerifyCreator={(cid) => {
            setVideos(prev => prev.map(v => v.creator.id === cid ? { ...v, creator: { ...v.creator, verified: true } } : v));
            memeAudio.playReward();
          }}
          onClose={() => setIsOwnerDashboardOpen(false)}
          language={language}
          dbHealth={dbHealth}
          onOpenArchitecture={() => {
            setIsOwnerDashboardOpen(false);
            setActiveTab('architecture');
            memeAudio.playBoing();
          }}
          onOpenAlgorithm={() => {
            setIsOwnerDashboardOpen(false);
            setActiveTab('algorithm');
            memeAudio.playBoing();
          }}
        />
      )}
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
