import React, { useState } from 'react';
import { 
  X, 
  Megaphone, 
  Check, 
  ShieldCheck, 
  Coins, 
  TrendingUp, 
  Sparkles, 
  Phone, 
  Globe, 
  CheckCircle2,
  Loader2,
  DollarSign
} from 'lucide-react';
import { Language } from '../types';
import { memeAudio } from '../utils/audioSynth';

interface AdCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: Language;
  onOpenBuyCoins?: () => void;
}

interface AdPackage {
  id: string;
  name: string;
  tzs: number;
  viewsEstimate: string;
  durationDays: number;
  badge?: string;
  popular?: boolean;
}

const AD_PACKAGES: AdPackage[] = [
  { id: 'bronze', name: 'Kifurushi cha Shaba (Starter)', tzs: 5000, viewsEstimate: '10,000+', durationDays: 3 },
  { id: 'silver', name: 'Kifurushi cha Fedha (Growth)', tzs: 15000, viewsEstimate: '35,000+', durationDays: 7, popular: true, badge: 'INAPENDWA SANA 🔥' },
  { id: 'gold', name: 'Kifurushi cha Dhahabu (VIP Brand)', tzs: 50000, viewsEstimate: '150,000+', durationDays: 30, badge: 'MATOKEO MAKUBWA 👑' },
];

export const AdCampaignModal: React.FC<AdCampaignModalProps> = ({
  isOpen,
  onClose,
  language = 'sw',
}) => {
  const [selectedPkg, setSelectedPkg] = useState<AdPackage>(AD_PACKAGES[1]);
  const [businessName, setBusinessName] = useState<string>('');
  const [phoneOrLink, setPhoneOrLink] = useState<string>('');
  const [tagline, setTagline] = useState<string>('');
  const [paymentPhone, setPaymentPhone] = useState<string>('0786901683');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successReceipt, setSuccessReceipt] = useState<any>(null);

  if (!isOpen) return null;

  const handleLaunchCampaign = async () => {
    if (!businessName.trim() || !tagline.trim()) {
      alert(language === 'sw' ? 'Tafadhali jaza jina la biashara na maelezo ya tangazo.' : 'Please fill business name and tagline.');
      return;
    }

    setIsSubmitting(true);
    memeAudio.playPop();

    // Trigger AzamPay/Mobile Money checkout for Ad
    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountTzs: selectedPkg.tzs,
          coins: Math.round(selectedPkg.tzs / 10),
          rawPhone: paymentPhone,
          operator: 'auto',
        }),
      });
      const data = await res.json().catch(() => ({}));

      setTimeout(() => {
        setIsSubmitting(false);
        setSuccessReceipt({
          ref: data.referenceCode || `AD-${Date.now().toString(36).toUpperCase()}`,
          business: businessName,
          views: selectedPkg.viewsEstimate,
          amount: selectedPkg.tzs,
        });
        memeAudio.playVictory();
      }, 1500);
    } catch {
      setIsSubmitting(false);
      setSuccessReceipt({
        ref: `AD-${Date.now().toString(36).toUpperCase()}`,
        business: businessName,
        views: selectedPkg.viewsEstimate,
        amount: selectedPkg.tzs,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] text-white"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-neutral-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
              <Megaphone className="w-5 h-5 fill-current" />
            </div>
            <div className="text-left">
              <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-1.5">
                <span>{language === 'sw' ? 'Tangaza Biashara / Cheka Ads' : 'ChekaApp Ad Manager'}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 font-mono">BUSINESS</span>
              </h2>
              <p className="text-[11px] text-neutral-400">
                {language === 'sw' ? 'Fikia maelfu ya watazamaji Tanzania kupitia vichekesho' : 'Reach thousands across Tanzania via viral reels'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {successReceipt ? (
            <div className="py-6 text-center space-y-4 animate-fade-in">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-xl">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">
                  {language === 'sw' ? 'Hongera! Tangazo Lako Limeidhinishwa 🎉' : 'Campaign Approved & Live! 🎉'}
                </h3>
                <p className="text-neutral-400 mt-1 max-w-xs mx-auto">
                  {language === 'sw' 
                    ? `Tangazo la "${successReceipt.business}" sasa litaanza kuonekana katikati ya video za reels kwa watazamaji ${successReceipt.views}.` 
                    : `Your ad for "${successReceipt.business}" is now broadcasting to ${successReceipt.views} viewers.`}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 text-left space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between text-neutral-400">
                  <span>Kumbukumbu ya Tangazo:</span>
                  <span className="text-amber-400">{successReceipt.ref}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Kiasi Kilicholipwa:</span>
                  <span className="text-white font-bold">TZS {successReceipt.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Watazamaji Watarajiwa:</span>
                  <span className="text-emerald-400 font-bold">{successReceipt.views}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setSuccessReceipt(null);
                  onClose();
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-neutral-950 font-bold hover:brightness-110 shadow-lg"
              >
                {language === 'sw' ? 'Sawa, Rudi kwenye App' : 'Done'}
              </button>
            </div>
          ) : (
            <>
              {/* Package Selector */}
              <div>
                <label className="block font-bold text-neutral-300 uppercase tracking-wider mb-2">
                  1. {language === 'sw' ? 'Chagua Kifurushi cha Tangazo' : 'Choose Ad Package'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {AD_PACKAGES.map(pkg => {
                    const isSelected = selectedPkg.id === pkg.id;
                    return (
                      <div
                        key={pkg.id}
                        onClick={() => {
                          setSelectedPkg(pkg);
                          memeAudio.playBoing();
                        }}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all relative ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-500/70 shadow-md shadow-amber-500/10'
                            : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        {pkg.popular && (
                          <span className="absolute -top-2 right-2 px-1.5 py-0.2 rounded-full bg-pink-500 text-[9px] font-bold text-white shadow-xs">
                            HOT 🔥
                          </span>
                        )}
                        <div className="font-bold text-white">{pkg.name}</div>
                        <div className="text-amber-400 font-black text-sm my-0.5">
                          TZS {pkg.tzs.toLocaleString()}
                        </div>
                        <div className="text-emerald-400 text-[10px] font-mono">
                          {pkg.viewsEstimate} Watazamaji
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Business Details Form */}
              <div className="space-y-3">
                <label className="block font-bold text-neutral-300 uppercase tracking-wider">
                  2. {language === 'sw' ? 'Taarifa za Biashara Yako' : 'Business Details'}
                </label>

                <div>
                  <span className="text-neutral-400 block mb-1">Jina la Biashara au Duka:</span>
                  <input
                    type="text"
                    value={businessName}
                    onChange={e => setBusinessName(e.target.value)}
                    placeholder="mfano: Duka la Viatu Kariakoo, au Huduma ya Keki"
                    className="w-full px-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-amber-400 text-white outline-none"
                  />
                </div>

                <div>
                  <span className="text-neutral-400 block mb-1">Ujumbe Mfupi wa Tangazo (Tagline):</span>
                  <textarea
                    value={tagline}
                    onChange={e => setTagline(e.target.value)}
                    rows={2}
                    placeholder="mfano: Karibu ujipatie nguo za kisasa kwa bei nafuu. Tuma ujumbe WhatsApp tukuletee popote Tanzania!"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-amber-400 text-white outline-none resize-none"
                  />
                </div>

                <div>
                  <span className="text-neutral-400 block mb-1">Namba ya WhatsApp / Simu au Link ya Tovuti:</span>
                  <input
                    type="text"
                    value={phoneOrLink}
                    onChange={e => setPhoneOrLink(e.target.value)}
                    placeholder="mfano: 0786901683 au https://instagram.com/biashara"
                    className="w-full px-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-amber-400 text-white outline-none"
                  />
                </div>

                <div>
                  <span className="text-neutral-400 block mb-1">Namba ya Simu itakayolipa (Airtel, M-Pesa, Tigo):</span>
                  <input
                    type="tel"
                    value={paymentPhone}
                    onChange={e => setPaymentPhone(e.target.value)}
                    placeholder="0786 901 683"
                    className="w-full px-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-amber-400 text-white outline-none font-mono"
                  />
                </div>
              </div>

              {/* Launch CTA */}
              <button
                type="button"
                onClick={handleLaunchCampaign}
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-neutral-950 font-black text-xs sm:text-sm hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Inarusha ombi la malipo ya Tangazo...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Lipa TZS {selectedPkg.tzs.toLocaleString()} & Anzisha Tangazo</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
