import React from 'react';
import { 
  Megaphone, 
  ExternalLink, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Phone, 
  ShoppingBag,
  TrendingUp,
  X
} from 'lucide-react';
import { Language } from '../types';
import { memeAudio } from '../utils/audioSynth';

export interface SponsoredAdData {
  id: string;
  brandName: string;
  brandLogo: string;
  tagline: string;
  ctaText: string;
  ctaLink: string;
  category: string;
  views: number;
}

interface SponsoredAdCardProps {
  language?: Language;
  onOpenAdManager?: () => void;
}

const SAMPLE_ADS: SponsoredAdData[] = [
  {
    id: 'ad_azam',
    brandName: 'Azam Energy & Cola',
    brandLogo: '⚡',
    tagline: 'Pata Nguvu ya Kucheka na Kupiga Kazi! Kinywaji namba moja cha wajanja Dar es Salaam na Tanzania nzima.',
    ctaText: 'Pata Ofa ya Duka la Azam 🛒',
    ctaLink: 'https://azam.co.tz',
    category: 'Vinywaji & Nishati',
    views: 45200,
  },
  {
    id: 'ad_airtel',
    brandName: 'Airtel Supa Bando',
    brandLogo: '📶',
    tagline: 'Tazama Vichekesho vya ChekaApp bila wasiwasi wa MB! GB 10 kwa TZS 5,000 tu kwa wiki kupitia Airtel Money.',
    ctaText: 'Jiunge na Supa Bando Sasa 🚀',
    ctaLink: 'tel:*150*60#',
    category: 'Intaneti & Mawasiliano',
    views: 89400,
  },
  {
    id: 'ad_kariakoo',
    brandName: 'Kariakoo Smart Fashion',
    brandLogo: '🛍️',
    tagline: 'Nguo na viatu vya kijanja kwa bei ya jumla na rejareja. Usafirishaji mikoa yote ya Tanzania kwa basi!',
    ctaText: 'Agiza WhatsApp Papo Hapo 📲',
    ctaLink: 'https://wa.me/255786901683',
    category: 'Maduka & Mitindo',
    views: 31200,
  },
];

export const SponsoredAdCard: React.FC<SponsoredAdCardProps> = ({
  language = 'sw',
  onOpenAdManager,
}) => {
  const [currentAdIndex, setCurrentAdIndex] = React.useState<number>(0);
  const ad = SAMPLE_ADS[currentAdIndex];

  const handleNextAd = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentAdIndex(prev => (prev + 1) % SAMPLE_ADS.length);
    memeAudio.playPop();
  };

  const handleCtaClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    memeAudio.playVictory();
    if (ad.ctaLink.startsWith('http') || ad.ctaLink.startsWith('tel:')) {
      window.open(ad.ctaLink, '_blank');
    }
  };

  return (
    <div className="w-full h-[100dvh] snap-start shrink-0 relative flex flex-col justify-between overflow-hidden bg-gradient-to-b from-neutral-950 via-neutral-900 to-black select-none text-white p-5">
      {/* Top Banner Tag */}
      <div className="relative z-20 flex items-center justify-between pt-12 sm:pt-4">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold">
          <Megaphone className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>{language === 'sw' ? 'TANGAZO LA BIASHARA (SPONSORED)' : 'SPONSORED AD'}</span>
        </div>

        <button
          onClick={handleNextAd}
          className="px-2.5 py-1 rounded-full bg-neutral-800/80 hover:bg-neutral-700 text-[11px] text-neutral-300 transition-colors border border-neutral-700"
          title="Tangazo linalofuata"
        >
          {language === 'sw' ? 'Tangazo Jingine ↻' : 'Next Ad ↻'}
        </button>
      </div>

      {/* Main Ad Body Card */}
      <div className="relative z-20 my-auto space-y-4 max-w-sm mx-auto text-center animate-fade-in">
        {/* Brand Avatar */}
        <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-rose-500 p-1 shadow-2xl shadow-amber-500/20">
          <div className="w-full h-full rounded-[22px] bg-neutral-950 flex items-center justify-center text-4xl">
            {ad.brandLogo}
          </div>
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-800 text-[10px] text-neutral-400 font-mono mb-1.5">
            <span>{ad.category}</span>
            <span>•</span>
            <span>{(ad.views).toLocaleString()} Watazamaji</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center justify-center gap-1.5">
            <span>{ad.brandName}</span>
            <CheckCircle2 className="w-5 h-5 text-amber-400 fill-current" />
          </h2>
          <p className="text-xs sm:text-sm text-neutral-300 mt-2 leading-relaxed max-w-xs mx-auto">
            {ad.tagline}
          </p>
        </div>

        {/* Action CTA Button */}
        <button
          onClick={handleCtaClick}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-neutral-950 font-black text-sm hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2"
        >
          <span>{ad.ctaText}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Advertiser Callout */}
      <div className="relative z-20 pb-20 md:pb-6 text-center space-y-2">
        <div className="p-3 rounded-2xl bg-neutral-950/80 border border-neutral-800/80 max-w-sm mx-auto flex items-center justify-between gap-3 text-left">
          <div className="text-xs">
            <span className="font-bold text-amber-400 block">
              {language === 'sw' ? 'Unamiliki Biashara au Duka?' : 'Own a business in Tanzania?'}
            </span>
            <span className="text-[11px] text-neutral-400">
              {language === 'sw' ? 'Tangaza hapa ChekaApp kuanzia TZS 5,000 tu.' : 'Promote here from TZS 5,000 only.'}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenAdManager?.();
              memeAudio.playBoing();
            }}
            className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold whitespace-nowrap"
          >
            {language === 'sw' ? 'Tangaza 🚀' : 'Advertise'}
          </button>
        </div>
      </div>
    </div>
  );
};
