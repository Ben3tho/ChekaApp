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
  AlertCircle
} from 'lucide-react';
import { Language } from '../types';
import { useAuth } from '../context/AuthContext';
import { memeAudio } from '../utils/audioSynth';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  language?: Language;
}

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'gift' | 'video' | 'system' | 'payout';
  title: string;
  body: string;
  metadata_json?: string;
  is_read: boolean;
  created_at: string;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  language = 'sw',
}) => {
  const { user, authFetch } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await authFetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.notifications)) {
          setNotifications(data.notifications);
        }
      }
    } catch (err) {
      console.warn('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMarkAllRead = async () => {
    try {
      await authFetch('/api/notifications/mark-read', { method: 'POST' });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      memeAudio.playPop();
    } catch (err) {
      console.warn('Error marking notifications as read:', err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
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
      default:
        return <Sparkles className="w-4 h-4 text-yellow-400" />;
    }
  };

  const defaultNotifications: Notification[] = [
    {
      id: 'def_1',
      type: 'gift',
      title: '🎁 Umepokea Zawadi Mpya!',
      body: 'Mtumiaji @shabiki_wa_memes amekutumia zawadi ya Kikombe cha Chai (100 Coins)!',
      is_read: false,
      created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    },
    {
      id: 'def_2',
      type: 'like',
      title: '❤️ Like Mpya!',
      body: '@chuga_vibes amependa meme yako ya "Bosi akikuona saa tatu asubuhi".',
      is_read: false,
      created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    },
    {
      id: 'def_3',
      type: 'comment',
      title: '💬 Maoni Mapya!',
      body: '@mwalimu_memes ametoa maoni: "Hahaha hii ni kali sana kiongozi! Fanya Part 2 😂"',
      is_read: true,
      created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    },
    {
      id: 'def_4',
      type: 'system',
      title: '🔥 Mwendelezo wa Siku (Daily Streak)',
      body: 'Hongera! Umeingia siku 3 mfululizo. Usisahau kudai sarafu zako 50 za bure!',
      is_read: true,
      created_at: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
    },
  ];

  const items = notifications.length > 0 ? notifications : defaultNotifications;
  const unreadCount = items.filter(n => !n.is_read).length;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl text-neutral-100 flex flex-col h-[85vh] max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">
                  {language === 'sw' ? 'Taarifa Zako (Notifications)' : 'Activity & Notifications'}
                </h3>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-neutral-950">
                    {unreadCount} mpya
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-400">
                {language === 'sw' ? 'Likes, maoni, zawadi na video mpya' : 'Likes, comments, gifts & alerts'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="px-2.5 py-1 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] font-semibold transition-colors flex items-center gap-1"
                title="Soma zote"
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Soma Zote</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="p-3 overflow-y-auto space-y-2 flex-1">
          {items.map(notif => (
            <div
              key={notif.id}
              className={`p-3 rounded-2xl border transition-all flex items-start gap-3 ${
                notif.is_read
                  ? 'bg-neutral-950/60 border-neutral-800/80 text-neutral-300'
                  : 'bg-neutral-900 border-amber-500/30 text-white shadow-sm'
              }`}
            >
              <div className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 shrink-0">
                {getIcon(notif.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h4 className="text-xs font-bold truncate text-white">{notif.title}</h4>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">{notif.body}</p>
              </div>
              {!notif.is_read && (
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 mt-1.5" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
