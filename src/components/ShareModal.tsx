import React, { useState } from 'react';
import { X, Copy, Check, MessageCircle, Share2, Sparkles } from 'lucide-react';
import { MemeVideo, Language } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: MemeVideo;
  language: Language;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  video,
  language
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareUrl = window.location.href;
  const shareText =
    language === 'sw'
      ? `Aisee cheki hii meme ya "${video.title}" kwenye Cheka Reels! 😂🔥: `
      : `Check out this hilarious meme "${video.title}" on Cheka Reels! 😂: `;

  const handleCopy = () => {
    navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareToWhatsApp = () => {
    const fullText = encodeURIComponent(`${shareText} ${shareUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${fullText}`, '_blank');
  };

  const shareToTwitter = () => {
    const fullText = encodeURIComponent(`${shareText}\n${video.tags.join(' ')}\n${shareUrl}`);
    window.open(`https://twitter.com/intent/tweet?text=${fullText}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fade-in">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl bg-neutral-900 border border-neutral-800 p-5 shadow-2xl z-10 text-neutral-100">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-sm">
              {language === 'sw' ? 'Sambaza Kicheko' : 'Share the Laugh'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4">
          <p className="text-xs text-neutral-400 line-clamp-2 mb-4 bg-neutral-800/60 p-2.5 rounded-lg border border-neutral-800">
            "{video.caption}"
          </p>

          {/* Social buttons */}
          <div className="grid grid-cols-2 gap-2.5 mb-4">
            <button
              onClick={shareToWhatsApp}
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={shareToTwitter}
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 border border-sky-500/30 text-xs font-semibold transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>X (Twitter)</span>
            </button>
          </div>

          {/* Copy link bar */}
          <div className="flex items-center gap-2 bg-neutral-950 p-1.5 rounded-xl border border-neutral-800">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="bg-transparent text-[11px] text-neutral-400 font-mono px-2.5 flex-1 outline-none truncate"
            />
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-medium transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">
                    {language === 'sw' ? 'Imenakiliwa' : 'Copied'}
                  </span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{language === 'sw' ? 'Nakili' : 'Copy'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="text-[11px] text-neutral-500 text-center">
          {language === 'sw'
            ? 'Kila unaposambaza, algorithm inampa mtayarishaji alama za ziada!'
            : 'Sharing boosts this creator in the recommendation algorithm!'}
        </div>
      </div>
    </div>
  );
};
