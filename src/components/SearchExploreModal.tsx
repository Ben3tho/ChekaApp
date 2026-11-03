import React, { useState, useMemo } from 'react';
import { 
  Search, 
  X, 
  Flame, 
  Hash, 
  User, 
  Play, 
  Heart, 
  Sparkles,
  TrendingUp,
  Compass,
  ArrowRight
} from 'lucide-react';
import { MemeVideo, Creator, Language } from '../types';
import { memeAudio } from '../utils/audioSynth';

interface SearchExploreModalProps {
  isOpen: boolean;
  onClose: () => void;
  videos: MemeVideo[];
  onSelectVideo: (videoId: string) => void;
  onSelectCreator: (creator: Creator) => void;
  language?: Language;
}

const TRENDING_HASHTAGS = [
  { tag: '#VichekoTanzania', count: '18.4K', icon: '🔥', popular: true },
  { tag: '#BongoMemes', count: '14.2K', icon: '😂', popular: true },
  { tag: '#DarEsSalaam', count: '11.8K', icon: '🌴' },
  { tag: '#Uswahilini', count: '9.3K', icon: '⚡' },
  { tag: '#ChugaComedy', count: '7.1K', icon: '🏔️' },
  { tag: '#SimbaVsYanga', count: '6.5K', icon: '⚽' },
  { tag: '#Wajumbe', count: '5.2K', icon: '🗳️' },
  { tag: '#MapenziYaBongo', count: '4.8K', icon: '💔' },
  { tag: '#DaladalaChronicles', count: '3.9K', icon: '🚐' },
];

export const SearchExploreModal: React.FC<SearchExploreModalProps> = ({
  isOpen,
  onClose,
  videos,
  onSelectVideo,
  onSelectCreator,
  language = 'sw',
}) => {
  const [query, setQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'creators' | 'reels'>('all');

  // Extract unique creators from current video library
  const creators = useMemo(() => {
    const map = new Map<string, Creator>();
    videos.forEach(v => {
      if (v.creator && !map.has(v.creator.id)) {
        map.set(v.creator.id, v.creator);
      }
    });
    return Array.from(map.values());
  }, [videos]);

  // Filter matching creators
  const filteredCreators = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^@/, '');
    if (!q) return creators;
    return creators.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.username.toLowerCase().includes(q) ||
      (c.bio && c.bio.toLowerCase().includes(q))
    );
  }, [creators, query]);

  // Filter matching videos
  const filteredVideos = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return videos;
    return videos.filter(v => 
      v.caption.toLowerCase().includes(q) ||
      v.title.toLowerCase().includes(q) ||
      v.tags?.some(t => t.toLowerCase().includes(q)) ||
      v.creator?.username.toLowerCase().includes(q.replace(/^@/, ''))
    );
  }, [videos, query]);

  if (!isOpen) return null;

  const handleHashtagClick = (tag: string) => {
    setQuery(tag);
    memeAudio.playPop();
  };

  const handleClear = () => {
    setQuery('');
    memeAudio.playBoing();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-none sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[100dvh] sm:h-auto sm:max-h-[88vh] text-white"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center gap-3 bg-neutral-950/80">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={language === 'sw' ? 'Tafuta wachekeshaji, memes, au #lebo...' : 'Search creators, memes, or tags...'}
              autoFocus
              className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-neutral-900 border border-neutral-800 focus:border-amber-400 focus:outline-hidden text-sm text-white placeholder-neutral-500 transition-colors"
            />
            {query && (
              <button
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors text-xs font-semibold"
          >
            {language === 'sw' ? 'Ghairi' : 'Cancel'}
          </button>
        </div>

        {/* Trending Hashtags Horizontal Strip */}
        <div className="px-4 py-3 border-b border-neutral-800/80 bg-neutral-950/40">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-400 mb-2">
            <Flame className="w-3.5 h-3.5 text-amber-400 fill-current" />
            <span>{language === 'sw' ? 'Mada Zinazovuma Tanzania (Trending)' : 'Trending Hashtags'}</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {TRENDING_HASHTAGS.map(({ tag, count, icon, popular }) => {
              const isSelected = query.toLowerCase() === tag.toLowerCase();
              return (
                <button
                  key={tag}
                  onClick={() => handleHashtagClick(tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-all border ${
                    isSelected
                      ? 'bg-amber-500 text-neutral-950 border-amber-400 font-bold shadow-md shadow-amber-500/20'
                      : popular
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                      : 'bg-neutral-800/60 text-neutral-300 border-neutral-700/60 hover:bg-neutral-800'
                  }`}
                >
                  <span>{icon}</span>
                  <span>{tag}</span>
                  <span className="text-[10px] opacity-75 font-mono">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Filters */}
        <div className="px-4 border-b border-neutral-800/80 flex items-center gap-6 text-xs bg-neutral-950/20">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-2.5 font-semibold transition-colors border-b-2 ${
              activeTab === 'all'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            {language === 'sw' ? 'Zote (All)' : 'All'}
          </button>
          <button
            onClick={() => setActiveTab('creators')}
            className={`py-2.5 font-semibold transition-colors border-b-2 flex items-center gap-1 ${
              activeTab === 'creators'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <span>{language === 'sw' ? 'Wachekeshaji' : 'Creators'}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-800 font-mono">
              {filteredCreators.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('reels')}
            className={`py-2.5 font-semibold transition-colors border-b-2 flex items-center gap-1 ${
              activeTab === 'reels'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <span>{language === 'sw' ? 'Vichekesho (Reels)' : 'Reels'}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-800 font-mono">
              {filteredVideos.length}
            </span>
          </button>
        </div>

        {/* Results Area */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {/* Creators Section */}
          {(activeTab === 'all' || activeTab === 'creators') && filteredCreators.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>{language === 'sw' ? 'Wachekeshaji Maarufu' : 'Comedy Creators'}</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredCreators.map(creator => (
                  <div
                    key={creator.id}
                    onClick={() => {
                      onSelectCreator(creator);
                      onClose();
                      memeAudio.playPop();
                    }}
                    className="p-2.5 rounded-2xl bg-neutral-950/70 border border-neutral-800/80 hover:border-amber-400/50 flex items-center justify-between gap-3 cursor-pointer group transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={creator.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=creator'}
                        alt={creator.name}
                        className="w-10 h-10 rounded-full object-cover border border-amber-500/30 group-hover:scale-105 transition-transform"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white flex items-center gap-1 truncate">
                          <span>{creator.name}</span>
                          {creator.verified && (
                            <span className="w-3 h-3 rounded-full bg-amber-500 text-neutral-950 flex items-center justify-center text-[8px] font-bold">
                              ✓
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-amber-400 truncate">
                          @{creator.username}
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] text-neutral-400 group-hover:text-amber-400 flex items-center gap-0.5">
                      <span>Tazama</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Videos Grid Section */}
          {(activeTab === 'all' || activeTab === 'reels') && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 text-rose-400 fill-current" />
                <span>{language === 'sw' ? 'Vichekesho Vilivyopatikana' : 'Comedy Reels'}</span>
              </h3>

              {filteredVideos.length === 0 ? (
                <div className="py-12 text-center text-xs text-neutral-500 space-y-2">
                  <Compass className="w-8 h-8 mx-auto text-neutral-600" />
                  <p>Hakuna vichekesho vilivyolingana na utafutaji wako.</p>
                  <button
                    onClick={handleClear}
                    className="text-amber-400 underline hover:text-amber-300"
                  >
                    Onyesha video zote
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {filteredVideos.map((vid, idx) => {
                    const thumb = vid.streamPlayback?.thumbnail || vid.mediaUrl;
                    return (
                      <div
                        key={`${vid.id}-${idx}`}
                        onClick={() => {
                          onSelectVideo(vid.id);
                          onClose();
                          memeAudio.playVictory();
                        }}
                        className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-800 hover:border-amber-400/80 cursor-pointer group transition-all"
                      >
                        <img
                          src={thumb}
                          alt={vid.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex flex-col justify-end p-2">
                          <div className="flex items-center justify-between text-[10px] text-white font-mono">
                            <span className="flex items-center gap-0.5 text-amber-300">
                              <Play className="w-2.5 h-2.5 fill-current" />
                              {(vid.viewsCount || 10).toLocaleString()}
                            </span>
                            <span className="flex items-center gap-0.5 text-rose-400">
                              <Heart className="w-2.5 h-2.5 fill-current" />
                              {(vid.likesCount || 0).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-[10px] text-neutral-200 truncate font-sans mt-0.5">
                            {vid.caption}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
