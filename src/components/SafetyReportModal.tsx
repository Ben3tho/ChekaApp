import React, { useState } from 'react';
import { X, ShieldAlert, Check, Flag, UserX } from 'lucide-react';
import { MemeVideo, Language } from '../types';

interface SafetyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: MemeVideo;
  onReport: (reason: string, blockUser: boolean) => void;
  language: Language;
}

export const SafetyReportModal: React.FC<SafetyReportModalProps> = ({
  isOpen,
  onClose,
  video,
  onReport,
  language
}) => {
  const [selectedReason, setSelectedReason] = useState('hate_speech');
  const [blockUser, setBlockUser] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const reasons = [
    {
      id: 'hate_speech',
      label: language === 'sw' ? 'Matusi au Uchochezi (Hate Speech)' : 'Hate speech or harassment'
    },
    {
      id: 'inappropriate',
      label: language === 'sw' ? 'Maudhui yasiyofaa / Picha chafu' : 'Inappropriate or adult content'
    },
    {
      id: 'copyright',
      label: language === 'sw' ? 'Ukiukwaji wa Hakimiliki (Copyright)' : 'Copyright infringement'
    },
    {
      id: 'spam',
      label: language === 'sw' ? 'Ulaghai au Matangazo ya Uongo (Spam)' : 'Spam or deceptive content'
    },
    {
      id: 'dangerous',
      label: language === 'sw' ? 'Vitendo vya hatari au vurugu' : 'Dangerous acts or violence'
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onReport(selectedReason, blockUser);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fade-in">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl bg-neutral-900 border border-neutral-800 p-5 shadow-2xl z-10 text-neutral-100">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2 text-rose-400">
            <ShieldAlert className="w-4 h-4" />
            <h3 className="font-bold text-sm text-neutral-100">
              {language === 'sw' ? 'Ripoti Maudhui / Usalama' : 'Report & Safety Center'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-2">
              <Check className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-neutral-100">
              {language === 'sw' ? 'Ripoti Imepokelewa' : 'Report Received'}
            </p>
            <p className="text-xs text-neutral-400">
              {language === 'sw'
                ? 'Timu yetu ya usalama inakagua video hii. Asante kwa kuweka Cheka kuwa salama.'
                : 'Our safety team is reviewing this reel. Thank you for keeping Cheka safe.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="py-3 space-y-4">
            <p className="text-xs text-neutral-400">
              {language === 'sw'
                ? 'Chagua sababu ya kuripoti meme hii ya'
                : 'Select the reason for reporting this reel by'}{' '}
              <span className="text-neutral-200 font-semibold">
                @{video.creator.username}
              </span>
              :
            </p>

            <div className="space-y-1.5">
              {reasons.map(r => (
                <label
                  key={r.id}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                    selectedReason === r.id
                      ? 'bg-rose-500/10 border-rose-500/40 text-neutral-100'
                      : 'bg-neutral-800/40 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                  }`}
                >
                  <input
                    type="radio"
                    name="report_reason"
                    value={r.id}
                    checked={selectedReason === r.id}
                    onChange={() => setSelectedReason(r.id)}
                    className="accent-rose-500"
                  />
                  <span>{r.label}</span>
                </label>
              ))}
            </div>

            {/* Block creator checkbox */}
            <div className="pt-2 border-t border-neutral-800">
              <label className="flex items-center gap-2.5 p-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={blockUser}
                  onChange={e => setBlockUser(e.target.checked)}
                  className="accent-rose-500 rounded"
                />
                <div className="flex items-center gap-1.5">
                  <UserX className="w-3.5 h-3.5 text-neutral-400" />
                  <span>
                    {language === 'sw'
                      ? `Zuia (Block) @${video.creator.username}`
                      : `Block @${video.creator.username}`}
                  </span>
                </div>
              </label>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 rounded-xl bg-neutral-800 text-neutral-300 font-medium text-xs hover:bg-neutral-700 transition-colors"
              >
                {language === 'sw' ? 'Ghairi' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{language === 'sw' ? 'Wasilisha Ripoti' : 'Submit Report'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
