import React, { useState } from 'react';
import { X, Coins, Plus, Check } from 'lucide-react';
import { GiftItem, MemeVideo, Language } from '../types';
import { memeAudio } from '../utils/audioSynth';

interface GiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: MemeVideo;
  gifts: GiftItem[];
  userCoins: number;
  onSendGift: (gift: GiftItem) => void;
  onAddFreeCoins: () => void;
  language: Language;
}

export const GiftModal: React.FC<GiftModalProps> = ({
  isOpen,
  onClose,
  video,
  gifts,
  userCoins,
  onSendGift,
  onAddFreeCoins,
  language
}) => {
  const [selectedGift, setSelectedGift] = useState<GiftItem>(gifts[0]);
  const [sentSuccess, setSentSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSend = () => {
    if (userCoins < selectedGift.coinPrice) {
      memeAudio.playSadTrombone();
      return;
    }
    memeAudio.playLaugh();
    onSendGift(selectedGift);
    setSentSuccess(`${selectedGift.name} imepelekwa kwa ${video.creator.name}!`);
    setTimeout(() => {
      setSentSuccess(null);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fade-in">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl bg-neutral-900 border border-neutral-800 p-5 shadow-2xl z-10 text-neutral-100">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm">
              {language === 'sw' ? 'Tuma Zawadi ya Kicheko' : 'Send Creator Gift'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Balance Header */}
        <div className="flex items-center justify-between bg-neutral-950 p-3 rounded-xl my-3 border border-neutral-800">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold text-sm">🪙 {userCoins}</span>
            <span className="text-xs text-neutral-400">
              {language === 'sw' ? 'Sarafu zako' : 'Coins balance'}
            </span>
          </div>
          <button
            onClick={() => {
              onAddFreeCoins();
              memeAudio.playBoing();
            }}
            className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 hover:text-amber-300 bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/20"
          >
            <Plus className="w-3 h-3" />
            <span>{language === 'sw' ? '+50 Bure' : '+50 Free'}</span>
          </button>
        </div>

        {/* Gift Grid */}
        <div className="grid grid-cols-3 gap-2.5 my-3">
          {gifts.map(g => {
            const isSelected = selectedGift.id === g.id;
            const canAfford = userCoins >= g.coinPrice;
            return (
              <button
                key={g.id}
                onClick={() => {
                  setSelectedGift(g);
                  memeAudio.playBoing();
                }}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/10 shadow-sm'
                    : 'border-neutral-800 bg-neutral-800/40 hover:bg-neutral-800'
                } ${!canAfford ? 'opacity-60' : ''}`}
              >
                <span className="text-2xl mb-1">{g.icon}</span>
                <span className="text-[11px] font-medium text-neutral-200 truncate w-full">
                  {language === 'sw' ? g.swahiliName : g.name}
                </span>
                <span className="text-[10px] text-amber-400 font-mono mt-0.5">
                  🪙 {g.coinPrice}
                </span>
              </button>
            );
          })}
        </div>

        {sentSuccess ? (
          <div className="flex items-center justify-center gap-2 p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-semibold">
            <Check className="w-4 h-4" />
            <span>{sentSuccess}</span>
          </div>
        ) : (
          <button
            onClick={handleSend}
            disabled={userCoins < selectedGift.coinPrice}
            className="w-full py-2.5 rounded-xl bg-amber-500 text-neutral-950 font-bold text-xs hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 transition-colors shadow-md mt-2 flex items-center justify-center gap-1.5"
          >
            <span>{language === 'sw' ? 'Tuma Sasa' : 'Send Gift'}</span>
            <span className="font-mono">({selectedGift.coinPrice} Coins)</span>
          </button>
        )}
      </div>
    </div>
  );
};
