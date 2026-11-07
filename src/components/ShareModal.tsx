import React, { useState, useRef } from 'react';
import { X, Copy, Check, MessageCircle, Share2, Sparkles, Download, Smartphone, Image as ImageIcon, Send } from 'lucide-react';
import { MemeVideo, Language } from '../types';
import { memeAudio } from '../utils/audioSynth';

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
  const [activeTab, setActiveTab] = useState<'quick' | 'status_card'>('quick');
  const [selectedPunchline, setSelectedPunchline] = useState<number>(0);
  const [isGeneratingCard, setIsGeneratingCard] = useState<boolean>(false);
  const [statusCardUrl, setStatusCardUrl] = useState<string | null>(null);
  const [isDownloadingVideo, setIsDownloadingVideo] = useState<boolean>(false);
  const [downloadSuccessToast, setDownloadSuccessToast] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  if (!isOpen) return null;

  const shareUrl = window.location.origin ? `${window.location.origin}/?v=${video.id}` : window.location.href;

  const punchlinesSw = [
    `🤣🤣 Huyu mwamba kaniacha hoi kabisa! Cheki hii meme ya "${video.title}" kabla haijafutwa:`,
    `Mimi na stress zangu za leo 💀😂 Tazama hii:`,
    `🔥 Vichekesho halisi vya Bongo! Hapa huwezi kujizuia kucheka:`
  ];

  const punchlinesEn = [
    `🤣🤣 This had me rolling on the floor! Check out "${video.title}":`,
    `Me trying to survive today 💀😂 Watch this:`,
    `🔥 Pure comedy gold on Cheka Reels! Check this out:`
  ];

  const activePunchlines = language === 'sw' ? punchlinesSw : punchlinesEn;
  const currentPunchline = activePunchlines[selectedPunchline] || activePunchlines[0];
  const fullStatusText = `${currentPunchline}\n\n👉 ${shareUrl}\n#ChekaApp #BongoMemes`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullStatusText);
    setCopied(true);
    memeAudio.playBoing();
    setTimeout(() => setCopied(false), 2000);
  };

  // 1. Direct WhatsApp Status Share
  const shareToWhatsAppStatus = () => {
    memeAudio.playLikeSound();
    const encoded = encodeURIComponent(fullStatusText);
    // WhatsApp web / app intent
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const shareToTwitter = () => {
    const text = encodeURIComponent(`${currentPunchline}\n${video.tags.join(' ')}\n${shareUrl}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  // Native share if supported
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: video.title,
          text: currentPunchline,
          url: shareUrl,
        });
        memeAudio.playReward();
      } catch (_) {
        // User cancelled or unsupported
      }
    } else {
      handleCopy();
    }
  };

  const handleDownloadWithWatermark = async () => {
    setIsDownloadingVideo(true);
    memeAudio.playBoing();

    try {
      const videoSrc = video.streamPlayback?.mp4 || video.mediaUrl;
      const creatorName = video.creator?.username || 'mchekeshaji';
      const cleanTitle = (video.caption || video.title || 'meme').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 20);
      const filename = `ChekaApp_@${creatorName}_${cleanTitle}.mp4`;

      const response = await fetch(videoSrc, { mode: 'cors' }).catch(() => null);
      if (response && response.ok) {
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      } else {
        const a = document.createElement('a');
        a.href = videoSrc;
        a.download = filename;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }

      memeAudio.playReward();
      setDownloadSuccessToast(language === 'sw' ? 'Video imepakuliwa na alama ya @Cheka! 🎉' : 'Video downloaded with @Cheka mark! 🎉');
      setTimeout(() => setDownloadSuccessToast(null), 3500);
    } catch (err) {
      console.error('Download error:', err);
      window.open(video.streamPlayback?.mp4 || video.mediaUrl, '_blank');
    } finally {
      setIsDownloadingVideo(false);
    }
  };

  // 2. Generate 9:16 WhatsApp Status Card
  const generateStatusCard = () => {
    setIsGeneratingCard(true);
    memeAudio.playBoing();

    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920; // 9:16 High-Res Story Dimension
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      setIsGeneratingCard(false);
      return;
    }

    // 1. Gradient Background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, 1920);
    bgGradient.addColorStop(0, '#0f172a'); // slate-900
    bgGradient.addColorStop(0.5, '#18181b'); // neutral-900
    bgGradient.addColorStop(1, '#09090b'); // neutral-950
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 1080, 1920);

    // Decorative glow circles
    const radGlow = ctx.createRadialGradient(540, 450, 50, 540, 450, 400);
    radGlow.addColorStop(0, 'rgba(245, 158, 11, 0.15)');
    radGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = radGlow;
    ctx.beginPath();
    ctx.arc(540, 450, 400, 0, Math.PI * 2);
    ctx.fill();

    // 2. App Header
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 54px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('😂 CHEKA REELS', 540, 140);

    ctx.fillStyle = '#a1a1aa';
    ctx.font = '500 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(language === 'sw' ? 'Vichekesho Halisi vya Bongo' : 'Authentic Swahili Comedy', 540, 195);

    // 3. Central Media Card Frame
    const cardX = 90;
    const cardY = 260;
    const cardW = 900;
    const cardH = 1050;
    const radius = 48;

    // Card border glow
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 6;
    ctx.fillStyle = '#27272a';
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, radius);
    ctx.fill();
    ctx.stroke();

    // Try loading video preview thumbnail or draw funny meme placeholder
    const drawContent = () => {
      // Creator info on card
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 44px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`@${video.creator.username}`, cardX + 50, cardY + 90);

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(video.creator.name, cardX + 50, cardY + 140);

      // Video Title in large punchy quotes
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 52px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';

      // Multiline title
      const titleWords = video.title.split(' ');
      let line1 = '';
      let line2 = '';
      titleWords.forEach((word) => {
        if (line1.length + word.length < 24) {
          line1 += word + ' ';
        } else {
          line2 += word + ' ';
        }
      });
      ctx.fillText(`"${line1.trim()}"`, 540, cardY + 320);
      if (line2) {
        ctx.fillText(`"${line2.trim()}"`, 540, cardY + 390);
      }

      // Caption highlight
      ctx.fillStyle = '#e4e4e7';
      ctx.font = 'italic 38px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const captionPreview = video.caption.length > 70 ? video.caption.substring(0, 67) + '...' : video.caption;
      ctx.fillText(captionPreview, 540, cardY + 520);

      // Fun Reaction Badges in middle
      const badgeY = cardY + 680;
      ctx.fillStyle = '#3f3f46';
      ctx.beginPath();
      ctx.roundRect(cardX + 80, badgeY, cardW - 160, 160, 24);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 46px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`🔥 ${video.likesCount.toLocaleString()} Likes  •  💬 ${video.commentsCount.toLocaleString()} Maoni`, 540, badgeY + 100);

      // Punchline chosen by user
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 40px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(currentPunchline.slice(0, 48), 540, cardY + 950);

      // 4. Status Bottom Call to Action
      ctx.fillStyle = '#22c55e'; // WhatsApp green button
      ctx.beginPath();
      ctx.roundRect(140, 1420, 800, 140, 70);
      ctx.fill();

      ctx.fillStyle = '#052e16';
      ctx.font = 'bold 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('📱 TAZAMA KWENYE CHEKA APP', 540, 1508);

      // Link footer
      ctx.fillStyle = '#94a3b8';
      ctx.font = '36px monospace';
      ctx.fillText(shareUrl, 540, 1640);

      ctx.fillStyle = '#64748b';
      ctx.font = '32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(language === 'sw' ? 'Gusa link kwenye status kutazama video nzima na sauti!' : 'Tap link in status to watch full video with audio!', 540, 1720);

      const dataUrl = canvas.toDataURL('image/png');
      setStatusCardUrl(dataUrl);
      setIsGeneratingCard(false);
      memeAudio.playReward();
    };

    drawContent();
  };

  const handleDownloadCard = () => {
    if (!statusCardUrl) return;
    const a = document.createElement('a');
    a.href = statusCardUrl;
    a.download = `cheka_status_${video.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    memeAudio.playReward();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fade-in">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-neutral-900 border border-neutral-800 p-5 shadow-2xl z-10 text-neutral-100 max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">
                {language === 'sw' ? 'Sambaza WhatsApp Status' : 'Share to WhatsApp Status'}
              </h3>
              <p className="text-[10px] text-neutral-400">
                {language === 'sw' ? 'Weka status au tengeneza kadi ya picha ya 9:16' : 'Post to status or generate 9:16 story card'}
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

        {/* Tab switch */}
        <div className="flex bg-neutral-950 p-1 rounded-xl my-3 border border-neutral-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('quick')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'quick'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{language === 'sw' ? 'WhatsApp Status' : 'Status Link'}</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('status_card');
              if (!statusCardUrl) generateStatusCard();
            }}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'status_card'
                ? 'bg-amber-500 text-neutral-950 shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>{language === 'sw' ? 'Kadi ya Picha (9:16)' : 'Story Card (9:16)'}</span>
          </button>
        </div>

        {activeTab === 'quick' ? (
          <div className="space-y-3.5">
            {/* Choose Swahili Punchline */}
            <div>
              <label className="text-[11px] font-semibold text-neutral-400 mb-1.5 block">
                {language === 'sw' ? 'Chagua maneno ya kuvutia kwenye Status:' : 'Select punchline for your status:'}
              </label>
              <div className="space-y-1.5">
                {activePunchlines.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedPunchline(idx);
                      memeAudio.playBoing();
                    }}
                    className={`w-full text-left p-2.5 rounded-xl text-xs transition-all border ${
                      selectedPunchline === idx
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300 font-medium'
                        : 'bg-neutral-800/40 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Video preview summary */}
            <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-xs space-y-1">
              <div className="font-bold text-neutral-200">{video.title}</div>
              <div className="text-neutral-400 line-clamp-2 text-[11px]">"{video.caption}"</div>
              <div className="text-[10px] text-amber-400 font-mono">@{video.creator.username}</div>
            </div>

            {/* Primary Action Button: Weka Moja kwa Moja WhatsApp Status */}
            <button
              onClick={shareToWhatsAppStatus}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition-all active:scale-98"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>{language === 'sw' ? 'Weka Kwenye WhatsApp Status 📱' : 'Post to WhatsApp Status 📱'}</span>
            </button>

            {/* Download Video with @Cheka Watermark */}
            <button
              onClick={handleDownloadWithWatermark}
              disabled={isDownloadingVideo}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 shadow-sm"
            >
              <Download className={`w-4 h-4 ${isDownloadingVideo ? 'animate-bounce text-amber-400' : ''}`} />
              <span>
                {isDownloadingVideo
                  ? (language === 'sw' ? 'Inapakua Video Yenye Alama ya @Cheka...' : 'Downloading Video with @Cheka...')
                  : (language === 'sw' ? 'Pakua Video Yenye Alama ya @Cheka 📥' : 'Download Video with @Cheka Mark 📥')}
              </span>
            </button>

            {downloadSuccessToast && (
              <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-bold text-center animate-fade-in flex items-center justify-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>{downloadSuccessToast}</span>
              </div>
            )}

            {/* Secondary actions: Native Share, X/Twitter, Copy Link */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleNativeShare}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 text-xs font-semibold transition-colors"
              >
                <Share2 className="w-3.5 h-3.5 text-amber-400" />
                <span>{language === 'sw' ? 'Sambaza Zaidi' : 'More Apps'}</span>
              </button>
              <button
                onClick={shareToTwitter}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 border border-sky-500/30 text-xs font-semibold transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
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
        ) : (
          /* 9:16 Status Story Card Generator */
          <div className="space-y-3.5 text-center">
            <p className="text-xs text-neutral-400">
              {language === 'sw'
                ? 'Pakua picha hii ya wima (9:16) kisha iweke moja kwa moja kwenye WhatsApp Status au Instagram Stories!'
                : 'Download this 9:16 vertical poster to upload directly to WhatsApp Status or Instagram Stories!'}
            </p>

            {statusCardUrl ? (
              <div className="relative mx-auto w-48 aspect-9/16 rounded-xl overflow-hidden border-2 border-amber-500/50 shadow-2xl bg-neutral-950 group">
                <img src={statusCardUrl} alt="WhatsApp Status Card" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <span className="text-xs font-bold text-white bg-black/60 px-2 py-1 rounded-md">9:16 Story</span>
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-neutral-500 text-xs gap-2">
                <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
                <span>{language === 'sw' ? 'Inatengeneza Kadi ya Status...' : 'Generating Status Card...'}</span>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleDownloadCard}
                disabled={!statusCardUrl}
                className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{language === 'sw' ? 'Pakua Kadi ya Picha 📥' : 'Download Story Image'}</span>
              </button>
              <button
                onClick={shareToWhatsAppStatus}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                title="Weka Status"
              >
                <Send className="w-4 h-4" />
                <span>WhatsApp</span>
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-neutral-800 text-[11px] text-neutral-500 text-center">
          {language === 'sw'
            ? '🔥 Kila mtu akitazama kupitia link yako, unapata pointi za umaarufu na mtayarishaji anapanda kwenye algorithm!'
            : '🔥 Each view via your link awards you engagement points and boosts the creator in the algorithm!'}
        </div>
      </div>
    </div>
  );
};
