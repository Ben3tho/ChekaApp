import React, { useState, useEffect } from 'react';
import { X, Flame, Coins, Gift, Check, Sparkles, Trophy, Clock, Share2, MessageSquare, Zap } from 'lucide-react';
import { Language } from '../types';
import { memeAudio } from '../utils/audioSynth';

interface DailyRewardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userCoins: number;
  onAddCoins: (amount: number) => void;
  language: Language;
  todayWatchSec: number;
}

export interface StreakState {
  currentStreak: number;
  lastClaimDate: string | null;
  totalClaimed: number;
  claimedMissions: string[];
}

const STORAGE_KEY = 'cheka_daily_streak_v2';

export function getLocalStreakState(): StreakState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return {
    currentStreak: 1,
    lastClaimDate: null,
    totalClaimed: 0,
    claimedMissions: []
  };
}

export function saveLocalStreakState(state: StreakState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (_) {}
}

export const DailyRewardsModal: React.FC<DailyRewardsModalProps> = ({
  isOpen,
  onClose,
  userCoins,
  onAddCoins,
  language,
  todayWatchSec
}) => {
  const [streakState, setStreakState] = useState<StreakState>(getLocalStreakState);
  const [justClaimedReward, setJustClaimedReward] = useState<number | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const isClaimedToday = streakState.lastClaimDate === todayStr;

  const streakRewards = [
    { day: 1, coins: 20, label: 'Day 1' },
    { day: 2, coins: 35, label: 'Day 2' },
    { day: 3, coins: 50, label: 'Day 3' },
    { day: 4, coins: 75, label: 'Day 4' },
    { day: 5, coins: 100, label: 'Day 5' },
    { day: 6, coins: 150, label: 'Day 6' },
    { day: 7, coins: 300, label: 'Day 7 👑' },
  ];

  const currentDayIndex = ((streakState.currentStreak - 1) % 7);
  const todayReward = streakRewards[currentDayIndex] || streakRewards[0];

  useEffect(() => {
    if (isOpen) {
      setStreakState(getLocalStreakState());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Claim main streak reward
  const handleClaimStreak = () => {
    if (isClaimedToday) return;

    const reward = todayReward.coins;
    onAddCoins(reward);
    memeAudio.playReward();
    setJustClaimedReward(reward);

    const nextStreak = streakState.currentStreak + 1;
    const newState: StreakState = {
      ...streakState,
      currentStreak: nextStreak,
      lastClaimDate: todayStr,
      totalClaimed: streakState.totalClaimed + reward
    };

    setStreakState(newState);
    saveLocalStreakState(newState);

    setTimeout(() => {
      setJustClaimedReward(null);
    }, 2500);
  };

  // Claim task reward
  const handleClaimMission = (missionId: string, coins: number) => {
    if (streakState.claimedMissions.includes(missionId)) return;

    onAddCoins(coins);
    memeAudio.playReward();
    setJustClaimedReward(coins);

    const newState: StreakState = {
      ...streakState,
      claimedMissions: [...streakState.claimedMissions, missionId],
      totalClaimed: streakState.totalClaimed + coins
    };

    setStreakState(newState);
    saveLocalStreakState(newState);

    setTimeout(() => {
      setJustClaimedReward(null);
    }, 2500);
  };

  // Missions logic
  const watchTargetSec = 120; // 2 minutes of laughs
  const watchProgress = Math.min(100, Math.floor((todayWatchSec / watchTargetSec) * 100));
  const isWatchComplete = todayWatchSec >= watchTargetSec;
  const isWatchClaimed = streakState.claimedMissions.includes('watch_2min');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fade-in">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-3xl bg-neutral-900 border border-neutral-800 p-5 shadow-2xl z-10 text-neutral-100 max-h-[92vh] overflow-y-auto no-scrollbar">
        {/* Confetti alert banner when claimed */}
        {justClaimedReward && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-amber-500 text-neutral-950 font-extrabold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 animate-bounce">
            <Sparkles className="w-4 h-4 fill-current" />
            <span>+{justClaimedReward} Cheka Coins! 🎉</span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <Flame className="w-5 h-5 fill-current animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base flex items-center gap-1.5">
                <span>{language === 'sw' ? 'Zawadi za Kila Siku' : 'Daily Streak & Rewards'}</span>
                <span className="text-orange-400 font-mono text-xs">🔥 {streakState.currentStreak} Days</span>
              </h3>
              <p className="text-[11px] text-neutral-400">
                {language === 'sw' ? 'Ingia kila siku usikatishe mwendo wako wa vichekesho!' : 'Come back daily to keep your laugh streak alive!'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Coin Balance Banner */}
        <div className="flex items-center justify-between bg-neutral-950 p-3 rounded-2xl my-3 border border-neutral-800">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🪙</span>
            <div>
              <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">
                {language === 'sw' ? 'Salio Lako la Sarafu' : 'Your Coin Balance'}
              </div>
              <div className="text-base font-extrabold text-amber-400 font-mono">
                {userCoins.toLocaleString()} Coins
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
              {language === 'sw' ? 'Zawadi Bure' : 'Free Rewards'}
            </span>
          </div>
        </div>

        {/* 7-Day Streak Calendar */}
        <div className="my-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-neutral-300 flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              {language === 'sw' ? 'Mfululizo wa Siku 7 (Daily Streak)' : '7-Day Streak Ladder'}
            </span>
            <span className="text-[11px] text-neutral-400">
              {isClaimedToday
                ? language === 'sw' ? '✓ Imechukuliwa leo' : '✓ Claimed today'
                : language === 'sw' ? 'Zawadi ipo tayari!' : 'Ready to claim!'}
            </span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
            {streakRewards.map((item, idx) => {
              const isToday = idx === currentDayIndex;
              const isPast = idx < currentDayIndex;
              return (
                <div
                  key={item.day}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                    isToday
                      ? isClaimedToday
                        ? 'bg-neutral-800/80 border-emerald-500/50 text-neutral-200'
                        : 'bg-amber-500/15 border-amber-500 text-amber-300 ring-2 ring-amber-500/30 font-bold scale-105'
                      : isPast
                      ? 'bg-neutral-900/60 border-neutral-800 text-neutral-500'
                      : 'bg-neutral-950 border-neutral-850 text-neutral-400'
                  }`}
                >
                  <span className="text-[10px] font-semibold text-neutral-400">Siku {item.day}</span>
                  <span className="text-base my-0.5">{item.day === 7 ? '👑' : '🪙'}</span>
                  <span className="text-[11px] font-mono font-bold text-amber-400">+{item.coins}</span>
                  {isPast || (isToday && isClaimedToday) ? (
                    <Check className="w-3 h-3 text-emerald-400 mt-0.5" />
                  ) : null}
                </div>
              );
            })}
          </div>

          {/* Primary Streak Claim Button */}
          <button
            onClick={handleClaimStreak}
            disabled={isClaimedToday}
            className={`w-full mt-3 py-3 px-4 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
              isClaimedToday
                ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 active:scale-98 shadow-amber-500/20'
            }`}
          >
            {isClaimedToday ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{language === 'sw' ? 'Umepokea Sarafu Zako za Leo! Rudi Kesho ⏰' : 'Today\'s Reward Claimed! Come Back Tomorrow'}</span>
              </>
            ) : (
              <>
                <Gift className="w-4 h-4 fill-current" />
                <span>{language === 'sw' ? `Dai Sarafu +${todayReward.coins} za Siku ya ${currentDayIndex + 1} 🎁` : `Claim Day ${currentDayIndex + 1} Reward (+${todayReward.coins} Coins)`}</span>
              </>
            )}
          </button>
        </div>

        {/* Watch Time & Engagement Missions */}
        <div className="mt-4 pt-3 border-t border-neutral-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-yellow-400 fill-current" />
              {language === 'sw' ? 'Kipima Kicheko & Malengo ya Leo' : 'Laugh-O-Meter & Daily Missions'}
            </span>
            <span className="text-[10px] text-neutral-400">
              {todayWatchSec}s {language === 'sw' ? 'umetazama leo' : 'watched today'}
            </span>
          </div>

          {/* Mission 1: Watch 2 minutes */}
          <div className="p-3 bg-neutral-950 rounded-2xl border border-neutral-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-1">
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-xs font-semibold text-neutral-200">
                  <span className="truncate">{language === 'sw' ? 'Tazama Vichekesho kwa Dk 2' : 'Watch Reels for 2 Mins'}</span>
                  <span className="text-[11px] text-amber-400 font-mono font-bold">+30 🪙</span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="bg-amber-500 h-full transition-all duration-500 rounded-full"
                    style={{ width: `${watchProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-neutral-500 mt-1">
                  <span>{todayWatchSec}s / 120s</span>
                  <span>{watchProgress}%</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleClaimMission('watch_2min', 30)}
              disabled={!isWatchComplete || isWatchClaimed}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                isWatchClaimed
                  ? 'bg-neutral-850 text-neutral-500 border border-neutral-800'
                  : isWatchComplete
                  ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-md animate-pulse'
                  : 'bg-neutral-800 text-neutral-500 opacity-60'
              }`}
            >
              {isWatchClaimed
                ? (language === 'sw' ? 'Tayari' : 'Claimed')
                : isWatchComplete
                ? (language === 'sw' ? 'Dai +30' : 'Claim +30')
                : (language === 'sw' ? 'Bado' : 'Locked')}
            </button>
          </div>

          {/* Mission 2: Share WhatsApp Status */}
          <div className="p-3 bg-neutral-950 rounded-2xl border border-neutral-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-1">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                <Share2 className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-xs font-semibold text-neutral-200">
                  <span className="truncate">{language === 'sw' ? 'Weka Video 1 WhatsApp Status' : 'Share 1 Video to WhatsApp Status'}</span>
                  <span className="text-[11px] text-amber-400 font-mono font-bold">+40 🪙</span>
                </div>
                <p className="text-[10px] text-neutral-400 mt-0.5">
                  {language === 'sw' ? 'Sambaza kicheko kwa marafiki zako' : 'Spread the laughs to your friends'}
                </p>
              </div>
            </div>

            <button
              onClick={() => handleClaimMission('share_status', 40)}
              disabled={streakState.claimedMissions.includes('share_status')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                streakState.claimedMissions.includes('share_status')
                  ? 'bg-neutral-850 text-neutral-500 border border-neutral-800'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
              }`}
            >
              {streakState.claimedMissions.includes('share_status')
                ? (language === 'sw' ? 'Tayari' : 'Claimed')
                : (language === 'sw' ? 'Dai +40' : 'Claim +40')}
            </button>
          </div>

          {/* Mission 3: Send audio comment reaction */}
          <div className="p-3 bg-neutral-950 rounded-2xl border border-neutral-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-1">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-xs font-semibold text-neutral-200">
                  <span className="truncate">{language === 'sw' ? 'Tuma Maoni Yenye Sauti 🎵' : 'Comment with Comedy Soundbite'}</span>
                  <span className="text-[11px] text-amber-400 font-mono font-bold">+25 🪙</span>
                </div>
                <p className="text-[10px] text-neutral-400 mt-0.5">
                  {language === 'sw' ? 'Tumia Vine Boom au Kicheko cha Babu' : 'Use Vine Boom or Babu Laugh'}
                </p>
              </div>
            </div>

            <button
              onClick={() => handleClaimMission('sound_comment', 25)}
              disabled={streakState.claimedMissions.includes('sound_comment')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                streakState.claimedMissions.includes('sound_comment')
                  ? 'bg-neutral-850 text-neutral-500 border border-neutral-800'
                  : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md'
              }`}
            >
              {streakState.claimedMissions.includes('sound_comment')
                ? (language === 'sw' ? 'Tayari' : 'Claimed')
                : (language === 'sw' ? 'Dai +25' : 'Claim +25')}
            </button>
          </div>
        </div>

        {/* Footer tip */}
        <div className="mt-4 pt-3 border-t border-neutral-800 text-[11px] text-neutral-500 text-center">
          {language === 'sw'
            ? '💡 Sarafu zako unazitumia kuwazawadia wachekeshaji au kufungua madoido maalum ya meme!'
            : '💡 Use your coins to tip your favorite comedy creators or unlock meme gifts!'}
        </div>
      </div>
    </div>
  );
};
