import React, { useState, useEffect } from 'react';
import { Sparkles, Sliders, Play, RotateCcw, Award, Clock, Eye, Flame, UserCheck, Trash2 } from 'lucide-react';
import { MemeVideo, Language } from '../types';
import { 
  RECOMMENDATION_CONFIG, 
  calculateVideoScore, 
  getLocalTasteProfile, 
  resetLocalTasteProfile, 
  type UserTasteProfile 
} from '../algorithms/recommendation';

interface RecommendationEngineExplorerProps {
  currentVideo: MemeVideo;
  language: Language;
}

export const RecommendationEngineExplorer: React.FC<RecommendationEngineExplorerProps> = ({
  currentVideo,
  language
}) => {
  // Live user taste profile from watch-time tracking
  const [tasteProfile, setTasteProfile] = useState<UserTasteProfile>(() => getLocalTasteProfile());
  const [isResetting, setIsResetting] = useState(false);

  // Sync profile from backend if available
  useEffect(() => {
    fetch('/api/me/taste-profile')
      .then(r => r.json())
      .then(data => {
        if (data?.profile?.totalWatchSec) {
          setTasteProfile(prev => ({
            ...prev,
            ...data.profile,
            topTags: data.profile.topTags?.length ? data.profile.topTags : prev.topTags,
          }));
        }
      })
      .catch(() => {});
  }, []);

  const handleResetTasteProfile = async () => {
    setIsResetting(true);
    resetLocalTasteProfile();
    try {
      await fetch('/api/me/taste-profile/reset', { method: 'POST' });
    } catch {
      // ignore
    }
    setTasteProfile(getLocalTasteProfile());
    setIsResetting(false);
  };

  // Interactive simulator state initialized from current video
  const [watchRatio, setWatchRatio] = useState<number>(currentVideo.signals?.watchRatio || 1.0);
  const [likes, setLikes] = useState<number>(Math.min(currentVideo.likesCount || 0, 50000));
  const [shares, setShares] = useState<number>(Math.min(currentVideo.savesCount || currentVideo.sharesCount || 0, 15000));
  const [comments, setComments] = useState<number>(Math.min(currentVideo.commentsCount || 0, 5000));
  const [skips, setSkips] = useState<number>(currentVideo.signals?.skips || 0);
  const [ageHours, setAgeHours] = useState<number>(currentVideo.signals?.ageHours || 4);

  const ageSeconds = ageHours * 3600;
  const simulatedCreatedAt = new Date(Date.now() - ageSeconds * 1000).toISOString();

  const scoreData = calculateVideoScore({
    id: currentVideo.id,
    durationSec: currentVideo.duration || 15,
    createdAt: simulatedCreatedAt,
    likesCount: likes,
    commentsCount: comments,
    savesCount: shares,
    viewsCount: Math.max(1, currentVideo.viewsCount || 1),
    fastSkipsCount: skips,
    totalWatchMs: watchRatio * (currentVideo.duration || 15) * 1000,
    avgWatchRatio: watchRatio,
    caption: currentVideo.caption,
    creatorId: currentVideo.creator?.id,
  }, tasteProfile);

  const finalScore = scoreData.finalScore;
  const decayFactor = scoreData.decayFactor;

  // Algorithm tier
  let tier = {
    name: language === 'sw' ? 'Meme Inayochipukia' : 'Rising Seed Meme',
    color: 'text-neutral-400',
    feedPlacement: language === 'sw' ? 'Jaribio la Watazamaji 100' : 'Test Audience (100 impressions)'
  };

  if (finalScore > 18000) {
    tier = {
      name: language === 'sw' ? 'VIRAL! (Kilele cha Trending)' : 'VIRAL MEGA HIT!',
      color: 'text-amber-400',
      feedPlacement: language === 'sw' ? 'Nafasi ya Kwanza Kwa Wote (For You #1)' : 'Global For You Top Slot'
    };
  } else if (finalScore > 8000) {
    tier = {
      name: language === 'sw' ? 'Inayopendekezwa Sana' : 'Highly Recommended',
      color: 'text-emerald-400',
      feedPlacement: language === 'sw' ? 'Watazamaji 50,000+' : 'For You Feed (50,000+ Reach)'
    };
  }

  const handleResetToCurrent = () => {
    setWatchRatio(currentVideo.signals.watchRatio);
    setLikes(Math.min(currentVideo.likesCount, 50000));
    setShares(Math.min(currentVideo.sharesCount, 15000));
    setComments(Math.min(currentVideo.commentsCount, 5000));
    setSkips(currentVideo.signals.skips);
    setAgeHours(currentVideo.signals.ageHours || 4);
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-5 text-neutral-100">
      {/* Title */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="font-bold text-sm">
              {language === 'sw'
                ? 'Recommendation Engine: Mfumo wa Kupendekeza'
                : 'Recommendation Engine Explorer'}
            </h3>
            <p className="text-[11px] text-neutral-400">
              {language === 'sw'
                ? 'Algorithm inavyopima na kukuza video ya meme kwa msingi wa data'
                : 'Real-time scoring algorithm powering the For You feed'}
            </p>
          </div>
        </div>

        <button
          onClick={handleResetToCurrent}
          className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>{language === 'sw' ? 'Rejesha Data' : 'Reset'}</span>
        </button>
      </div>

      {/* Formula Banner (v2 AI Watch-Time Engine) */}
      <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 text-xs font-mono space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-amber-400 uppercase tracking-wider font-sans font-bold flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-400" />
            {language === 'sw' ? 'Kanuni Rasmi ya AI v2 (Watch-Time & Taste Affinity):' : 'Official AI v2 Ranking Formula:'}
          </span>
          <span className="text-[10px] text-neutral-400 font-sans">
            Half-life: 12h | Hybrid: 70% FYP + 30% Following
          </span>
        </div>
        <code className="text-amber-200 block text-xs break-all">
          score = (completion_rate × 4.0) + (loop_rewatch × 3.0) + (shares × 2.5) + (comments × 1.5) + (likes × 1.5) − (fast_skips × 3.0)
        </code>
        <code className="text-emerald-400/90 block text-[11px] break-all">
          final = score × (1.0 + watch_tag_affinity + creator_affinity) × exp(−age_seconds / 43200)
        </code>
      </div>

      {/* USER'S LIVE WATCH-TIME TASTE PROFILE CARD */}
      <div className="bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 p-4 rounded-2xl border border-amber-500/30 space-y-3 shadow-lg">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-800/80">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-neutral-100 flex items-center gap-1.5">
                <span>{language === 'sw' ? 'Wasifu Wako wa AI wa Kutazama (Taste Profile)' : 'Your AI Watch-Time Taste Profile'}</span>
                <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">LIVE</span>
              </h4>
              <p className="text-[10px] text-neutral-400">
                {language === 'sw'
                  ? 'Kila sekunde unayotumia kutazama video inatumiwa kukupatia video zinazofanana'
                  : 'Every second you spend watching reels personalizes your future recommendations'}
              </p>
            </div>
          </div>

          <button
            onClick={handleResetTasteProfile}
            disabled={isResetting}
            className="flex items-center gap-1 text-[10px] text-neutral-400 hover:text-rose-400 px-2 py-1 rounded bg-neutral-800/60 hover:bg-neutral-800 transition-colors"
            title="Rejesha mapendeleo ya algorithm kuwa mapya"
          >
            <Trash2 className="w-3 h-3" />
            <span>{isResetting ? 'Inafuta...' : (language === 'sw' ? 'Futa Wasifu' : 'Reset Taste')}</span>
          </button>
        </div>

        {/* 3 Metric Pills */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-neutral-950/80 p-2.5 rounded-xl border border-neutral-800">
            <span className="text-[10px] text-neutral-400 block">
              {language === 'sw' ? 'Muda Jumla' : 'Total Watch'}
            </span>
            <span className="text-sm font-extrabold text-amber-400 font-mono">
              {Math.floor(tasteProfile.totalWatchSec / 60)}m {tasteProfile.totalWatchSec % 60}s
            </span>
          </div>

          <div className="bg-neutral-950/80 p-2.5 rounded-xl border border-neutral-800">
            <span className="text-[10px] text-neutral-400 block">
              {language === 'sw' ? 'Zilizomalizwa' : 'Completed'}
            </span>
            <span className="text-sm font-extrabold text-emerald-400 font-mono">
              {tasteProfile.completedVideosCount || 0} reels
            </span>
          </div>

          <div className="bg-neutral-950/80 p-2.5 rounded-xl border border-neutral-800">
            <span className="text-[10px] text-neutral-400 block">
              {language === 'sw' ? 'Wastani wa Utazamaji' : 'Avg Completion'}
            </span>
            <span className="text-sm font-extrabold text-sky-400 font-mono">
              {Math.round((tasteProfile.avgCompletionRate || 0.85) * 100)}%
            </span>
          </div>
        </div>

        {/* Top Loved Tags from Watch Time */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px] text-neutral-300">
            <span className="font-semibold flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'sw' ? 'Mada Unazozitazama Sana (Top Watched Topics):' : 'Your Top Watched Comedy Topics:'}</span>
            </span>
            {scoreData.affinityMultiplier > 1.0 && (
              <span className="text-[10px] font-mono text-emerald-400 font-bold">
                +{Math.round((scoreData.affinityMultiplier - 1) * 100)}% Boost Kwenye Video Hii
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {tasteProfile.topTags && tasteProfile.topTags.length > 0 ? (
              tasteProfile.topTags.map(tagObj => (
                <div
                  key={tagObj.tag}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-950 border border-amber-500/40 text-[11px] text-amber-200"
                >
                  <span className="font-semibold">{tagObj.tag}</span>
                  <span className="text-[9px] font-mono text-neutral-400">({tagObj.score} pts)</span>
                </div>
              ))
            ) : (
              <div className="text-[11px] text-neutral-400 italic">
                {language === 'sw'
                  ? 'Tazama video kadhaa kwa sekunde chache ili AI ijifunze aina ya vichekesho unavyovipenda!'
                  : 'Watch a few reels to allow the AI to learn your comedy tastes in real-time!'}
              </div>
            )}
          </div>
        </div>

        {/* Matched reason for this video */}
        {scoreData.matchedReason && (
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{scoreData.matchedReason}</span>
          </div>
        )}
      </div>

      {/* Live Score Display */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-neutral-950/70 p-3.5 rounded-xl border border-neutral-800 flex flex-col justify-between">
          <span className="text-[11px] text-neutral-400">
            {language === 'sw' ? 'Alama Halisi ya Sasa' : 'Dynamic Score'}
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold text-amber-400 font-mono tabular-nums">
              {finalScore.toLocaleString()}
            </span>
            <span className="text-[10px] text-neutral-500 font-mono">pts</span>
          </div>
          <div className="text-[10px] text-neutral-400 mt-2">
            Decay factor: {(decayFactor * 100).toFixed(0)}% ({ageHours}h age)
          </div>
        </div>

        <div className="bg-neutral-950/70 p-3.5 rounded-xl border border-neutral-800 flex flex-col justify-between">
          <span className="text-[11px] text-neutral-400">
            {language === 'sw' ? 'Hadhi ya Video (Tier)' : 'Ranking Tier'}
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <Award className="w-5 h-5 text-amber-400 shrink-0" />
            <span className={`text-sm font-bold ${tier.color}`}>
              {tier.name}
            </span>
          </div>
          <span className="text-[11px] text-neutral-400 mt-2 truncate">
            {tier.feedPlacement}
          </span>
        </div>

        <div className="bg-neutral-950/70 p-3.5 rounded-xl border border-neutral-800 flex flex-col justify-between">
          <span className="text-[11px] text-neutral-400">
            {language === 'sw' ? 'Ishara Muhimu Zaidi' : 'Key Signal Weight'}
          </span>
          <div className="text-xs text-neutral-200 mt-1 font-semibold">
            Watch Time (4.0×) &gt; Rewatch (3.0×) &gt; Shares &gt; Likes
          </div>
          <p className="text-[10px] text-neutral-400 mt-2">
            {language === 'sw'
              ? 'Muda wa kutazama na kurudia (loops) ndiyo nguzo kuu ya kanuni ya AI.'
              : 'Watch duration and loop rewatching dominate passive likes.'}
          </p>
        </div>
      </div>

      {/* Interactive Signal Sliders */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300">
          <Sliders className="w-3.5 h-3.5 text-amber-400" />
          <span>
            {language === 'sw'
              ? 'Jaribu kubadilisha ishara za hadhira (Interactive Simulation):'
              : 'Adjust Audience Signals to see Ranking Shift:'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Watch Ratio */}
          <div className="bg-neutral-950/50 p-3 rounded-xl border border-neutral-800/80 space-y-1.5">
            <div className="flex justify-between items-center text-neutral-300">
              <span>
                {language === 'sw' ? 'Muda wa Kutazama (Watch Ratio)' : 'Watch Ratio (Duration %)'}
              </span>
              <span className="font-mono text-amber-400 font-bold tabular-nums">
                {(watchRatio * 100).toFixed(0)}% {watchRatio > 1.0 ? '🔥 (Rewatched!)' : ''}
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="2.5"
              step="0.05"
              value={watchRatio}
              onChange={e => setWatchRatio(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-neutral-500">
              <span>0.1x (Alikatisha)</span>
              <span>1.0x (Alimaliza)</span>
              <span>2.5x (Alirudia mara 3)</span>
            </div>
          </div>

          {/* Likes */}
          <div className="bg-neutral-950/50 p-3 rounded-xl border border-neutral-800/80 space-y-1.5">
            <div className="flex justify-between items-center text-neutral-300">
              <span>{language === 'sw' ? 'Idadi ya Likes (2×)' : 'Likes Count (2×)'}</span>
              <span className="font-mono text-rose-400 font-bold tabular-nums">
                {likes.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="50000"
              step="500"
              value={likes}
              onChange={e => setLikes(parseInt(e.target.value))}
              className="w-full accent-rose-500 cursor-pointer"
            />
          </div>

          {/* Shares & Comments */}
          <div className="bg-neutral-950/50 p-3 rounded-xl border border-neutral-800/80 space-y-1.5">
            <div className="flex justify-between items-center text-neutral-300">
              <span>{language === 'sw' ? 'Kusambaza (Shares)' : 'Shares & Forwards'}</span>
              <span className="font-mono text-sky-400 font-bold tabular-nums">
                {shares.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="20000"
              step="200"
              value={shares}
              onChange={e => setShares(parseInt(e.target.value))}
              className="w-full accent-sky-500 cursor-pointer"
            />
          </div>

          {/* Skip Penalty */}
          <div className="bg-neutral-950/50 p-3 rounded-xl border border-neutral-800/80 space-y-1.5">
            <div className="flex justify-between items-center text-neutral-300">
              <span>
                {language === 'sw' ? 'Kukurupuka / Skip Haraka (-2×)' : 'Fast Skip Penalty (-2×)'}
              </span>
              <span className="font-mono text-red-400 font-bold tabular-nums">
                {skips} skips
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="500"
              step="5"
              value={skips}
              onChange={e => setSkips(parseInt(e.target.value))}
              className="w-full accent-red-500 cursor-pointer"
            />
            <span className="text-[10px] text-neutral-500">
              {language === 'sw'
                ? 'Mtumiaji akisogeza chini ya sekunde 2, inapunguza alama'
                : 'Swiping away in < 2s penalizes recommendation score'}
            </span>
          </div>
        </div>
      </div>

      {/* 3 Core Recommendation Pillars */}
      <div className="pt-2 border-t border-neutral-800 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
          <h4 className="font-semibold text-neutral-200">1. Cold Start Feed</h4>
          <p className="text-[11px] text-neutral-400">
            {language === 'sw'
              ? 'Watumiaji wapya wanapokea mchanganyiko wa video 10 zinazovuma kwa hashtags + eneo (Dar es Salaam / Nairobi).'
              : 'New users receive a blend of trending hashtags + geo-proximity memes before preference history.'}
          </p>
        </div>

        <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
          <h4 className="font-semibold text-neutral-200">2. Collaborative Filtering</h4>
          <p className="text-[11px] text-neutral-400">
            {language === 'sw'
              ? '"Waliocheka video ya Mwalimu walipenda pia video za Paka na Daladala" (Vector embeddings).'
              : '"Users who laughed at Reel X also enjoyed Reel Y" matrix factorization & user clustering.'}
          </p>
        </div>

        <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
          <h4 className="font-semibold text-neutral-200">3. Time Decay (Half-Life)</h4>
          <p className="text-[11px] text-neutral-400">
            {language === 'sw'
              ? 'Baada ya masaa 24, alama inapungua nusu ili kuruhusu meme mpya za siku kufikia kilele.'
              : 'Every 24 hours, viral score halves to prevent stale memes from monopolizing the feed.'}
          </p>
        </div>
      </div>
    </div>
  );
};
