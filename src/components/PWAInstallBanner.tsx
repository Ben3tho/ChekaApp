import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallBannerProps {
  onOpenModal: () => void;
  language: 'sw' | 'en';
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({ onOpenModal, language }) => {
  const { isInstalled, canPromptDirectly, triggerInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  // Check sessionStorage so it doesn't annoy if dismissed in this session
  useEffect(() => {
    if (sessionStorage.getItem('cheka_pwa_dismissed') === 'true') {
      setDismissed(true);
    }
  }, []);

  if (isInstalled || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('cheka_pwa_dismissed', 'true');
  };

  const handleAction = async () => {
    if (canPromptDirectly) {
      const installed = await triggerInstall();
      if (!installed) {
        onOpenModal();
      }
    } else {
      onOpenModal();
    }
  };

  return (
    <div className="fixed top-14 left-0 right-0 z-40 px-3 py-2 pointer-events-none animate-slide-down">
      <div className="max-w-md mx-auto bg-gradient-to-r from-neutral-900/95 via-neutral-900/95 to-neutral-950/95 backdrop-blur-md border border-amber-500/40 rounded-2xl p-3 shadow-2xl shadow-amber-500/10 pointer-events-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-pink-500 p-0.5 flex-shrink-0 shadow-md shadow-pink-500/20">
            <img src="/pwa-192x192.png" alt="Cheka" className="w-full h-full object-cover rounded-[10px]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-xs truncate">ChekaApp</span>
              <span className="text-[10px] font-semibold bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/30">
                APK
              </span>
            </div>
            <p className="text-[11px] text-neutral-300 truncate">
              {language === 'sw' ? 'Sakinisha kama App kwenye simu' : 'Install as native app on device'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={handleAction}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-400 hover:to-pink-400 text-neutral-950 font-extrabold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5 text-neutral-950" />
            <span>{language === 'sw' ? 'Weka Sasa' : 'Install'}</span>
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
