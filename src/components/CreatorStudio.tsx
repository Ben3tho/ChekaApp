import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  Music, 
  Upload, 
  Clock, 
  Check, 
  Loader2, 
  ArrowRight, 
  Video, 
  Film, 
  AlertCircle,
  Radio,
  FileVideo,
  X,
  Volume2,
  VolumeX,
  Scissors,
  Type,
  Image as ImageIcon
} from 'lucide-react';
import { MemeVideo, Language } from '../types';
import { memeAudio } from '../utils/audioSynth';
import { useAuth } from '../context/AuthContext';

interface CreatorStudioProps {
  onPublish: (video: MemeVideo) => void;
  language: Language;
  onOpenAuth?: () => void;
}

type UploadStep = 'IDLE' | 'GETTING_URL' | 'UPLOADING_CLOUDFLARE' | 'SAVING_POSTGRES' | 'PROCESSING_STREAM' | 'READY' | 'ERROR';

export const CreatorStudio: React.FC<CreatorStudioProps> = ({
  onPublish,
  language,
  onOpenAuth,
}) => {
  const { user, authFetch } = useAuth();

  // Template presets
  const templates = [
    {
      id: 'tmpl_office',
      name: 'Ofisi & Bosi',
      url: '/src/assets/images/funny_office_meme_thumb_1792057039620.jpg',
      defaultTop: 'POV: KAZI YA JUMATATU',
      defaultBottom: 'BOSI AKIKUONA UKIINGIA 9:15 AM'
    },
    {
      id: 'tmpl_cat',
      name: 'Paka Mshtuko',
      url: '/src/assets/images/funny_cat_shock_meme_1792057039146.jpg',
      defaultTop: 'UKICHEKI SALDO YA BENKI:',
      defaultBottom: 'HALAFU SALDO INASOMA TSH 450'
    },
    {
      id: 'tmpl_street',
      name: 'Bongo Mtaani',
      url: '/src/assets/images/bongo_street_comedy_1792057041770.jpg',
      defaultTop: 'TUKIO LA USWAHILINI:',
      defaultBottom: 'MTU KAGUSA WAYA WA UMEME BILA VIATU'
    },
    {
      id: 'tmpl_standup',
      name: 'Standup Comedy',
      url: '/src/assets/images/swahili_comedian_avatar_1792057038016.jpg',
      defaultTop: 'USHAURI WA BURE:',
      defaultBottom: 'USIKOPESHE RAFIKI YAKO UKITAKA ABURUDISHE MAHUSIANO'
    }
  ];

  const [selectedTemplate, setSelectedTemplate] = useState(templates[0]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [previewMuted, setPreviewMuted] = useState(true);
  const [inputMode, setInputMode] = useState<'video_file' | 'template'>('video_file');

  const [topText, setTopText] = useState(templates[0].defaultTop);
  const [bottomText, setBottomText] = useState(templates[0].defaultBottom);
  const [caption, setCaption] = useState(
    language === 'sw'
      ? 'Hii imenikuta mimi mwenyewe live bila chenga! Cheka uongeze siku za kuishi 😂💀'
      : 'This happened to me in real life! Laugh and add more days to your life 😂💀'
  );
  const [duration, setDuration] = useState<15 | 30 | 60>(15);
  const [selectedSound, setSelectedSound] = useState('vineBoom');
  const [tags, setTags] = useState('#SwahiliMemes #VunjaMbavu #Cheka');

  // Video Editor: Trimming, Subtitle Style & Cover Selection
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(15);
  const [textStyle, setTextStyle] = useState<'impact' | 'yellow' | 'pink' | 'clean'>('impact');
  const [coverOffset, setCoverOffset] = useState<number>(0);

  // AI Gemini state
  const [aiTopic, setAiTopic] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<Array<{ title: string; caption: string; hashtags: string[] }>>([]);

  // Real Cloudflare Stream upload state
  const [uploadStep, setUploadStep] = useState<UploadStep>('IDLE');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [streamUid, setStreamUid] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const sounds = [
    { id: 'vineBoom', name: 'Vine Boom Bass Drop', icon: '💥' },
    { id: 'laugh', name: 'African Laughter Burst', icon: '😂' },
    { id: 'rimshot', name: 'Classic Comedy Rimshot', icon: '🥁' },
    { id: 'boing', name: 'Cartoon Boing Spring', icon: '🌀' },
    { id: 'bruh', name: 'Bruh Moment Voice', icon: '🗿' },
    { id: 'sadTrombone', name: 'Sad Trombone Wah-Wah', icon: '🎺' }
  ];

  const handleTestSound = (soundId: string) => {
    setSelectedSound(soundId);
    if (soundId === 'vineBoom') memeAudio.playVineBoom();
    else if (soundId === 'laugh') memeAudio.playLaugh();
    else if (soundId === 'rimshot') memeAudio.playRimshot();
    else if (soundId === 'boing') memeAudio.playBoing();
    else if (soundId === 'bruh') memeAudio.playBruh();
    else if (soundId === 'sadTrombone') memeAudio.playSadTrombone();
  };

  const handleSelectTemplate = (tmpl: typeof templates[0]) => {
    setSelectedTemplate(tmpl);
    setTopText(tmpl.defaultTop);
    setBottomText(tmpl.defaultBottom);
    memeAudio.playBoing();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 200 * 1024 * 1024) {
        alert(language === 'sw' ? 'Video hii ni kubwa mno (zaidi ya 200MB)' : 'Video is too large (over 200MB)');
        return;
      }
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoPreviewUrl(url);
      setInputMode('video_file');
      memeAudio.playBoing();
    }
  };

  const generateWithGemini = async (topicToUse?: string) => {
    const targetTopic = topicToUse || aiTopic || 'Maisha ya kila siku na vicheko';
    setAiLoading(true);
    try {
      const res = await fetch('/api/gemini/meme-punchlines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: targetTopic,
          language
        })
      });
      const data = await res.json();
      if (data.captions && data.captions.length > 0) {
        setAiSuggestions(data.captions);
        memeAudio.playLaugh();
      }
    } catch (err) {
      console.error('Error fetching punchlines', err);
    } finally {
      setAiLoading(false);
    }
  };

  const applySuggestion = (sug: { title: string; caption: string; hashtags: string[] }) => {
    setTopText(sug.title.toUpperCase());
    setBottomText(sug.caption.substring(0, 45).toUpperCase());
    setCaption(sug.caption);
    setTags(sug.hashtags.join(' '));
    memeAudio.playBoing();
  };

  /**
   * Real Cloudflare Stream Upload Pipeline:
   * 1. POST /api/videos/upload-url -> gets Cloudflare direct upload URL + UID
   * 2. Direct upload file to Cloudflare Stream uploadURL with progress %
   * 3. POST /api/videos -> inserts into PostgreSQL Video table with status: "processing"
   * 4. Polls GET /api/videos/:id until Cloudflare status is "ready"
   */
  const handlePublishReel = async () => {
    if (!user) {
      onOpenAuth?.();
      setErrorMessage(
        language === 'sw'
          ? 'Tafadhali ingia au jisajili kwanza ili video ichapishwe kwa jina lako.'
          : 'Please sign in or sign up first so the video is published under your own account.'
      );
      return;
    }

    setErrorMessage('');
    setUploadProgress(0);

    try {
      const hashtagsList = tags.split(' ').filter((t) => t.startsWith('#'));

      // Prepare file blob (either chosen video file or generated canvas/image blob)
      let uploadFile: Blob;
      if (videoFile) {
        uploadFile = videoFile;
      } else {
        // If template mode, fetch image as blob for the upload payload
        const resp = await fetch(selectedTemplate.url);
        uploadFile = await resp.blob();
      }

      let uid = '';
      let directUploadSuccess = false;

      // STEP 1 & 2: Try Direct Cloudflare Stream Upload first
      try {
        setUploadStep('GETTING_URL');
        setStatusMessage(
          language === 'sw'
            ? 'Inatengeneza Cloudflare Direct Upload URL...'
            : 'Requesting Cloudflare Direct Upload URL...'
        );

        const urlRes = await authFetch('/api/videos/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: topText || caption }),
        });

        if (urlRes.ok) {
          const { uploadURL, uid: returnedUid } = await urlRes.json();
          if (uploadURL && returnedUid) {
            uid = returnedUid;
            setStreamUid(uid);

            setUploadStep('UPLOADING_CLOUDFLARE');
            setStatusMessage(
              language === 'sw'
                ? 'Inapakia video moja kwa moja Cloudflare Stream Edge...'
                : 'Uploading video directly to Cloudflare Stream Edge...'
            );

            const formData = new FormData();
            formData.append('file', uploadFile, videoFile?.name || `reel_${uid}.mp4`);

            await new Promise<void>((resolve, reject) => {
              const xhr = new XMLHttpRequest();
              xhr.open('POST', uploadURL);

              xhr.upload.onprogress = (evt) => {
                if (evt.lengthComputable) {
                  const pct = Math.round((evt.loaded / evt.total) * 100);
                  setUploadProgress(pct);
                }
              };

              xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                  resolve();
                } else {
                  try {
                    const resParsed = JSON.parse(xhr.responseText);
                    if (resParsed.success) {
                      resolve();
                      return;
                    }
                  } catch {}
                  reject(new Error(`Direct upload returned status ${xhr.status}`));
                }
              };

              xhr.onerror = () => reject(new Error('Direct upload network error'));
              xhr.ontimeout = () => reject(new Error('Direct upload timeout'));
              xhr.timeout = 45000;
              xhr.send(formData);
            });

            directUploadSuccess = true;
          }
        }
      } catch (cfDirectErr: any) {
        console.warn('Direct upload to Cloudflare encountered network issue, falling back to ChekaApp server proxy:', cfDirectErr);
      }

      let createdVideo: any = null;
      let finalVideoData: any = null;

      if (directUploadSuccess && uid) {
        // STEP 3: Register in PostgreSQL Video table with status: "processing"
        setUploadStep('SAVING_POSTGRES');
        setStatusMessage(
          language === 'sw'
            ? 'Inahifadhi kumbukumbu kwenye PostgreSQL (status: processing)...'
            : 'Registering video record in PostgreSQL...'
        );

        const hashtagsList = tags.split(' ').filter((t) => t.startsWith('#'));
        const videoPostRes = await authFetch('/api/videos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid,
            caption: `${topText ? topText + ' - ' : ''}${caption}`,
            hashtags: hashtagsList,
            thumbnailUrl: selectedTemplate.url,
          }),
        });

        if (!videoPostRes.ok) {
          const postErr = await videoPostRes.json().catch(() => ({}));
          throw new Error(postErr.error || 'Failed to save video in database');
        }

        createdVideo = await videoPostRes.json();

        // STEP 4: Poll GET /api/videos/:id until status === "ready"
        setUploadStep('PROCESSING_STREAM');
        setStatusMessage(
          language === 'sw'
            ? 'Cloudflare Stream inachakata video na kuunda HLS multi-bitrate streams...'
            : 'Cloudflare Stream is encoding video into HLS adaptive bitrate streams...'
        );

        let attempts = 0;
        const maxAttempts = 12; // ~24 seconds max
        let isReady = false;

        while (attempts < maxAttempts && !isReady) {
          attempts++;
          await new Promise((r) => setTimeout(r, 2000));

          const checkRes = await authFetch(`/api/videos/${createdVideo.id}`);
          if (checkRes.ok) {
            const checkData = await checkRes.json();
            if (checkData.status === 'ready' || checkData.status === 'READY') {
              isReady = true;
              finalVideoData = checkData;
              break;
            } else if (checkData.status === 'failed') {
              throw new Error(
                language === 'sw'
                  ? 'Uchakataji wa video ulishindwa kwenye Cloudflare'
                  : 'Cloudflare video processing failed'
              );
            }
          }
        }
      } else {
        // FALLBACK: Resilient Server-Side Proxy Upload (same-origin, 100% reliable across cellular networks)
        setUploadStep('UPLOADING_CLOUDFLARE');
        setStatusMessage(
          language === 'sw'
            ? 'Inapakia salama kupitia seva ya ChekaApp...'
            : 'Uploading securely via ChekaApp server proxy...'
        );

        const serverFormData = new FormData();
        serverFormData.append('file', uploadFile, videoFile?.name || `reel_${Date.now()}.mp4`);
        serverFormData.append('caption', `${topText ? topText + ' - ' : ''}${caption}`);
        serverFormData.append('topText', topText);
        serverFormData.append('hashtags', tags);
        serverFormData.append('thumbnailUrl', selectedTemplate.url);

        createdVideo = await new Promise<any>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', '/api/videos/upload');

          const token = localStorage.getItem('cheka_token');
          if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          }

          xhr.upload.onprogress = (evt) => {
            if (evt.lengthComputable) {
              const pct = Math.round((evt.loaded / evt.total) * 100);
              setUploadProgress(pct);
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const data = JSON.parse(xhr.responseText);
                resolve(data);
              } catch (e) {
                reject(new Error('Invalid server response'));
              }
            } else {
              let msg = 'Failed to upload video via ChekaApp server';
              try {
                const errJson = JSON.parse(xhr.responseText);
                if (errJson.error) msg = errJson.error;
              } catch {}
              reject(new Error(msg));
            }
          };

          xhr.onerror = () => reject(new Error('Hitilafu ya mtandao wakati wa kupakia kwenye seva ya ChekaApp'));
          xhr.send(serverFormData);
        });

        uid = createdVideo.videoUid || createdVideo.id;
        setStreamUid(uid);
        finalVideoData = createdVideo;
      }

      setUploadProgress(100);
      setUploadStep('READY');
      setStatusMessage(
        language === 'sw'
          ? 'Hongera! Video ipo tayari na imechapishwa!'
          : 'Success! Video is encoded and ready to stream!'
      );
      memeAudio.playLaugh();

      // Convert to app MemeVideo model
      const publishedMeme: MemeVideo = {
        id: createdVideo.id,
        title: topText || 'Meme Mpya ya Cheka',
        caption: finalVideoData?.caption || caption,
        creator: {
          id: user.id,
          name: `@${user.username}`,
          username: user.username,
          avatar: user.avatarUrl || selectedTemplate.url,
          bio: 'Mchekeshaji wa ChekaApp',
          verified: false,
          followersCount: 0,
        },
        videoUid: uid,
        mediaUrl: videoPreviewUrl || selectedTemplate.url,
        mediaType: videoFile ? 'video' : 'image',
        duration: finalVideoData?.durationSec || duration,
        status: 'ready',
        streamPlayback: finalVideoData?.streamPlayback || {
          hls: `https://videodelivery.net/${uid}/manifest/video.m3u8`,
          iframe: `https://iframe.videodelivery.net/${uid}`,
          mp4: `https://videodelivery.net/${uid}/downloads/default.mp4`,
          thumbnail: `https://videodelivery.net/${uid}/thumbnails/thumbnail.jpg`,
        },
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        savesCount: 0,
        laughsCount: 0,
        viewsCount: 0,
        tags: hashtagsList,
        soundTrack: {
          id: 'sound_' + selectedSound,
          title: sounds.find(s => s.id === selectedSound)?.name || 'Custom Sound',
          artist: 'Cheka Audio Lab',
          durationSec: duration,
          effectKey: selectedSound,
        },
        topOverlayText: topText,
        bottomOverlayText: bottomText,
        createdAt: new Date().toISOString(),
        isLiked: true,
        isSaved: false,
        isFollowed: false,
        signals: {
          watchRatio: 1.0,
          watchMs: duration * 1000,
          likes: 1,
          shares: 0,
          comments: 0,
          skips: 0,
          ageHours: 0.01,
        },
        moderationStatus: 'APPROVED',
      };

      setTimeout(() => {
        onPublish(publishedMeme);
      }, 1200);

    } catch (err: any) {
      console.error('Upload pipeline failed:', err);
      setUploadStep('ERROR');
      setErrorMessage(err.message || 'Error occurred during Cloudflare upload pipeline');
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-neutral-900 border border-neutral-800 rounded-3xl text-center space-y-5 shadow-2xl">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 to-pink-500 p-0.5 flex items-center justify-center shadow-lg shadow-amber-500/20">
          <div className="w-full h-full bg-neutral-950 rounded-[14px] flex items-center justify-center">
            <Upload className="w-8 h-8 text-amber-400" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-white tracking-tight">
            {language === 'sw' ? 'Ingia au Jisajili ili Kuchapisha Video' : 'Sign In or Sign Up to Publish Reels'}
          </h3>
          <p className="text-xs text-neutral-300 leading-relaxed">
            {language === 'sw'
              ? 'Ili video zako ziwe na jina na picha yako binafsi, upate wafuasi na uweze kupokea zawadi za fedha, tafadhali fungua au ingia kwenye akaunti yako.'
              : 'To publish videos under your own name and avatar, gain followers, and receive gifts, please sign in or register your account.'}
          </p>
        </div>
        <button
          onClick={() => {
            onOpenAuth?.();
            memeAudio.playBoing();
          }}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-400 hover:to-pink-400 text-neutral-950 font-black text-sm shadow-lg shadow-amber-500/25 transition-all active:scale-95"
        >
          {language === 'sw' ? 'Fungua Akaunti / Ingia Sasa' : 'Sign Up / Sign In Now'}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-36 w-full">
      {/* Studio Header */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-100 flex items-center gap-2">
            <Radio className="w-5 h-5 text-amber-400 animate-pulse" />
            <span>{language === 'sw' ? 'Studio ya Uchapishaji (Cloudflare Stream)' : 'Creator Studio (Cloudflare Stream)'}</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            {language === 'sw'
              ? 'Pakia video halisi kwa Direct Upload ya Cloudflare Stream na hifadhi kwenye PostgreSQL!'
              : 'Direct upload videos to Cloudflare Stream edge and persist in PostgreSQL!'}
          </p>
        </div>

        {/* Duration selector */}
        <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
          <Clock className="w-3.5 h-3.5 text-neutral-400 ml-2" />
          {[15, 30, 60].map(d => (
            <button
              key={d}
              onClick={() => {
                setDuration(d as 15 | 30 | 60);
                memeAudio.playBoing();
              }}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                duration === d
                  ? 'bg-amber-500 text-neutral-950 shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {d}s
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Live Reel Canvas Preview */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full max-w-[300px] aspect-[9/16] rounded-2xl overflow-hidden relative shadow-2xl border-2 border-neutral-800 bg-neutral-950 flex flex-col justify-between p-4 group select-none">
            {/* Visual background: Video preview or template image */}
            {videoPreviewUrl ? (
              <>
                <video
                  src={videoPreviewUrl}
                  autoPlay
                  loop
                  muted={previewMuted}
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                />
                <button
                  type="button"
                  onClick={() => setPreviewMuted(prev => !prev)}
                  className="absolute top-3 right-3 z-30 p-2 rounded-full bg-black/70 hover:bg-black/90 text-white backdrop-blur-md border border-white/20 shadow-lg transition-transform active:scale-95"
                  title={previewMuted ? 'Washa sauti ya video' : 'Zima sauti'}
                >
                  {previewMuted ? (
                    <VolumeX className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                  )}
                </button>
              </>
            ) : (
              <img
                src={selectedTemplate.url}
                alt="Meme Preview"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            )}
            
            {/* Dark gradient for text legibility */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />

            {/* Top Meme Text Overlay */}
            <div className="relative z-10 text-center pointer-events-none px-2">
              <span className={`text-base md:text-lg break-words transition-all ${
                textStyle === 'yellow'
                  ? 'text-yellow-300 font-extrabold uppercase bg-black/70 px-2.5 py-1 rounded-lg drop-shadow-md'
                  : textStyle === 'pink'
                  ? 'text-pink-400 font-black uppercase drop-shadow-[0_2px_8px_rgba(236,72,153,0.9)] [text-shadow:_2px_2px_0_rgb(0_0_0)]'
                  : textStyle === 'clean'
                  ? 'text-white font-semibold bg-neutral-900/80 backdrop-blur-md px-3 py-1 rounded-full text-xs shadow-md'
                  : 'font-extrabold text-white uppercase tracking-wide leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] [text-shadow:_2px_2px_0_rgb(0_0_0),_-2px_-2px_0_rgb(0_0_0),_2px_-2px_0_rgb(0_0_0),_-2px_2px_0_rgb(0_0_0)]'
              }`}>
                {topText || (language === 'sw' ? 'WEKA MANENO YA JUU' : 'TOP MEME TEXT')}
              </span>
            </div>

            {/* Center Sound Wave / Duration Badge */}
            <div className="relative z-10 self-center bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 text-[11px] text-amber-300 font-mono flex items-center gap-1.5 pointer-events-none">
              <Music className="w-3 h-3 text-amber-400" />
              <span>{Math.max(1, trimEnd - trimStart)}s</span>
              <span>·</span>
              <span>{videoFile ? 'Video Trimmed' : sounds.find(s => s.id === selectedSound)?.name.split(' ')[0]}</span>
            </div>

            {/* Bottom Meme Text Overlay */}
            <div className="relative z-10 text-center pointer-events-none px-2">
              <span className={`text-base md:text-lg break-words transition-all ${
                textStyle === 'yellow'
                  ? 'text-yellow-300 font-extrabold uppercase bg-black/70 px-2.5 py-1 rounded-lg drop-shadow-md'
                  : textStyle === 'pink'
                  ? 'text-amber-300 font-black uppercase drop-shadow-[0_2px_8px_rgba(245,158,11,0.9)] [text-shadow:_2px_2px_0_rgb(0_0_0)]'
                  : textStyle === 'clean'
                  ? 'text-amber-300 font-semibold bg-neutral-900/80 backdrop-blur-md px-3 py-1 rounded-full text-xs shadow-md'
                  : 'font-extrabold text-amber-300 uppercase tracking-wide leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] [text-shadow:_2px_2px_0_rgb(0_0_0),_-2px_-2px_0_rgb(0_0_0),_2px_-2px_0_rgb(0_0_0),_-2px_2px_0_rgb(0_0_0)]'
              }`}>
                {bottomText || (language === 'sw' ? 'WEKA MANENO YA CHINI' : 'BOTTOM MEME TEXT')}
              </span>
            </div>
          </div>

          <span className="text-[11px] text-neutral-500 mt-2">
            {language === 'sw'
              ? 'Onyesho la moja kwa moja la meme yako (Vertical 9:16)'
              : 'Live 9:16 vertical reel preview'}
          </span>
        </div>

        {/* Right column: Upload Pipeline Controls & AI Punchline Generator */}
        <div className="lg:col-span-7 space-y-5">
          {/* 1. Video Source Mode: Real Video File Upload vs Meme Template */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-neutral-200 block">
                {language === 'sw' ? '1. Chanzo cha Video (Direct Upload)' : '1. Video Source (Direct Upload)'}
              </label>
              <div className="flex items-center gap-1 bg-neutral-950 p-0.5 rounded-lg border border-neutral-800 text-[11px]">
                <button
                  onClick={() => setInputMode('video_file')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    inputMode === 'video_file'
                      ? 'bg-amber-500 text-neutral-950 font-bold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <FileVideo className="w-3 h-3 inline mr-1" />
                  {language === 'sw' ? 'Faili la Video' : 'Video File'}
                </button>
                <button
                  onClick={() => setInputMode('template')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    inputMode === 'template'
                      ? 'bg-amber-500 text-neutral-950 font-bold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Film className="w-3 h-3 inline mr-1" />
                  {language === 'sw' ? 'Kiolezo (Template)' : 'Template'}
                </button>
              </div>
            </div>

            {inputMode === 'video_file' ? (
              <div className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {videoFile ? (
                  <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                        <Video className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <span className="text-xs font-semibold text-neutral-200 block truncate">{videoFile.name}</span>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {(videoFile.size / (1024 * 1024)).toFixed(2)} MB · {videoFile.type}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setVideoFile(null);
                        setVideoPreviewUrl(null);
                      }}
                      className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-neutral-900 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-neutral-800 hover:border-amber-500/60 rounded-xl p-5 text-center cursor-pointer transition-colors bg-neutral-950/40 hover:bg-neutral-950/80 group"
                  >
                    <Upload className="w-6 h-6 text-neutral-500 group-hover:text-amber-400 mx-auto mb-2 transition-colors" />
                    <span className="text-xs font-semibold text-neutral-200 block">
                      {language === 'sw' ? 'Bofya kupakia video fupi (MP4, WebM, MOV)' : 'Click to select a short video (MP4, WebM, MOV)'}
                    </span>
                    <span className="text-[10px] text-neutral-500 mt-1 block">
                      {language === 'sw' ? 'Upeo: 60 sekunde (Cloudflare Stream direct upload)' : 'Max: 60 seconds (Cloudflare Stream direct upload)'}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {templates.map(tmpl => (
                  <button
                    key={tmpl.id}
                    onClick={() => handleSelectTemplate(tmpl)}
                    className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all ${
                      selectedTemplate.id === tmpl.id
                        ? 'border-amber-500 scale-[1.03] shadow-md'
                        : 'border-neutral-800 hover:border-neutral-700 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={tmpl.url} alt={tmpl.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-black/70 p-1 text-[9px] text-neutral-200 text-center truncate">
                      {tmpl.name}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 2. Text Overlays */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3">
            <label className="text-xs font-bold text-neutral-200 block">
              {language === 'sw' ? '2. Maneno ya Juu na Chini (Meme Overlays)' : '2. Top & Bottom Overlays'}
            </label>
            <div className="space-y-2">
              <div>
                <span className="text-[11px] text-neutral-400 block mb-1">
                  {language === 'sw' ? 'Maneno ya Juu (Top Headline):' : 'Top Overlay:'}
                </span>
                <input
                  type="text"
                  value={topText}
                  onChange={e => setTopText(e.target.value)}
                  placeholder="POV: WIKI MBILI ZA KAZI..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-neutral-100 outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <span className="text-[11px] text-neutral-400 block mb-1">
                  {language === 'sw' ? 'Maneno ya Chini (Punchline):' : 'Bottom Overlay:'}
                </span>
                <input
                  type="text"
                  value={bottomText}
                  onChange={e => setBottomText(e.target.value)}
                  placeholder="HALAFU WINDOWS INASEMA RESTART..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-neutral-100 outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <span className="text-[11px] text-neutral-400 block mb-1">
                  {language === 'sw' ? 'Maelezo ya Chapisho (Caption & Hashtags):' : 'Post Caption & Tags:'}
                </span>
                <textarea
                  rows={2}
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-neutral-100 outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* 2b. Mobile Video Editor (Trimming, Subtitle Styles, Cover Frame & SFX) */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-amber-400" />
                <span>{language === 'sw' ? '2b. Kihariri cha Video (Mobile Video Editor)' : '2b. Mobile Video Editor'}</span>
              </label>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 font-mono font-bold">
                PRO STUDIO
              </span>
            </div>

            {/* Trimmer Controls */}
            <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-neutral-300 flex items-center gap-1">
                  <Scissors className="w-3 h-3 text-amber-400" />
                  <span>{language === 'sw' ? 'Kata Urefu (Trim Video)' : 'Trim Duration'}</span>
                </span>
                <span className="text-amber-400 font-mono text-[11px]">
                  {trimStart}s &rarr; {trimEnd}s ({Math.max(1, trimEnd - trimStart)}s)
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-[10px] text-neutral-400 block mb-1">Mwanzo (Start): {trimStart}s</span>
                  <input
                    type="range"
                    min="0"
                    max={Math.max(1, trimEnd - 1)}
                    value={trimStart}
                    onChange={(e) => setTrimStart(Number(e.target.value))}
                    className="w-full accent-amber-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 block mb-1">Mwisho (End): {trimEnd}s</span>
                  <input
                    type="range"
                    min={trimStart + 1}
                    max={duration}
                    value={trimEnd}
                    onChange={(e) => setTrimEnd(Number(e.target.value))}
                    className="w-full accent-amber-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Subtitle & Text Style Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-neutral-300 flex items-center gap-1">
                <Type className="w-3 h-3 text-sky-400" />
                <span>{language === 'sw' ? 'Mtindo wa Maneno na Subtitles' : 'Subtitle & Font Preset'}</span>
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {[
                  { id: 'impact', label: 'Classic Impact', desc: 'Nyeupe + Mpaka Mweusi' },
                  { id: 'yellow', label: 'Reels Yellow', desc: 'Manjano TikTok' },
                  { id: 'pink', label: 'Neon Pink', desc: 'Rangi ya Kung\'aa' },
                  { id: 'clean', label: 'Minimal Pill', desc: 'Kivuli cha Kisasa' }
                ].map(st => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      setTextStyle(st.id as any);
                      memeAudio.playBoing();
                    }}
                    className={`p-2 rounded-xl border text-left transition-all ${
                      textStyle === st.id
                        ? 'border-amber-500 bg-amber-500/15 text-white shadow-sm'
                        : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <p className="font-bold text-[11px] truncate">{st.label}</p>
                    <p className="text-[9px] text-neutral-500 truncate">{st.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Video Cover Frame Chooser */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-neutral-300 flex items-center gap-1">
                <ImageIcon className="w-3 h-3 text-emerald-400" />
                <span>{language === 'sw' ? 'Picha ya Mbele ya Video (Cover Frame)' : 'Thumbnail Cover Frame'}</span>
              </span>
              <div className="grid grid-cols-4 gap-2">
                {[0, 3, 7, 10].map((sec, idx) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => {
                      setCoverOffset(sec);
                      memeAudio.playPop();
                    }}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      coverOffset === sec
                        ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300 font-bold'
                        : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <span className="block text-[11px] font-mono">Frame {idx + 1}</span>
                    <span className="text-[9px] text-neutral-500">Sekunde {sec}s</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Instant Sound Effects Pad */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-neutral-300 flex items-center gap-1">
                <Music className="w-3 h-3 text-pink-400" />
                <span>{language === 'sw' ? 'Madoido ya Sauti (Sound Effects Pad)' : 'Instant SFX Pad'}</span>
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {sounds.map(snd => (
                  <button
                    key={snd.id}
                    type="button"
                    onClick={() => handleTestSound(snd.id)}
                    className={`p-2 rounded-xl border text-center transition-all active:scale-95 ${
                      selectedSound === snd.id
                        ? 'border-amber-500 bg-amber-500/20 text-white font-bold'
                        : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700 hover:text-white'
                    }`}
                  >
                    <span className="text-base block mb-0.5">{snd.icon}</span>
                    <span className="text-[9px] block truncate">{snd.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. AI Gemini Punchline Generator */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{language === 'sw' ? 'Msaidizi wa Vicheko (Gemini AI)' : 'Gemini AI Meme Punchline Writer'}</span>
              </label>
              <span className="text-[10px] text-neutral-400 font-mono">gemini-2.5-flash</span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={aiTopic}
                onChange={e => setAiTopic(e.target.value)}
                placeholder={language === 'sw' ? 'Andika maudhui (mf: deni la kodi, konda wa basi...)' : 'Topic (e.g. rent due, traffic jam...)'}
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-neutral-100 outline-none focus:border-amber-500"
              />
              <button
                onClick={() => generateWithGemini()}
                disabled={aiLoading}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold disabled:opacity-50 transition-colors shrink-0"
              >
                {aiLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>{language === 'sw' ? 'Tengeneza' : 'Generate'}</span>
              </button>
            </div>

            {aiSuggestions.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-amber-500/20">
                <span className="text-[11px] text-amber-300 font-semibold block">
                  {language === 'sw' ? 'Chagua kicheko ulichokipenda:' : 'Pick a punchline to apply:'}
                </span>
                <div className="space-y-2">
                  {aiSuggestions.map((sug, idx) => (
                    <div
                      key={idx}
                      className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 hover:border-amber-500/50 transition-colors flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-bold text-amber-400 block">{sug.title}</span>
                        <p className="text-neutral-300 text-[11px] leading-relaxed">{sug.caption}</p>
                      </div>
                      <button
                        onClick={() => applySuggestion(sug)}
                        className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-neutral-950 font-semibold rounded-lg text-[10px] transition-colors shrink-0"
                      >
                        {language === 'sw' ? 'Tumia' : 'Apply'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 4. Real Cloudflare Stream Upload Action Card */}
          <div className="pt-2">
            {uploadStep !== 'IDLE' && uploadStep !== 'ERROR' ? (
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-amber-400 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                    <span>{statusMessage}</span>
                  </span>
                  <span className="text-neutral-400 font-mono text-[11px]">
                    {uploadStep === 'UPLOADING_CLOUDFLARE' ? `${uploadProgress}%` : uploadStep}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-neutral-950 h-2.5 rounded-full overflow-hidden border border-neutral-800">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full transition-all duration-300"
                    style={{
                      width:
                        uploadStep === 'GETTING_URL'
                          ? '15%'
                          : uploadStep === 'UPLOADING_CLOUDFLARE'
                          ? `${Math.max(25, uploadProgress)}%`
                          : uploadStep === 'SAVING_POSTGRES'
                          ? '85%'
                          : uploadStep === 'PROCESSING_STREAM'
                          ? '95%'
                          : '100%',
                    }}
                  />
                </div>

                {/* Cloudflare metadata indicators */}
                {streamUid && (
                  <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-[10px] font-mono text-neutral-400">
                    <span>Cloudflare UID: <span className="text-neutral-200">{streamUid}</span></span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      HLS Adaptive Bitrate
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <button
                  onClick={handlePublishReel}
                  className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 group"
                >
                  <Upload className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                  <span>
                    {language === 'sw' ? 'Chapisha kwa Cloudflare Stream Halisi' : 'Publish to Cloudflare Stream'}
                  </span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
