import React, { useState, useEffect } from 'react';
import { 
  X, 
  Bell, 
  Heart, 
  MessageCircle, 
  Gift, 
  Video, 
  CheckCheck, 
  Sparkles, 
  DollarSign,
  AlertCircle,
  UserPlus,
  Flame,
  Check
} from 'lucide-react';
import { Language } from '../types';
import { useAuth } from '../context/AuthContext';
import { memeAudio } from '../utils/audioSynth';

export interface AppNotification {
  id: string;
  type: 'like' | 'comment' | 'gift' | 'video' | 'system' | 'payout' | 'follow';
  title: string;
  body: string;
  metadata_json?: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  language?: Language;
  onNotificationRead?: () => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  language = 'sw',
  onNotificationRead,
}) => {
  const { user, authFetch } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'follow' | 'engagement' | 'gift'>('all');
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize and load saved notifications from localStorage or defaults
  const loadStoredNotifications = (): AppNotification[] => {
    try {
      const stored = localStorage.getItem('cheka_notifications');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (_) {}
    return [];
  };

  const fetchNotifications = async () => {
    let localItems = loadStoredNotifications();

    if (user) {
      try {
        const res = await authFetch('/api/notifications');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.notifications) && data.notifications.length > 0) {
            // Merge with localItems
            const ids = new Set(data.notifications.map((n: AppNotification) => n.id));
            localItems = [...data.notifications, ...localItems.filter(l => !ids.has(l.id))];
          }
        }
      } catch (err) {
        console.warn('Error loading remote notifications:', err);
      }
    }

    setNotifications(localItems);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Listen to new real-time notifications dispatched throughout the app
  useEffect(() => {
    const handleNewNotif = (e: any) => {
      const detail = e.detail as AppNotification;
      if (!detail) return;
      setNotifications(prev => {
        const updated = [detail, ...prev];
        try {
          localStorage.setItem('cheka_notifications', JSON.stringify(updated));
        } catch (_) {}
        return updated;
      });
    };

    window.addEventListener('cheka_new_notification', handleNewNotif);
    return () => {
      window.removeEventListener('cheka_new_notification', handleNewNotif);
    };
  }, []);

  if (!isOpen) return null;

  const handleMarkAllRead = async () => {
    try {
      if (user) {
        await authFetch('/api/notifications/mark-read', { method: 'POST' });
      }
    } catch (_) {}

    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, is_read: true }));
      try {
        localStorage.setItem('cheka_notifications', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });

    onNotificationRead?.();
    memeAudio.playPop();
  };

  const handleItemClick = (notifId: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === notifId ? { ...n, is_read: true } : n);
      try {
        localStorage.setItem('cheka_notifications', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
    onNotificationRead?.();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'follow':
        return <UserPlus className="w-4 h-4 text-emerald-400" />;
      case 'like':
        return <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />;
      case 'comment':
        return <MessageCircle className="w-4 h-4 text-sky-400" />;
      case 'gift':
        return <Gift className="w-4 h-4 text-pink-400" />;
      case 'payout':
        return <DollarSign className="w-4 h-4 text-emerald-400" />;
      case 'video':
        return <Video className="w-4 h-4 text-amber-400" />;
      case 'system':
        return <Flame className="w-4 h-4 text-amber-400" />;
      default:
        return <Bell className="w-4 h-4 text-amber-400" />;
    }
  };

  const filteredItems = notifications.filter(n => {
    if (activeFilter === 'follow') return n.type === 'follow';
    if (activeFilter === 'engagement') return n.type === 'like' || n.type === 'comment';
    if (activeFilter === 'gift') return n.type === 'gift' || n.type === 'payout';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl text-neutral-100 flex flex-col h-[85vh] max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-xs">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-white">
                  {language === 'sw' ? 'Taarifa Zako (Notifications)' : 'Activity & Notifications'}
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-neutral-950 shadow-xs animate-pulse">
                    {unreadCount} {language === 'sw' ? 'mpya' : 'new'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-400">
                {language === 'sw' ? 'Mashabiki, likes, maoni, na zawadi zako zote' : 'Followers, likes, comments & rewards'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="px-2.5 py-1 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-[11px] font-semibold transition-colors flex items-center gap-1"
                title="Weka zote kuwa zimesomwa"
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{language === 'sw' ? 'Soma Zote' : 'Mark all'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
              aria-label="Funga"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-2.5 px-4 bg-neutral-950/70 border-b border-neutral-800/80 overflow-x-auto no-scrollbar">
          <button
            onClick={() => {
              setActiveFilter('all');
              memeAudio.playBoing();
            }}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              activeFilter === 'all'
                ? 'bg-amber-500 text-neutral-950 font-bold shadow-xs'
                : 'bg-neutral-800/80 text-neutral-400 hover:text-white'
            }`}
          >
            {language === 'sw' ? 'Zote' : 'All'} ({notifications.length})
          </button>

          <button
            onClick={() => {
              setActiveFilter('follow');
              memeAudio.playBoing();
            }}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
              activeFilter === 'follow'
                ? 'bg-emerald-500 text-neutral-950 font-bold shadow-xs'
                : 'bg-neutral-800/80 text-neutral-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3 h-3" />
            <span>{language === 'sw' ? 'Mashabiki (Follow)' : 'Followers'}</span>
          </button>

          <button
            onClick={() => {
              setActiveFilter('engagement');
              memeAudio.playBoing();
            }}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
              activeFilter === 'engagement'
                ? 'bg-rose-500 text-white font-bold shadow-xs'
                : 'bg-neutral-800/80 text-neutral-400 hover:text-white'
            }`}
          >
            <Heart className="w-3 h-3" />
            <span>{language === 'sw' ? 'Likes & Maoni' : 'Likes & Comments'}</span>
          </button>

          <button
            onClick={() => {
              setActiveFilter('gift');
              memeAudio.playBoing();
            }}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
              activeFilter === 'gift'
                ? 'bg-pink-500 text-white font-bold shadow-xs'
                : 'bg-neutral-800/80 text-neutral-400 hover:text-white'
            }`}
          >
            <Gift className="w-3 h-3" />
            <span>{language === 'sw' ? 'Zawadi & Sarafu' : 'Gifts & Coins'}</span>
          </button>
        </div>

        {/* List of Notifications */}
        <div className="p-3 overflow-y-auto space-y-2 flex-1">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-neutral-400 space-y-2">
              <Bell className="w-10 h-10 text-neutral-600 stroke-[1.5]" />
              <p className="text-sm font-semibold text-neutral-300">
                {language === 'sw' ? 'Hakuna taarifa kwenye sehemu hii' : 'No notifications in this tab'}
              </p>
              <p className="text-xs text-neutral-500">
                {language === 'sw' ? 'Taarifa zote mpya za mashabiki, likes na maoni zitajitokeza hapa.' : 'New follower alerts and comments will appear here.'}
              </p>
            </div>
          ) : (
            filteredItems.map(notif => (
              <div
                key={notif.id}
                onClick={() => handleItemClick(notif.id)}
                className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer group ${
                  notif.is_read
                    ? 'bg-neutral-950/60 border-neutral-800/80 text-neutral-300 hover:bg-neutral-800/40'
                    : 'bg-neutral-900 border-amber-500/40 text-white shadow-md hover:border-amber-400'
                }`}
              >
                <div className={`p-2.5 rounded-xl border shrink-0 transition-transform group-hover:scale-110 ${
                  notif.is_read
                    ? 'bg-neutral-900 border-neutral-800'
                    : 'bg-amber-500/15 border-amber-500/30'
                }`}>
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h4 className={`text-xs font-bold truncate ${notif.is_read ? 'text-neutral-200' : 'text-white'}`}>
                      {notif.title}
                    </h4>
                    <span className="text-[10px] text-neutral-500 font-mono shrink-0 ml-2">
                      {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed font-normal">
                    {notif.body}
                  </p>
                </div>
                {!notif.is_read && (
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0 mt-1.5 shadow-sm shadow-amber-500/50" />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
