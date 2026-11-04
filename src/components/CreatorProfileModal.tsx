import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Plus, 
  Gift, 
  Share2, 
  Heart, 
  Play, 
  Video, 
  Sparkles, 
  MessageCircle,
  ExternalLink,
  Flame
} from 'lucide-react';
import { Creator, MemeVideo, Language } from '../types';
import { memeAudio } from '../utils/audioSynth';

interface CreatorProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  creator: Creator | null;
  allVideos: MemeVideo[];
  onSelectVideo: (videoId: string) => void;
  onFollowToggle: (creatorId: string) => void;
  onOpenGift: () => void;
  onOpenDirectChat?: (creator: Creator) => void;
  language?: Language;
}

export const CreatorProfileModal: React.FC<CreatorProfileModalProps> = ({
  isOpen,
  onClose,
  creator,
  allVideos,
  onSelectVideo,
  onFollowToggle,
  onOpenGift,
  onOpenDirectChat,
  language = 'sw',
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'popular'>('all');
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  if (!isOpen || !creator) return null;

  // Filter videos belonging to this creator
  const creatorVideos = allVideos.filter(
    v => v.creator?.id === creator.id || v.creator?.username === creator.username
  );

  const displayVideos = creatorVideos;

  const sortedVideos = activeTab === 'popular'
    ? [...displayVideos].sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0))
    : displayVideos;

  // Aggregate stats
  const totalLikes = displayVideos.reduce((acc, v) => acc + (v.likesCount || 0), 0);
  const totalViews = displayVideos.reduce((acc, v) => acc + (v.viewsCount || 0), 0);

  const handleShareProfile = () => {
    const url = window.location.origin + `?creator=${creator.username}`;
    if (navigator.share) {
      navigator.share({
        title: `${creator.name} kwenye ChekaApp`,
        text: `Tazama vichekesho vya ${creator.name} (@${creator.username}) kwenye ChekaApp! 😂🔥`,
        url,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
    memeAudio.playPop();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] text-white"
        onClick={e => e.stopPropagation()}
      >
        {/* Cover Banner with Dar Es Salaam Nightline Gradient */}
        <div className="relative h-28 bg-gradient-to-r from-amber-600 via-yellow-600 to-rose-600 overflow-hidden">
          <div className="absolute inset-0 bg-black/25 backdrop-blur-[1px]" />
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <button
              onClick={handleShareProfile}
              className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-colors border border-white/10"
              title="Shiriki wasifu"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-colors border border-white/10"
              title="Funga"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Profile Card Header */}
        <div className="px-5 pb-3 -mt-12 relative flex flex-col items-center text-center">
          {/* Avatar with Glow Ring */}
          <div className="relative mb-2">
            <div className="w-22 h-22 rounded-full p-1 bg-gradient-to-tr from-amber-500 via-yellow-400 to-pink-500 shadow-xl shadow-amber-500/20">
              <img
                src={creator.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=creator'}
                alt={creator.name}
                className="w-full h-full rounded-full object-cover bg-neutral-950"
              />
            </div>
            {creator.verified && (
              <div 
                className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-amber-500 text-neutral-950 flex items-center justify-center text-xs font-bold shadow-md border-2 border-neutral-900"
                title="Akaunti Iliyothibitishwa"
              >
                ✓
              </div>
            )}
          </div>

          {/* Name & Handle */}
          <h2 className="text-lg font-black text-white flex items-center gap-1.5">
            {creator.name}
          </h2>
          <p className="text-xs font-mono text-amber-400">
            @{creator.username}
          </p>

          {/* Bio Tagline */}
          <p className="text-xs text-neutral-300 max-w-sm mt-1.5 leading-relaxed">
            {creator.bio || (language === 'sw' 
              ? 'Mchekeshaji na muunda maudhui ya vicheko Tanzania. Karibu tuburudike pamoja! 😂🇹🇿' 
              : 'Tanzanian comedy creator & meme maker. Enjoy daily laughs! 😂🇹🇿')}
          </p>

          {/* Followers, Likes, and Videos Counters */}
          <div className="flex items-center justify-center gap-6 mt-3.5 py-2 px-4 rounded-2xl bg-neutral-950/70 border border-neutral-800/80 w-full max-w-sm">
            <div className="flex flex-col items-center">
              <span className="font-extrabold text-sm text-white font-mono">
                {(creator.followersCount || 0).toLocaleString()}
              </span>
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider">
                {language === 'sw' ? 'Wafuasi' : 'Followers'}
              </span>
            </div>
            <div className="w-px h-6 bg-neutral-800" />
            <div className="flex flex-col items-center">
              <span className="font-extrabold text-sm text-rose-400 font-mono">
                {totalLikes.toLocaleString()}
              </span>
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider">
                {language === 'sw' ? 'Vicheko' : 'Likes'}
              </span>
            </div>
            <div className="w-px h-6 bg-neutral-800" />
            <div className="flex flex-col items-center">
              <span className="font-extrabold text-sm text-amber-400 font-mono">
                {displayVideos.length}
              </span>
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider">
                {language === 'sw' ? 'Video' : 'Reels'}
              </span>
            </div>
          </div>

          {/* Action CTAs: Follow, Direct Message & Send Gift */}
          <div className="grid grid-cols-3 gap-2 mt-3.5 w-full max-w-sm">
            <button
              onClick={() => {
                onFollowToggle(creator.id);
                memeAudio.playBoing();
              }}
              className="py-2.5 px-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-neutral-950 font-bold hover:brightness-110 active:scale-95 transition-all text-[11px] sm:text-xs flex items-center justify-center gap-1 shadow-md shadow-amber-500/20"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>{language === 'sw' ? 'Fuata' : 'Follow'}</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenDirectChat?.(creator);
                memeAudio.playPop();
              }}
              className="py-2.5 px-2 rounded-xl bg-sky-600/90 hover:bg-sky-500 text-white font-bold active:scale-95 transition-all text-[11px] sm:text-xs flex items-center justify-center gap-1 shadow-md shadow-sky-600/20"
              title="Ongea na mchekeshaji moja kwa moja (Direct Message)"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{language === 'sw' ? 'Ujumbe' : 'Message'}</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenGift();
              }}
              className="py-2.5 px-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white font-semibold active:scale-95 transition-all text-[11px] sm:text-xs flex items-center justify-center gap-1"
            >
              <Gift className="w-3.5 h-3.5 text-pink-400" />
              <span>{language === 'sw' ? 'Zawadi 🎁' : 'Gift'}</span>
            </button>
          </div>

          {copySuccess && (
            <p className="text-[11px] text-emerald-400 font-medium mt-1 animate-fade-in">
              ✓ Link ya wasifu imenakiliwa kikamilifu!
            </p>
          )}
        </div>

        {/* Video Grid Tabs */}
        <div className="px-5 border-t border-neutral-800/80 flex items-center justify-around bg-neutral-950/40 text-xs">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-2.5 font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'all'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>{language === 'sw' ? 'Video Zote' : 'All Videos'}</span>
          </button>

          <button
            onClick={() => setActiveTab('popular')}
            className={`py-2.5 font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'popular'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>{language === 'sw' ? 'Zinazopendwa Sana' : 'Popular'}</span>
          </button>
        </div>

        {/* Video Thumbnails Grid (9:16 Aspect Ratio) */}
        <div className="p-3 overflow-y-auto flex-1 min-h-[180px] max-h-[300px]">
          {sortedVideos.length === 0 ? (
            <div className="py-10 text-center text-xs text-neutral-500">
              Hakuna video zilizopatikana kwa mchekeshaji huyu bado.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {sortedVideos.map((vid, idx) => {
                const thumb = vid.streamPlayback?.thumbnail || vid.mediaUrl;
                return (
                  <div
                    key={`${vid.id}-${idx}`}
                    onClick={() => {
                      onSelectVideo(vid.id);
                      onClose();
                      memeAudio.playPop();
                    }}
                    className="relative aspect-[9/16] rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800/80 group cursor-pointer hover:border-amber-400/60 transition-all"
                  >
                    <img
                      src={thumb}
                      alt={vid.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex flex-col justify-end p-1.5">
                      <div className="flex items-center justify-between text-[10px] text-white font-mono">
                        <span className="flex items-center gap-0.5">
                          <Play className="w-2.5 h-2.5 fill-current text-amber-400" />
                          {(vid.viewsCount || 0).toLocaleString()}
                        </span>
                        <span className="flex items-center gap-0.5 text-rose-400">
                          <Heart className="w-2.5 h-2.5 fill-current" />
                          {(vid.likesCount || 0).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[9px] text-neutral-300 truncate font-sans mt-0.5">
                        {vid.caption}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
