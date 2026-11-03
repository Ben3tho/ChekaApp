import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Camera,
  Video,
  Mic,
  MicOff,
  RotateCcw,
  Sparkles,
  Send,
  Loader2,
  Play,
  Pause,
  AlertCircle,
  Split,
  Smile,
  Flame,
  Laugh,
  Check,
  Volume2,
  Volume1,
  VolumeX,
  RefreshCw,
  Sliders,
  Layers,
  CheckCircle2,
  Upload,
  Film
} from 'lucide-react';
import { MemeVideo, Language } from '../types';
import { memeAudio } from '../utils/audioSynth';
import Hls from 'hls.js';

interface DuetReactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetVideo: MemeVideo;
  onPublishReaction: (duetVideo: Partial<MemeVideo>) => Promise<void>;
  language?: Language;
}

const REACTION_STICKERS = ['😂', '💀', '🔥', '😭', '🤯', '👏', '🤣', '🐐', '💯', '❤️'];

/**
 * Resolves the actual playable video URL (HLS stream or MP4 download)
 * or indicates if it's an image meme.
 */
function getPlayableDuetSource(video: MemeVideo): { url: string; isHls: boolean; isImage: boolean; mp4Url?: string } {
  // Check if target is an image meme
  const isImageMeme = video.mediaType === 'image' ||
    (Boolean(video.mediaUrl) && (video.mediaUrl.endsWith('.jpg') || video.mediaUrl.endsWith('.png') || video.mediaUrl.endsWith('.webp')) && !video.videoUid && !video.streamPlayback?.hls);

  if (isImageMeme) {
    return { url: video.mediaUrl, isHls: false, isImage: true };
  }

  // 1. Cloudflare Stream with UID
  if (video.videoUid && !video.videoUid.startsWith('local_') && !video.videoUid.startsWith('/uploads/')) {
    const hls = video.streamPlayback?.hls || `https://videodelivery.net/${video.videoUid}/manifest/video.m3u8`;
    const mp4 = video.streamPlayback?.mp4 || `https://videodelivery.net/${video.videoUid}/downloads/default.mp4`;
    return { url: hls, isHls: true, isImage: false, mp4Url: mp4 };
  }

  // 2. Direct MP4 stream or local uploads
  if (video.streamPlayback?.mp4) {
    return { url: video.streamPlayback.mp4, isHls: false, isImage: false, mp4Url: video.streamPlayback.mp4 };
  }

  if (
    video.mediaUrl &&
    (video.mediaUrl.endsWith('.mp4') ||
      video.mediaUrl.endsWith('.webm') ||
      video.mediaUrl.startsWith('/uploads/') ||
      video.mediaUrl.includes('videodelivery.net'))
  ) {
    const isHls = video.mediaUrl.endsWith('.m3u8');
    return { url: video.mediaUrl, isHls, isImage: false, mp4Url: isHls ? undefined : video.mediaUrl };
  }

  if (video.streamPlayback?.hls) {
    return {
      url: video.streamPlayback.hls,
      isHls: true,
      isImage: false,
      mp4Url: video.streamPlayback.mp4,
    };
  }

  if (video.videoUid) {
    const mp4 = `https://videodelivery.net/${video.videoUid}/downloads/default.mp4`;
    return { url: mp4, isHls: false, isImage: false, mp4Url: mp4 };
  }

  const isHls = Boolean(video.mediaUrl?.endsWith('.m3u8'));
  return { url: video.mediaUrl, isHls, isImage: false };
}

export const DuetReactionModal: React.FC<DuetReactionModalProps> = ({
  isOpen,
  onClose,
  targetVideo,
  onPublishReaction,
  language = 'sw',
}) => {
  const [layoutMode, setLayoutMode] = useState<'split' | 'pip'>('split');
  
  // Hardware Permissions & Camera State
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isCameraLoading, setIsCameraLoading] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isMicMuted, setIsMicMuted] = useState<boolean>(false);
  const [hasMicTrack, setHasMicTrack] = useState<boolean>(true);
  const [isStickerModeOnly, setIsStickerModeOnly] = useState<boolean>(false);

  // Original Video Playback & Sound Controls
  const [originalMuted, setOriginalMuted] = useState<boolean>(false);
  const [originalVolume, setOriginalVolume] = useState<number>(1.0);
  const [isOriginalPlaying, setIsOriginalPlaying] = useState<boolean>(true);
  const [originalDuration, setOriginalDuration] = useState<number>(targetVideo.duration || 15);
  const [isVideoLoading, setIsVideoLoading] = useState<boolean>(true);

  // Duet Recording State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingCountdown, setRecordingCountdown] = useState<number | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [activeSticker, setActiveSticker] = useState<string>('😂');
  const [caption, setCaption] = useState<string>(
    `Reaction yangu kwa video ya @${targetVideo.creator.username}! Nilicheka sana 🤣🤣 #Duet #Reaction #ChekaApp`
  );
  const [isPublishing, setIsPublishing] = useState<boolean>(false);

  // Refs
  const originalVideoRef = useRef<HTMLVideoElement | null>(null);
  const userCameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const hlsRef = useRef<Hls | null>(null);
  const recordingTimerRef = useRef<any>(null);
  const countdownIntervalRef = useRef<any>(null);

  const playableSource = getPlayableDuetSource(targetVideo);

  // Clean stop of camera tracks
  const stopCamera = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (_) {}
      });
      mediaStreamRef.current = null;
    }
    if (userCameraVideoRef.current) {
      userCameraVideoRef.current.srcObject = null;
    }
  }, []);

  /**
   * Resilient progressive camera and microphone hardware permission request
   */
  const startCamera = useCallback(async (targetFacing: 'user' | 'environment' = 'user') => {
    setIsCameraLoading(true);
    setCameraError(null);
    setIsStickerModeOnly(false);

    // Stop any existing stream before creating new one
    stopCamera();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsCameraLoading(false);
      setHasCameraPermission(false);
      setCameraError(
        language === 'sw'
          ? 'Kivinjari hiki hakiruhusu kamera ya moja kwa moja. Unaweza kupakia video au kutumia Stika Mode.'
          : 'Camera API not supported in this browser. You can upload a clip or use Sticker Mode.'
      );
      return;
    }

    let stream: MediaStream | null = null;
    let micAcquired = false;

    // Attempt 1: Video with requested facing mode + high-fidelity audio
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: targetFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: !isMicMuted
          ? {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            }
          : false,
      });
      micAcquired = stream.getAudioTracks().length > 0;
    } catch (err1: any) {
      console.warn('Attempt 1 (ideal video + audio) note:', err1?.message || err1);
      // Attempt 2: Standard video + basic audio
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: targetFacing },
          audio: true,
        });
        micAcquired = stream.getAudioTracks().length > 0;
      } catch (err2: any) {
        console.warn('Attempt 2 (video + basic mic) note:', err2?.message || err2);
        // Attempt 3: Video only (in case microphone was denied or in use by another app)
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: targetFacing },
            audio: false,
          });
          micAcquired = false;
        } catch (err3: any) {
          console.warn('Attempt 3 (facingMode video) note:', err3?.message || err3);
          // Attempt 4: Generic video (e.g. laptop webcam with no facingMode)
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false,
            });
            micAcquired = false;
          } catch (err4: any) {
            // Note: Camera access denied or unavailable in sandbox is expected; log gently
            console.warn('Camera request not permitted or unavailable:', err4?.message || err4);
            setIsCameraLoading(false);
            setHasCameraPermission(false);
            const isDenied = err4.name === 'NotAllowedError' || err4.name === 'PermissionDeniedError';
            setCameraError(
              isDenied
                ? (language === 'sw'
                    ? 'Ruhusa ya kamera imezuiwa na kivinjari. Bonyeza "Washa Kamera Sasa", chagua video kutoka kwenye simu, au tumia Stika.'
                    : 'Camera permission denied. Tap "Enable Camera Now", upload a video clip, or use Sticker Mode.')
                : (language === 'sw'
                    ? 'Kamera haikuweza kupatikana. Unaweza kupakia video ya simu au kutumia stika.'
                    : 'Could not access camera. You can upload a clip or use sticker mode.')
            );
            return;
          }
        }
      }
    }

    if (stream) {
      mediaStreamRef.current = stream;
      setHasCameraPermission(true);
      setFacingMode(targetFacing);
      setHasMicTrack(micAcquired);

      const camVideo = userCameraVideoRef.current;
      if (camVideo) {
        camVideo.defaultMuted = true;
        camVideo.muted = true;
        camVideo.playsInline = true;
        camVideo.setAttribute('playsinline', 'true');
        camVideo.setAttribute('webkit-playsinline', 'true');
        camVideo.srcObject = stream;

        const handleCanPlay = () => {
          camVideo.play().catch((e) => console.warn('Cam video play note:', e));
        };
        camVideo.onloadedmetadata = handleCanPlay;
        camVideo.play().catch(() => {});
      }
    }

    setIsCameraLoading(false);
  }, [isMicMuted, language, stopCamera]);

  // Handle local video clip upload (via native mobile camera or gallery)
  const handleVideoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setRecordedVideoUrl(url);
      setRecordingSeconds(targetVideo.duration || 15);
      memeAudio.playVictory();
    }
  };

  // Flip camera (User / Environment)
  const toggleCameraFacing = useCallback(() => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    memeAudio.playBoing();
    startCamera(nextMode);
  }, [facingMode, startCamera]);

  // Microphone toggle with dynamic track attachment
  const toggleMic = useCallback(async () => {
    memeAudio.playBoing();
    const nextMuted = !isMicMuted;
    setIsMicMuted(nextMuted);

    if (mediaStreamRef.current) {
      const audioTracks = mediaStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks.forEach((t) => (t.enabled = !nextMuted));
        setHasMicTrack(true);
      } else if (!nextMuted) {
        // No audio track existed initially; request mic dynamically
        try {
          const micStream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true },
          });
          const newTrack = micStream.getAudioTracks()[0];
          if (newTrack && mediaStreamRef.current) {
            mediaStreamRef.current.addTrack(newTrack);
            setHasMicTrack(true);
          }
        } catch (err) {
          console.warn('Dynamic mic grant note:', err);
          setIsMicMuted(true);
          setHasMicTrack(false);
        }
      }
    }
  }, [isMicMuted]);

  // Initialize and attach HLS stream or direct video source
  useEffect(() => {
    if (!isOpen) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      return;
    }

    const videoEl = originalVideoRef.current;
    if (!videoEl || playableSource.isImage) {
      setIsVideoLoading(false);
      return;
    }

    setIsVideoLoading(true);

    if (playableSource.isHls) {
      if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS (Safari / iOS)
        videoEl.src = playableSource.url;
        videoEl.addEventListener('loadedmetadata', () => {
          setIsVideoLoading(false);
          setOriginalDuration(videoEl.duration || targetVideo.duration || 15);
          videoEl.play().catch(() => {
            videoEl.muted = true;
            setOriginalMuted(true);
            videoEl.play().catch(() => {});
          });
        }, { once: true });
      } else if (Hls.isSupported()) {
        if (hlsRef.current) {
          hlsRef.current.destroy();
        }
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 30,
        });
        hls.loadSource(playableSource.url);
        hls.attachMedia(videoEl);
        hlsRef.current = hls;

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsVideoLoading(false);
          videoEl.play().catch(() => {
            videoEl.muted = true;
            setOriginalMuted(true);
            videoEl.play().catch(() => {});
          });
        });

        // Error recovery
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
              hls.startLoad();
            } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              hls.recoverMediaError();
            } else {
              hls.destroy();
              hlsRef.current = null;
              // Fallback to MP4 download URL
              const fallback = playableSource.mp4Url || targetVideo.mediaUrl;
              if (fallback && videoEl) {
                videoEl.src = fallback;
                videoEl.load();
                videoEl.play().catch(() => {
                  videoEl.muted = true;
                  videoEl.play().catch(() => {});
                });
              }
            }
          }
        });
      } else {
        const mp4Fallback = playableSource.mp4Url || targetVideo.mediaUrl;
        videoEl.src = mp4Fallback;
      }
    } else {
      videoEl.src = playableSource.url;
    }

    videoEl.muted = originalMuted;
    videoEl.volume = originalMuted ? 0 : originalVolume;
    videoEl.loop = true;

    const handleLoadedMetadata = () => {
      setIsVideoLoading(false);
      if (videoEl.duration && !isNaN(videoEl.duration)) {
        setOriginalDuration(videoEl.duration);
      }
    };

    videoEl.addEventListener('loadedmetadata', handleLoadedMetadata);

    const playPromise = videoEl.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsOriginalPlaying(true);
          setIsVideoLoading(false);
        })
        .catch((err) => {
          console.warn('Auto-play note in Duet modal:', err);
          videoEl.muted = true;
          setOriginalMuted(true);
          videoEl.play().then(() => setIsOriginalPlaying(true)).catch(() => setIsOriginalPlaying(false));
        });
    }

    return () => {
      videoEl.removeEventListener('loadedmetadata', handleLoadedMetadata);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [isOpen, targetVideo.id, targetVideo.videoUid, targetVideo.mediaUrl, playableSource.url, playableSource.isHls, playableSource.isImage]);

  // Initial camera attempt on mount with permission check
  useEffect(() => {
    let isCancelled = false;

    const checkAndInitCamera = async () => {
      if (!isOpen) {
        stopCamera();
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        return;
      }

      // Check permission query if supported
      if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
        try {
          const status = await navigator.permissions.query({ name: 'camera' as PermissionName });
          if (isCancelled) return;

          if (status.state === 'granted') {
            startCamera(facingMode);
          } else if (status.state === 'denied') {
            setIsCameraLoading(false);
            setHasCameraPermission(false);
            setCameraError(
              language === 'sw'
                ? 'Ruhusa ya kamera imezimwa kwenye kivinjari. Bonyeza "Washa Kamera Sasa", chagua video ya simu, au tumia Stika.'
                : 'Camera permission is blocked in browser settings. Tap "Enable Camera Now" or upload a video clip.'
            );
          } else {
            // Prompt state: start camera directly
            startCamera(facingMode);
          }
          return;
        } catch (_) {
          // Fallback to startCamera if query is unsupported
        }
      }

      startCamera(facingMode);
    };

    checkAndInitCamera();

    return () => {
      isCancelled = true;
      stopCamera();
    };
  }, [isOpen]);

  // Synchronize original volume changes
  useEffect(() => {
    if (originalVideoRef.current) {
      originalVideoRef.current.volume = originalMuted ? 0 : originalVolume;
      originalVideoRef.current.muted = originalMuted;
    }
  }, [originalVolume, originalMuted]);

  // Toggle Original Video Play / Pause
  const toggleOriginalPlay = () => {
    const videoEl = originalVideoRef.current;
    if (!videoEl) return;
    if (videoEl.paused) {
      videoEl.play().catch(() => {});
      setIsOriginalPlaying(true);
    } else {
      videoEl.pause();
      setIsOriginalPlaying(false);
    }
    memeAudio.playPop();
  };

  // Toggle Original Video Sound & Cycle volume levels (100% -> 50% -> 0% / Mute)
  const toggleOriginalSound = () => {
    memeAudio.playPop();
    if (originalMuted) {
      setOriginalMuted(false);
      setOriginalVolume(1.0);
    } else if (originalVolume > 0.6) {
      setOriginalVolume(0.4);
    } else {
      setOriginalMuted(true);
    }
  };

  // Start countdown and synchronized Duet Recording
  const handleStartRecording = () => {
    if (recordingCountdown !== null || isRecording) return;
    setRecordedVideoUrl(null);
    recordedChunksRef.current = [];
    setRecordingCountdown(3);
    memeAudio.playBoing();

    let count = 3;
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    countdownIntervalRef.current = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setRecordingCountdown(count);
        memeAudio.playPop();
      } else {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
        setRecordingCountdown(null);
        startActualRecording();
      }
    }, 850);
  };

  // Launch actual synchronized recording
  const startActualRecording = () => {
    setIsRecording(true);
    setRecordingSeconds(0);
    memeAudio.playShock();

    // Synchronize original video from 0
    if (originalVideoRef.current) {
      originalVideoRef.current.currentTime = 0;
      originalVideoRef.current.muted = originalMuted;
      originalVideoRef.current.volume = originalMuted ? 0 : originalVolume;
      const playP = originalVideoRef.current.play();
      if (playP !== undefined) {
        playP.catch(() => {
          if (originalVideoRef.current) {
            originalVideoRef.current.muted = true;
            setOriginalMuted(true);
            originalVideoRef.current.play().catch(() => {});
          }
        });
      }
      setIsOriginalPlaying(true);
    }

    // Seconds counter
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }

    const maxDuration = Math.max(5, targetVideo.duration || 15);
    recordingTimerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => {
        const next = prev + 1;
        if (next >= maxDuration) {
          handleStopRecording();
        }
        return next;
      });
    }, 1000);

    // Initialize MediaRecorder if camera stream exists
    if (mediaStreamRef.current) {
      try {
        const stream = mediaStreamRef.current;
        const hasAudio = stream.getAudioTracks().length > 0 && !isMicMuted;

        const candidates = hasAudio
          ? [
              'video/webm;codecs=vp9,opus',
              'video/webm;codecs=vp8,opus',
              'video/webm;codecs=h264,opus',
              'video/webm',
              'video/mp4;codecs=avc1,mp4a',
              'video/mp4',
            ]
          : [
              'video/webm;codecs=vp9',
              'video/webm;codecs=vp8',
              'video/webm',
              'video/mp4',
            ];

        let chosenMime = '';
        for (const mime of candidates) {
          if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mime)) {
            chosenMime = mime;
            break;
          }
        }

        const recorderOptions: MediaRecorderOptions = {};
        if (chosenMime) {
          recorderOptions.mimeType = chosenMime;
        }

        const recorder = new MediaRecorder(stream, recorderOptions);
        recordedChunksRef.current = [];

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
        };

        recorder.onstop = () => {
          const mimeType = chosenMime || 'video/webm';
          const blob = new Blob(recordedChunksRef.current, { type: mimeType });
          if (blob.size > 0) {
            const url = URL.createObjectURL(blob);
            setRecordedVideoUrl(url);
          } else {
            setRecordedVideoUrl(playableSource.mp4Url || targetVideo.mediaUrl || '');
          }
        };

        recorder.start(250);
        mediaRecorderRef.current = recorder;
      } catch (err) {
        console.warn('MediaRecorder init note:', err);
      }
    }
  };

  // Stop recording
  const handleStopRecording = () => {
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    memeAudio.playPop();

    if (originalVideoRef.current) {
      originalVideoRef.current.pause();
      setIsOriginalPlaying(false);
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn('Recorder stop note:', e);
      }
    } else if (!mediaStreamRef.current) {
      // Sticker reaction fallback using target video MP4 or stream
      const fallbackUrl = playableSource.mp4Url || targetVideo.streamPlayback?.mp4 || targetVideo.mediaUrl;
      setRecordedVideoUrl(fallbackUrl || '');
    }
  };

  // Reset recording and go back to camera view
  const handleResetRecording = () => {
    if (recordedVideoUrl && recordedVideoUrl.startsWith('blob:')) {
      URL.revokeObjectURL(recordedVideoUrl);
    }
    setRecordedVideoUrl(null);
    setRecordingSeconds(0);
    memeAudio.playBoing();
    // Restart camera if it was stopped
    if (!hasCameraPermission && !isStickerModeOnly) {
      startCamera(facingMode);
    }
    // Resume original video looped
    if (originalVideoRef.current) {
      originalVideoRef.current.currentTime = 0;
      originalVideoRef.current.play().catch(() => {});
      setIsOriginalPlaying(true);
    }
  };

  // Publish Duet
  const handlePublish = async () => {
    setIsPublishing(true);
    memeAudio.playPop();

    try {
      const duetPayload: Partial<MemeVideo> = {
        title: `Duet na @${targetVideo.creator.username}`,
        caption: caption,
        mediaUrl: recordedVideoUrl || targetVideo.mediaUrl,
        mediaType: 'video',
        duration: recordingSeconds || targetVideo.duration || 15,
        tags: ['#Duet', '#Reaction', `#${targetVideo.creator.username}`, '#ChekaApp'],
        topOverlayText: `DUET WITH @${targetVideo.creator.username.toUpperCase()}`,
        bottomOverlayText: caption.substring(0, 45).toUpperCase(),
      };

      await onPublishReaction(duetPayload);
      memeAudio.playVictory();
      onClose();
    } catch (err) {
      console.error('Failed to publish duet:', err);
      memeAudio.playBoing();
    } finally {
      setIsPublishing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/95 backdrop-blur-md animate-fade-in">
      {/* Hidden file input for native camera / video upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        capture="user"
        className="hidden"
        onChange={handleVideoFileUpload}
      />

      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[96vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/30 flex items-center justify-center">
              <Split className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>{language === 'sw' ? 'Duet & Video Reaction Studio' : 'Duet & Reaction Studio'}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-pink-500/15 text-pink-400 border border-pink-500/30 font-mono">
                  LIVE
                </span>
              </h2>
              <p className="text-[11px] text-neutral-400">
                {language === 'sw'
                  ? `Kujirekodi ukiicheka video ya @${targetVideo.creator.username}`
                  : `Record your live reaction to @${targetVideo.creator.username}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!recordedVideoUrl && (
              <button
                type="button"
                onClick={() => {
                  setLayoutMode((prev) => (prev === 'split' ? 'pip' : 'split'));
                  memeAudio.playPop();
                }}
                className="px-2.5 py-1 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                title="Badili mpangilio wa kioo"
              >
                <Layers className="w-3.5 h-3.5 text-pink-400" />
                <span className="hidden sm:inline">
                  {layoutMode === 'split' ? 'Split-Screen' : 'Picture-in-Picture'}
                </span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              title="Funga Studio"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewport Area */}
        <div className="flex-1 bg-black p-3 flex flex-col items-center justify-center overflow-hidden min-h-[360px] sm:min-h-[420px]">
          {/* A. RECORDED PREVIEW MODE: Review before publishing */}
          {recordedVideoUrl ? (
            <div className="w-full max-w-lg aspect-9/16 sm:aspect-16/9 bg-neutral-950 rounded-2xl overflow-hidden border border-amber-500/40 relative shadow-2xl flex flex-col items-center justify-center">
              <video
                ref={previewVideoRef}
                src={recordedVideoUrl}
                playsInline
                autoPlay
                controls
                loop
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 z-10 px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-md border border-amber-400/50 text-[10px] font-bold text-amber-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{language === 'sw' ? 'Hakiki Duet Yako' : 'Preview Duet'}</span>
              </div>
              <div className="absolute bottom-14 right-2 z-10 text-3xl drop-shadow-lg select-none pointer-events-none">
                {activeSticker}
              </div>
            </div>
          ) : (
            /* B. LIVE RECORDING STUDIO (Side-by-Side or PiP) */
            <div className="relative w-full max-w-lg aspect-9/16 sm:aspect-16/9 bg-neutral-950 rounded-2xl overflow-hidden border border-neutral-800 shadow-inner flex">
              {/* Countdown Overlay */}
              {recordingCountdown !== null && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-xs">
                  <span className="text-8xl font-black text-amber-400 animate-ping font-mono">
                    {recordingCountdown}
                  </span>
                </div>
              )}

              {/* Left Side: Original Video */}
              <div
                className={`relative h-full bg-neutral-900 overflow-hidden flex items-center justify-center transition-all ${
                  layoutMode === 'split' ? 'flex-1 border-r border-neutral-800/80' : 'w-full'
                }`}
              >
                {playableSource.isImage ? (
                  <img
                    src={playableSource.url}
                    alt={targetVideo.title}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <>
                    <video
                      ref={originalVideoRef}
                      playsInline
                      crossOrigin="anonymous"
                      loop
                      className="w-full h-full object-cover"
                    />
                    {isVideoLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
                      </div>
                    )}
                  </>
                )}

                {/* Top Info Badge */}
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-[10px] font-bold text-neutral-200 border border-neutral-700/60 z-10 flex items-center gap-1.5">
                  <span>@{targetVideo.creator.username}</span>
                  {playableSource.isHls && <span className="text-[9px] text-amber-400 font-mono">HLS</span>}
                </div>

                {/* Live Controls for Original Video */}
                {!playableSource.isImage && (
                  <div className="absolute bottom-2 left-2 flex items-center gap-1.5 z-10">
                    <button
                      type="button"
                      onClick={toggleOriginalPlay}
                      className="p-1.5 rounded-lg bg-black/75 hover:bg-black/90 text-white backdrop-blur-md border border-white/10 transition-transform active:scale-95 shadow-md"
                      title={isOriginalPlaying ? 'Sitisha Video' : 'Cheza Video'}
                    >
                      {isOriginalPlaying ? (
                        <Pause className="w-3.5 h-3.5 text-amber-400 fill-current" />
                      ) : (
                        <Play className="w-3.5 h-3.5 text-emerald-400 fill-current" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={toggleOriginalSound}
                      className="px-2 py-1.5 rounded-lg bg-black/75 hover:bg-black/90 text-white backdrop-blur-md border border-white/10 transition-transform active:scale-95 shadow-md flex items-center gap-1 text-[10px] font-mono"
                      title={
                        originalMuted
                          ? 'Washa Sauti ya Video'
                          : `Sauti: ${Math.round(originalVolume * 100)}% (Bofya kupunguza)`
                      }
                    >
                      {originalMuted ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                          <span className="text-rose-400">Mute</span>
                        </>
                      ) : originalVolume > 0.6 ? (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">100%</span>
                        </>
                      ) : (
                        <>
                          <Volume1 className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-amber-400">40%</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Right Side / PiP: User Live Camera Reaction */}
              <div
                className={`relative bg-neutral-950 overflow-hidden flex items-center justify-center transition-all ${
                  layoutMode === 'split'
                    ? 'flex-1 h-full'
                    : 'absolute bottom-3 right-3 w-32 sm:w-40 aspect-9/16 rounded-xl border-2 border-pink-500 shadow-2xl z-20'
                }`}
              >
                <video
                  ref={userCameraVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
                />

                {/* Fallback / Permission Prompt when Camera is Inactive */}
                {!hasCameraPermission && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center bg-neutral-900/95 space-y-2.5 z-10">
                    <div className="text-3xl animate-bounce">{activeSticker}</div>
                    <p className="text-xs font-bold text-white">
                      {isStickerModeOnly
                        ? (language === 'sw' ? 'Sticker Reaction Mode' : 'Sticker Reaction Mode')
                        : (language === 'sw' ? 'Washa Kamera au Pakia Video' : 'Enable Camera or Upload')}
                    </p>
                    <p className="text-[10px] text-neutral-400 leading-tight px-1 max-w-[210px]">
                      {isStickerModeOnly
                        ? (language === 'sw' ? 'Uko tayari kurekodi sauti yako na stika!' : 'Ready to record your voice & reactions!')
                        : (cameraError || (language === 'sw' ? 'Gusa kitufe kuanza reaction yako:' : 'Tap below to start your reaction:'))}
                    </p>

                    <div className="flex flex-col gap-1.5 w-full max-w-[200px]">
                      {/* Button 1: Explicit user-gesture camera retry */}
                      <button
                        type="button"
                        onClick={() => startCamera(facingMode)}
                        disabled={isCameraLoading}
                        className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:brightness-110 text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        {isCameraLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Camera className="w-3.5 h-3.5" />
                        )}
                        <span>{language === 'sw' ? 'Washa Kamera Sasa' : 'Enable Camera Now'}</span>
                      </button>

                      {/* Button 2: Native mobile camera or video file upload */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-1.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-[11px] shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 border border-neutral-700"
                        title="Chagua video ya simu au rekodi na app ya kamera"
                      >
                        <Upload className="w-3.5 h-3.5 text-pink-400" />
                        <span>{language === 'sw' ? 'Pakia Video ya Simu' : 'Upload Video Clip'}</span>
                      </button>

                      {/* Button 3: Sticker & Voice only mode */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsStickerModeOnly(true);
                          setHasCameraPermission(false);
                          setCameraError(null);
                          memeAudio.playPop();
                        }}
                        className="text-[10px] text-amber-300 hover:underline py-0.5"
                      >
                        {language === 'sw' ? '✨ Tumia Stika & Sauti Pekee' : '✨ Use Sticker & Audio Mode'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Camera Switch button (Front vs Back) */}
                {hasCameraPermission && (
                  <button
                    type="button"
                    onClick={toggleCameraFacing}
                    className="absolute bottom-2 left-2 z-10 p-1.5 rounded-lg bg-black/75 hover:bg-black/90 text-white backdrop-blur-md border border-white/10"
                    title="Badili Kamera ya Mbele/Nyuma"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-pink-400" />
                  </button>
                )}

                {/* Reaction Sticker Floating Badge */}
                <div className="absolute bottom-2 right-2 text-3xl drop-shadow-lg select-none pointer-events-none z-10">
                  {activeSticker}
                </div>

                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-pink-500/30 text-pink-300 border border-pink-500/40 text-[10px] font-bold backdrop-blur-xs z-10 flex items-center gap-1">
                  <span>Wewe (Reaction)</span>
                  {hasMicTrack && !isMicMuted && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Quick Reaction Stickers Bar */}
          {!recordedVideoUrl && (
            <div className="mt-3 flex items-center gap-2 overflow-x-auto max-w-full px-2 py-1 no-scrollbar">
              <span className="text-[11px] text-neutral-400 font-medium whitespace-nowrap">Stika:</span>
              {REACTION_STICKERS.map((stk) => (
                <button
                  key={stk}
                  type="button"
                  onClick={() => {
                    setActiveSticker(stk);
                    memeAudio.playPop();
                  }}
                  className={`text-lg p-1.5 rounded-xl border transition-all ${
                    activeSticker === stk
                      ? 'bg-amber-500/20 border-amber-400 scale-110'
                      : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  {stk}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer Controls & Publishing */}
        <div className="p-4 bg-neutral-950 border-t border-neutral-800 space-y-3">
          {recordedVideoUrl ? (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between text-xs text-neutral-300 px-1">
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  {language === 'sw' ? 'Duet imerekodiwa kikamilifu!' : 'Duet recorded successfully!'}
                </span>
                <span className="text-neutral-400 font-mono text-[11px]">
                  {recordingSeconds}s / {originalDuration}s
                </span>
              </div>

              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Andika maelezo ya Duet yako..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:border-amber-400 focus:outline-hidden"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleResetRecording}
                  className="flex-1 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-semibold text-neutral-300 transition-colors flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Rudia Kurekodi</span>
                </button>

                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="flex-2 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:brightness-110 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-pink-500/20 disabled:opacity-50"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Inachapisha Duet...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Chapisha Duet kwenye Feed 🎉</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2.5">
              {/* Mic Toggle Button */}
              <button
                type="button"
                onClick={toggleMic}
                className={`p-3 rounded-xl border text-xs font-medium transition-colors ${
                  isMicMuted
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white'
                }`}
                title={isMicMuted ? 'Washa Kipaza sauti (Mic)' : 'Zima Kipaza sauti'}
              >
                {isMicMuted ? <MicOff className="w-5 h-5 text-rose-400" /> : <Mic className="w-5 h-5 text-emerald-400" />}
              </button>

              {/* Original Video Volume Quick Cycle */}
              <button
                type="button"
                onClick={toggleOriginalSound}
                className={`p-3 rounded-xl border text-xs font-medium transition-colors ${
                  originalMuted
                    ? 'bg-neutral-900 border-neutral-800 text-rose-400'
                    : 'bg-neutral-900 border-neutral-800 text-emerald-400'
                }`}
                title={originalMuted ? 'Washa Sauti ya Video' : `Sauti ya Video: ${Math.round(originalVolume * 100)}%`}
              >
                {originalMuted ? (
                  <VolumeX className="w-5 h-5 text-rose-400" />
                ) : originalVolume > 0.6 ? (
                  <Volume2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Volume1 className="w-5 h-5 text-amber-400" />
                )}
              </button>

              {/* Recording Action Button */}
              {isRecording ? (
                <button
                  type="button"
                  onClick={handleStopRecording}
                  className="flex-1 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 animate-pulse shadow-lg shadow-rose-600/30"
                >
                  <Pause className="w-4 h-4 fill-current" />
                  <span>
                    Maliza Kurekodi ({recordingSeconds}s / {originalDuration}s) ⏹
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStartRecording}
                  disabled={recordingCountdown !== null}
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 hover:brightness-110 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-pink-500/30 active:scale-[0.99] transition-all"
                >
                  <Video className="w-4 h-4" />
                  <span>Anza Kurekodi Duet Reaction 🎭</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
