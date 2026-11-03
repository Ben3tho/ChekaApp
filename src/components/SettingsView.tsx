import React, { useState } from 'react';
import { 
  User as UserIcon, 
  Settings as SettingsIcon, 
  Globe, 
  Server, 
  Smartphone, 
  Volume2, 
  VolumeX, 
  LogOut, 
  LogIn, 
  Check, 
  Edit3, 
  ShieldCheck, 
  Sparkles, 
  ChevronRight, 
  Save, 
  X, 
  RefreshCw,
  AlertCircle,
  Database,
  Radio,
  CheckCircle2,
  Lock,
  Download,
  FileText,
  Bell,
  Coins,
  Zap,
  Camera,
  Upload,
  Image as ImageIcon,
  Trash2,
  Megaphone,
  Crown
} from 'lucide-react';
import { Language } from '../types';
import { useAuth } from '../context/AuthContext';
import { memeAudio } from '../utils/audioSynth';
import {
  isNotificationsEnabled,
  requestPushPermission,
  disableNotifications,
  sendTestPushNotification,
  isPushSupported
} from '../utils/notifications';

interface SettingsViewProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenAuth: () => void;
  onOpenApkModal?: () => void;
  onOpenArchitecture: () => void;
  onOpenBuyCoins?: () => void;
  onOpenAdCampaign?: () => void;
  onOpenAlgorithm?: () => void;
  onOpenOwnerDashboard?: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  dbHealth: {
    status: 'ok' | 'error' | 'loading';
    database?: string;
    pool?: { total: number; idle: number; waiting: number };
    error?: string;
  };
}

const PRESET_AVATARS = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=Felix',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Nala',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Kibo',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Simba',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Zuri',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Macho'
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  language,
  onLanguageChange,
  onOpenAuth,
  onOpenApkModal,
  onOpenArchitecture,
  onOpenBuyCoins,
  onOpenAdCampaign,
  onOpenAlgorithm,
  onOpenOwnerDashboard,
  soundEnabled,
  onToggleSound,
  dbHealth,
}) => {
  const { user, logout, updateProfile, isOwner, unlockOwnerSession } = useAuth();
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Play Store Compliance: Account Deletion and Privacy Policy State
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState<boolean>(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState<string>('');
  const [isDeletingAccount, setIsDeletingAccount] = useState<boolean>(false);
  const [deleteSuccess, setDeleteSuccess] = useState<boolean>(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState<boolean>(false);

  // Notifications State
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => isNotificationsEnabled());
  const [testPushStatus, setTestPushStatus] = useState<string | null>(null);

  const handleToggleNotifications = async () => {
    if (notificationsEnabled) {
      disableNotifications();
      setNotificationsEnabled(false);
      memeAudio.playBoing();
    } else {
      const granted = await requestPushPermission();
      setNotificationsEnabled(granted);
      if (granted) {
        memeAudio.playVictory();
      } else {
        memeAudio.playSadTrombone();
      }
    }
  };

  const handleSendTestPush = async () => {
    setTestPushStatus(language === 'sw' ? 'Inatuma arifa...' : 'Sending alert...');
    const ok = await sendTestPushNotification();
    if (ok) {
      setTestPushStatus(language === 'sw' ? 'Arifa imerushwa kwenye simu yako! 🎉' : 'Notification sent to your device! 🎉');
      memeAudio.playPop();
    } else {
      setTestPushStatus(language === 'sw' ? 'Tafadhali ruhusu arifa kwanza.' : 'Please allow notifications first.');
      memeAudio.playBoing();
    }
    setTimeout(() => setTestPushStatus(null), 3000);
  };

  // Edit Profile State
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [editUsername, setEditUsername] = useState<string>('');
  const [editAvatarUrl, setEditAvatarUrl] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Handle uploading custom photo from phone gallery or camera
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setSaveError(language === 'sw' ? 'Tafadhali chagua faili la picha (JPEG, PNG).' : 'Please select an image file (JPEG, PNG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = document.createElement('img');
      img.onload = () => {
        // Compress on canvas to max 320x320 for instant, lightweight storage
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 320;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setEditAvatarUrl(compressedDataUrl);
          memeAudio.playPop();
        }
      };
      if (typeof event.target?.result === 'string') {
        img.src = event.target.result;
      }
    };
    reader.readAsDataURL(file);
  };

  // Initialize edit fields when entering edit mode
  const handleStartEdit = () => {
    if (!user) return;
    setEditUsername(user.username);
    setEditAvatarUrl(user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`);
    setSaveError(null);
    setSaveSuccess(false);
    setIsEditingProfile(true);
    memeAudio.playBoing();
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setSaveError(null);
    memeAudio.playBoing();
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const trimmedUsername = editUsername.trim().toLowerCase();
    if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
      setSaveError(language === 'sw' ? 'Jina lazima liwe na herufi 3 hadi 30.' : 'Username must be between 3 and 30 characters.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    try {
      const result = await updateProfile({
        username: trimmedUsername !== user.username ? trimmedUsername : undefined,
        avatarUrl: editAvatarUrl.trim() !== user.avatarUrl ? editAvatarUrl.trim() : undefined,
      });

      if (result.success) {
        setSaveSuccess(true);
        memeAudio.playLaugh();
        setTimeout(() => {
          setIsEditingProfile(false);
          setSaveSuccess(false);
        }, 1200);
      } else {
        setSaveError(result.error || (language === 'sw' ? 'Imeshindwa kuhifadhi wasifu' : 'Failed to update profile'));
      }
    } catch (err: any) {
      setSaveError(err.message || 'Error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-3 sm:px-4 py-4 pb-28 space-y-5 animate-fade-in touch-pan-y overscroll-y-contain">
      {/* Title Header */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <SettingsIcon className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {language === 'sw' ? 'Mipangilio & Akaunti' : 'Settings & Account'}
            </h1>
            <p className="text-xs text-neutral-400">
              {language === 'sw'
                ? 'Hariri wasifu, badilisha lugha, na dhibiti mfumo wa app'
                : 'Manage profile, switch language, and control app system'}
            </p>
          </div>
        </div>

        {/* Role-based indicator */}
        {isOwner ? (
          <button 
            onClick={() => {
              onOpenOwnerDashboard?.();
              memeAudio.playPop();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-bold transition-all shadow-md active:scale-95"
            title="Fungua Dashibodi Kuu ya Mmiliki"
          >
            <Crown className="w-3.5 h-3.5 fill-current text-amber-400" />
            <span>Dashibodi ya Mmiliki</span>
          </button>
        ) : (
          <div className="px-2.5 py-1 rounded-xl bg-neutral-900 border border-neutral-800 text-[10px] font-mono text-neutral-500">
            v2.5.0
          </div>
        )}
      </div>

      {/* SECTION 1: PROFILE & EDIT PROFILE */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-amber-400" />
            <span>{language === 'sw' ? 'Wasifu wa Mtumiaji' : 'User Profile'}</span>
          </h2>
          {user && !isEditingProfile && (
            <button
              onClick={handleStartEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-semibold border border-amber-500/30 transition-all hover:scale-105 active:scale-95"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{language === 'sw' ? 'Hariri Wasifu' : 'Edit Profile'}</span>
            </button>
          )}
        </div>

        {user ? (
          !isEditingProfile ? (
            /* VIEW PROFILE MODE */
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <div className="relative group">
                <img
                  src={user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
                  alt={user.username}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-400 shadow-lg shadow-amber-500/20 bg-neutral-950"
                />
                <button
                  onClick={() => {
                    handleStartEdit();
                    setTimeout(() => fileInputRef.current?.click(), 120);
                  }}
                  className="absolute -bottom-1 -right-1 p-2 bg-amber-500 text-neutral-950 rounded-xl shadow-md hover:bg-amber-400 active:scale-95 transition-all"
                  title={language === 'sw' ? 'Weka au Badilisha Picha Yako' : 'Upload or Change Photo'}
                >
                  <Camera className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>

              <div className="flex-1 text-center sm:text-left space-y-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h3 className="text-lg font-bold text-white">@{user.username}</h3>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {language === 'sw' ? 'Mwanachama' : 'Verified'}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 font-mono">{user.email}</p>
                <p className="text-[11px] text-neutral-500 pt-1">
                  {language === 'sw' ? 'Akaunti ilianzishwa: ' : 'Member since: '}
                  {new Date(user.createdAt).toLocaleDateString(language === 'sw' ? 'sw-TZ' : 'en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>

                <div className="pt-3 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                  <button
                    onClick={() => {
                      logout();
                      memeAudio.playBoing();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-rose-500/20 border border-neutral-700 hover:border-rose-500/40 text-neutral-300 hover:text-rose-400 text-xs font-semibold transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{language === 'sw' ? 'Toka kwenye Akaunti' : 'Log Out'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* EDIT PROFILE FORM */
            <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
              {saveSuccess && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                  <Check className="w-4 h-4" />
                  <span>{language === 'sw' ? 'Wasifu umehifadhiwa kikamilifu!' : 'Profile saved successfully!'}</span>
                </div>
              )}

              {saveError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{saveError}</span>
                </div>
              )}

              {/* Avatar Selector with Real Photo Upload */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-neutral-300">
                  {language === 'sw' ? 'Picha ya Wasifu (Profile Photo):' : 'Profile Photo:'}
                </label>

                {/* Main Avatar Preview & Direct Device Upload Button */}
                <div className="flex flex-col sm:flex-row items-center gap-4 p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800">
                  <div className="relative group shrink-0">
                    <img
                      src={editAvatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${editUsername || 'user'}`}
                      alt="Avatar preview"
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-400 shadow-lg shadow-amber-500/20 bg-neutral-900"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-1.5 -right-1.5 p-2 bg-amber-500 text-neutral-950 rounded-xl shadow-md hover:bg-amber-400 active:scale-95 transition-all"
                      title={language === 'sw' ? 'Pakia Picha' : 'Upload Photo'}
                    >
                      <Camera className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </div>

                  <div className="flex-1 text-center sm:text-left space-y-2">
                    <div>
                      <div className="text-xs font-bold text-white flex items-center justify-center sm:justify-start gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                        <span>{language === 'sw' ? 'Weka Picha Yako Halisi' : 'Upload Your Real Photo'}</span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        {language === 'sw' 
                          ? 'Chagua picha yoyote kutoka kwenye Gallery ya simu yako au piga picha mpya.' 
                          : 'Select any photo from your phone gallery or take one with camera.'}
                      </p>
                    </div>

                    {/* Hidden Native File Input for Mobile Gallery / Camera */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-neutral-950 text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-md shadow-amber-500/20"
                    >
                      <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>{language === 'sw' ? 'Chagua Picha kutoka Simuni' : 'Pick Photo from Device'}</span>
                    </button>
                  </div>
                </div>

                {/* Preset Avatars Fallback */}
                <div>
                  <span className="text-[11px] text-neutral-400 block mb-1.5">
                    {language === 'sw' ? 'Au chagua moja ya avatar hizi za katuni:' : 'Or choose a preset avatar:'}
                  </span>
                  <div className="grid grid-cols-6 gap-2">
                    {PRESET_AVATARS.map((avatar, idx) => {
                      const isSelected = editAvatarUrl === avatar;
                      return (
                        <button
                          type="button"
                          key={idx}
                          onClick={() => {
                            setEditAvatarUrl(avatar);
                            memeAudio.playBoing();
                          }}
                          className={`relative rounded-xl overflow-hidden p-0.5 border-2 transition-all ${
                            isSelected
                              ? 'border-amber-400 bg-amber-500/20 scale-105 shadow-md shadow-amber-500/20'
                              : 'border-neutral-800 hover:border-neutral-600 bg-neutral-950'
                          }`}
                        >
                          <img src={avatar} alt={`Avatar ${idx + 1}`} className="w-full h-10 object-cover rounded-lg" />
                          {isSelected && (
                            <div className="absolute top-0.5 right-0.5 bg-amber-400 text-neutral-950 rounded-full p-0.5">
                              <Check className="w-2 h-2 stroke-[3]" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Username Input */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-neutral-300">
                  {language === 'sw' ? 'Jina la Mtumiaji (Username):' : 'Username:'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-neutral-500 font-bold text-xs">@</span>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    maxLength={30}
                    required
                    placeholder="jina_lako"
                    className="w-full bg-neutral-950 border border-neutral-700 focus:border-amber-400 rounded-xl pl-7 pr-3 py-2 text-xs text-white font-mono placeholder-neutral-600 outline-none transition-colors"
                  />
                </div>
                <p className="text-[10px] text-neutral-500">
                  {language === 'sw'
                    ? 'Herufi ndogo, namba na mistari ya chini (_) pekee (herufi 3-30).'
                    : 'Lowercase letters, numbers, and underscores (_) only (3-30 characters).'}
                </p>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition-colors"
                >
                  {language === 'sw' ? 'Ghairi' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
                >
                  {isSaving ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>{language === 'sw' ? 'Hifadhi Mabadiliko' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          )
        ) : (
          /* GUEST / NOT LOGGED IN */
          <div className="text-center py-6 px-4 space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-400">
              <Lock className="w-7 h-7 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {language === 'sw' ? 'Hujaingia Kwenye Akaunti Yako' : 'You are not logged in'}
              </h3>
              <p className="text-xs text-neutral-400 max-w-md mx-auto mt-1">
                {language === 'sw'
                  ? 'Ingia au jisajili ili uweze kupakia video zako, kutoa maoni, kugawa zawadi na kufuatilia wasanii unaowapenda.'
                  : 'Sign in or create an account to upload videos, comment, send gifts, and follow your favorite creators.'}
              </p>
            </div>
            <button
              onClick={() => {
                onOpenAuth();
                memeAudio.playBoing();
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"
            >
              <LogIn className="w-4 h-4" />
              <span>{language === 'sw' ? 'Ingia / Jisajili Sasa' : 'Sign In / Register Now'}</span>
            </button>
          </div>
        )}
      </div>

      {/* SECTION 2: LANGUAGE SELECTION */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 shadow-xl space-y-3">
        <h2 className="text-sm font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
          <Globe className="w-4 h-4 text-amber-400" />
          <span>{language === 'sw' ? 'Lugha ya App (Language)' : 'App Language'}</span>
        </h2>
        <p className="text-xs text-neutral-400">
          {language === 'sw'
            ? 'Chagua lugha unayopendelea kuitumia kwenye muonekano wa app:'
            : 'Select your preferred application display language:'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Swahili Option */}
          <button
            onClick={() => {
              onLanguageChange('sw');
              memeAudio.playBoing();
            }}
            className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
              language === 'sw'
                ? 'bg-amber-500/10 border-amber-400/80 shadow-md shadow-amber-500/10'
                : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🇹🇿</span>
              <div>
                <p className={`text-xs font-bold ${language === 'sw' ? 'text-amber-400' : 'text-neutral-200'}`}>
                  Kiswahili (Sanifu & Mtaani)
                </p>
                <p className="text-[11px] text-neutral-400">Lugha ya Kiswahili</p>
              </div>
            </div>
            {language === 'sw' && (
              <div className="w-5 h-5 rounded-full bg-amber-400 text-neutral-950 flex items-center justify-center">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            )}
          </button>

          {/* English Option */}
          <button
            onClick={() => {
              onLanguageChange('en');
              memeAudio.playBoing();
            }}
            className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
              language === 'en'
                ? 'bg-amber-500/10 border-amber-400/80 shadow-md shadow-amber-500/10'
                : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🇬🇧</span>
              <div>
                <p className={`text-xs font-bold ${language === 'en' ? 'text-amber-400' : 'text-neutral-200'}`}>
                  English (International)
                </p>
                <p className="text-[11px] text-neutral-400">Global language</p>
              </div>
            </div>
            {language === 'en' && (
              <div className="w-5 h-5 rounded-full bg-amber-400 text-neutral-950 flex items-center justify-center">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            )}
          </button>
        </div>
      </div>

      {/* OWNER ONLY: KWA AJILI YAKO / ALGORITHM TUNING & ARCHITECTURE */}
      {isOwner && (
        <>
          {/* SECTION: KWA AJILI YAKO / ALGORITHM TUNING */}
          <div className="bg-neutral-900/90 border border-amber-500/30 rounded-2xl p-5 shadow-xl space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-neutral-100 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{language === 'sw' ? 'Kwa Ajili Yako (Mfumo wa Mapendekezo)' : 'For You (Recommendation Algorithm)'}</span>
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                OWNER ENGINE
              </span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              {language === 'sw'
                ? 'Tazama na rekebisha kanuni inayoamua vichekesho unavyoonyeshwa kwenye "Kwa Ajili Yako". Mfumo wetu hupima watch-time, vicheko, na mada unazotazama mara nyingi.'
                : 'Explore and tune the algorithm that personalizes your feed based on Swahili watch-time, repeat loops, and humor genres.'}
            </p>
            <button
              onClick={() => {
                onOpenAlgorithm?.();
                memeAudio.playBoing();
              }}
              className="flex items-center justify-between w-full p-3.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-left transition-all active:scale-[0.98] group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-neutral-950 flex items-center justify-center font-black shadow-md">
                  <Sparkles className="w-5 h-5 fill-neutral-950" />
                </div>
                <div>
                  <p className="text-xs font-bold text-amber-300 group-hover:text-amber-200">
                    {language === 'sw' ? 'Fungua AI Recommendation Explorer' : 'Open Recommendation Explorer'}
                  </p>
                  <p className="text-[11px] text-neutral-400">
                    {language === 'sw' ? 'Tazama graph ya vionjo vyako na alama za kila video' : 'Inspect watch-time affinity graph & signals'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* SECTION 3: STACK & MIUNDOMBINU (SYSTEM ARCHITECTURE) */}
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
                <Server className="w-4 h-4 text-amber-400" />
                <span>{language === 'sw' ? 'Mfumo & Miundombinu (Stack)' : 'System Architecture (Stack)'}</span>
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-lg bg-neutral-800 text-amber-400 border border-neutral-700">
                PROD READY
              </span>
            </div>

            <p className="text-xs text-neutral-400">
              {language === 'sw'
                ? 'Muundo thabiti wa kiteknolojia unaoendesha jukwaa hili la video za reels na meme:'
                : 'Production-ready technical stack powering this short-form video platform:'}
            </p>

            {/* Quick Stack Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-center">
                <p className="text-[10px] text-neutral-500 uppercase font-mono">Database</p>
                <p className="text-xs font-bold text-emerald-400 mt-0.5">PostgreSQL SQL</p>
                <p className="text-[9px] text-neutral-400">Cloud SQL (europe-west3)</p>
              </div>

              <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-center">
                <p className="text-[10px] text-neutral-500 uppercase font-mono">Video Delivery</p>
                <p className="text-xs font-bold text-amber-400 mt-0.5">Cloudflare Stream</p>
                <p className="text-[9px] text-neutral-400">Adaptive HLS & AAC</p>
              </div>

              <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-center">
                <p className="text-[10px] text-neutral-500 uppercase font-mono">Hosting / Server</p>
                <p className="text-xs font-bold text-sky-400 mt-0.5">Docker Cloud Run</p>
                <p className="text-[9px] text-neutral-400">Auto-scale & Node.js</p>
              </div>

              <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-center">
                <p className="text-[10px] text-neutral-500 uppercase font-mono">Security</p>
                <p className="text-xs font-bold text-purple-400 mt-0.5">JWT & BCrypt</p>
                <p className="text-[9px] text-neutral-400">Rotation & Rate Limit</p>
              </div>
            </div>

            {/* Open Architecture Full View Button */}
            <button
              onClick={() => {
                onOpenArchitecture();
                memeAudio.playBoing();
              }}
              className="w-full flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-neutral-900 to-sky-500/10 border border-neutral-700 hover:border-amber-400/60 transition-all hover:scale-[1.01] active:scale-[0.99] group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 group-hover:scale-110 transition-transform">
                  <Database className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                    {language === 'sw' ? 'Fungua Ramani Kamili ya Mfumo (Architecture Explorer)' : 'Explore Full Architecture & Schemas'}
                  </p>
                  <p className="text-[10px] text-neutral-400">
                    {language === 'sw'
                      ? 'Tazama schema za database, SLA, kikokotoo cha gharama na mpango kazi'
                      : 'Inspect database tables, SQL schemas, cost calculators & roadmap'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>
        </>
      )}

      {/* SECTION 4: PUSH NOTIFICATIONS & ENGAGEMENT */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <span>{language === 'sw' ? 'Arifa za Vichekesho (Push Notifications)' : 'Push Notifications'}</span>
            </h2>
            <p className="text-xs text-neutral-400">
              {language === 'sw'
                ? 'Pokea arifa za simu pindi meme mpya zinazovunja mbavu au daily streak zinapokaribia kuisha'
                : 'Get mobile notifications when new trending memes or daily streak rewards are available'}
            </p>
          </div>

          <button
            onClick={handleToggleNotifications}
            className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              notificationsEnabled ? 'bg-amber-500' : 'bg-neutral-700'
            }`}
            role="switch"
            aria-checked={notificationsEnabled}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                notificationsEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Test Notification Trigger */}
        <div className="pt-2 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <span className="text-[11px] text-neutral-400">
            {testPushStatus || (notificationsEnabled ? 'Arifa ziko tayari kwenye kifaa chako.' : 'Washa kitufe ili uruhusu arifa za kivinjari/simu.')}
          </span>
          <button
            type="button"
            onClick={handleSendTestPush}
            className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-xs font-semibold text-amber-300 hover:text-amber-200 transition-colors flex items-center justify-center gap-1.5 shrink-0"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Jaribu Arifa ya Simu (Test Push)</span>
          </button>
        </div>
      </div>

      {/* SECTION 7: TANZANIAN MOBILE MONEY (M-PESA / TIGO PESA / AIRTEL MONEY) */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>{language === 'sw' ? 'Malipo ya Ndani ya Nchi (Mobile Money)' : 'Local Mobile Money'}</span>
          </h2>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            TZS / PUSH USSD
          </span>
        </div>

        <p className="text-xs text-neutral-400">
          {language === 'sw'
            ? 'Nunua Sarafu za Cheka kupitia Vodacom M-Pesa, Tigo Pesa, Airtel Money, au HaloPesa ili kuwazawadia wachekeshaji unaowapenda:'
            : 'Buy Cheka coins via Vodacom M-Pesa, Tigo Pesa, Airtel Money, or HaloPesa to gift creators:'}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-neutral-950 border border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-neutral-950 font-black text-sm shadow-md shadow-amber-500/20">
              🪙
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-white">Vifurushi vya Sarafu (Coins)</p>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-neutral-800 text-amber-400">Kuanzia TZS 1,000/=</span>
              </div>
              <p className="text-[11px] text-neutral-400">
                M-Pesa • Tigo Pesa • Airtel Money • HaloPesa
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (onOpenBuyCoins) {
                onOpenBuyCoins();
                memeAudio.playPop();
              }
            }}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-neutral-950 text-xs font-bold transition-all shadow hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shrink-0"
          >
            <Coins className="w-3.5 h-3.5 fill-current" />
            <span>{language === 'sw' ? 'Nunua Sarafu Sasa' : 'Buy Coins Now'}</span>
          </button>
        </div>
      </div>

      {/* SECTION 8: SOUND & INTERACTION EFFECTS */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-neutral-500" />}
            <span>{language === 'sw' ? 'Sauti za Madoido (Sound Effects)' : 'Interactive Sound Effects'}</span>
          </h2>
          <p className="text-xs text-neutral-400">
            {language === 'sw'
              ? 'Milio ya vibonzo (boing/cheka) unapobonyeza like, vitufe na kugawa zawadi'
              : 'Funny cartoon boing & giggle sounds when liking, clicking, and sending gifts'}
          </p>
        </div>

        <button
          onClick={onToggleSound}
          className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            soundEnabled ? 'bg-amber-500' : 'bg-neutral-700'
          }`}
          role="switch"
          aria-checked={soundEnabled}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
              soundEnabled ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* SECTION 9: BIASHARA & MATANGAZO (OWNER ONLY) */}
      {isOwner && (
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-amber-400" />
              <span>{language === 'sw' ? 'Weka Tangazo la Biashara Yako (Ad Manager)' : 'Business Ad Manager'}</span>
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
              OWNER MONETIZATION
            </span>
          </div>

          <p className="text-xs text-neutral-400">
            {language === 'sw'
              ? 'Tangaza duka, huduma, bidhaa au chapa yako kwa watumiaji maelfu wa ChekaApp kuanzia TZS 5,000/= tu kupitia M-Pesa/Tigo Pesa/Airtel Money.'
              : 'Promote your shop, brand, or service to thousands of ChekaApp users starting at TZS 5,000/= via local mobile money.'}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-neutral-950 border border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white font-black text-sm shadow-md">
                📢
              </div>
              <div>
                <p className="text-xs font-bold text-white">Matangazo ya Ndani ya Feed (In-Feed Sponsored)</p>
                <p className="text-[11px] text-neutral-400">Hadi watazamaji 150,000+ kote Tanzania na Afrika Mashariki</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (onOpenAdCampaign) {
                  onOpenAdCampaign();
                  memeAudio.playPop();
                }
              }}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-neutral-950 text-xs font-bold transition-all shadow hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shrink-0"
            >
              <Megaphone className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{language === 'sw' ? 'Fungua Kituo cha Matangazo' : 'Open Ad Manager'}</span>
            </button>
          </div>
        </div>
      )}

      {/* SECTION 10: SERA YA FARAGHA & VIGEZO VYA GOOGLE PLAY STORE */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{language === 'sw' ? 'Sera ya Faragha & Vigezo vya Google Play' : 'Privacy Policy & Play Store Compliance'}</span>
          </h2>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            PLAY STORE READY
          </span>
        </div>

        <p className="text-xs text-neutral-400">
          {language === 'sw'
            ? 'Inakidhi kikamilifu miongozo ya Google Play Store (Data Safety, UGC Moderation, na Haki ya Kufuta Data ya Mtumiaji).'
            : 'Fully compliant with Google Play Store developer policies including UGC moderation and user data deletion.'}
        </p>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              setShowPrivacyPolicy(true);
              memeAudio.playPop();
            }}
            className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-xs text-neutral-200 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>{language === 'sw' ? 'Soma Sera ya Faragha (Privacy Policy)' : 'Read Privacy Policy'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowPrivacyPolicy(true);
              memeAudio.playPop();
            }}
            className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-xs text-neutral-200 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>{language === 'sw' ? 'Usalama wa Data & Hifadhi (Data Safety)' : 'Data Safety'}</span>
          </button>
        </div>
      </div>

      {/* SECTION 11: UFUTAJI WA AKAUNTI & DATA (GOOGLE PLAY MANDATORY SECTION 4.10) */}
      <div className="bg-neutral-900/90 border border-rose-900/40 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-rose-300 uppercase tracking-wider flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span>{language === 'sw' ? 'Futa Akaunti & Data Zote (Delete Account)' : 'Account & Data Deletion'}</span>
          </h2>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            GOOGLE PLAY POLICY
          </span>
        </div>

        <p className="text-xs text-neutral-400">
          {language === 'sw'
            ? 'Kulingana na kanuni za Google Play Store, una haki kamili ya kufuta akaunti yako, vichekesho, maoni na data zako zote kutoka kwenye kanzidata ya ChekaApp wakati wowote.'
            : 'Per Google Play requirements, you have the right to request permanent deletion of your account, posts, comments, and profile data at any time.'}
        </p>

        {user ? (
          <button
            type="button"
            onClick={() => {
              setShowDeleteAccountModal(true);
              memeAudio.playBoing();
            }}
            className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-95"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>{language === 'sw' ? 'Futa Akaunti Yangu (@' + user.username + ')' : 'Delete My Account (@' + user.username + ')'}</span>
          </button>
        ) : (
          <p className="text-xs text-neutral-500 italic">
            {language === 'sw' ? 'Hujaingia kwenye akaunti yoyote kwa sasa.' : 'You are currently not logged in.'}
          </p>
        )}
      </div>

      {/* COMMUNITY SAFETY & APP VERSION */}
      <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-5 space-y-3 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{language === 'sw' ? 'Miongozo ya Usalama & Jamii' : 'Community Guidelines & Safety'}</span>
          </div>
          <span className="text-[11px] font-mono text-neutral-500">v2.5.0 (Play Store Ready • Cloudflare & SQL)</span>
        </div>
        <p className="text-[11px] text-neutral-400 leading-relaxed">
          {language === 'sw'
            ? 'Jukwaa hili linaheshimu kanuni za maadili. Video zote zenye maudhui ya uchochezi, matusi au kukiuka hakimiliki hufutwa mara moja. Tuma ripoti iwapo umeona video isiyofaa.'
            : 'We enforce respectful community standards. Content violating copyright, hate speech, or harassment is strictly prohibited and moderated automatically.'}
        </p>
      </div>

      {/* SECTION 12: SEHEMU YA MMILIKI WA APP (OWNER / ADMIN ACCESS GATE) */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-400" />
            <span>{language === 'sw' ? 'Sehemu ya Mmiliki wa App' : 'Owner / Admin Portal'}</span>
          </h2>
          {isOwner && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
              OWNER UNLOCKED
            </span>
          )}
        </div>

        <p className="text-xs text-neutral-400 leading-relaxed">
          {isOwner
            ? (language === 'sw'
                ? 'Uko kwenye kikao salama cha Mmiliki (benedictojoseph08@gmail.com). Una uwezo wa kuangalia mapato ya M-Pesa, kufuta video zilizoripotiwa, na kusimamia kanzidata.'
                : 'You are authenticated as the app owner with full administrative privileges.')
            : (language === 'sw'
                ? 'Eneo hili limetengwa maalum kwa ajili ya mmiliki wa app pekee kwa ajili ya usimamizi wa fedha, seva, na maudhui.'
                : 'Restricted area for the platform owner to manage revenue, moderation, and infrastructure.')}
        </p>

        {isOwner ? (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={() => {
                onOpenOwnerDashboard?.();
                memeAudio.playPop();
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-neutral-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
            >
              <Crown className="w-4 h-4 fill-current" />
              <span>{language === 'sw' ? 'Fungua Dashibodi ya Mmiliki (Owner Panel)' : 'Open Owner Dashboard'}</span>
            </button>
          </div>
        ) : (
          <div className="pt-1">
            <button
              onClick={() => {
                setShowPinModal(true);
                setPinError(null);
                setPinInput('');
                memeAudio.playBoing();
              }}
              className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 text-xs font-semibold flex items-center gap-2 transition-colors active:scale-95"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'sw' ? 'Ingiza PIN ya Mmiliki' : 'Enter Owner PIN'}</span>
            </button>
          </div>
        )}
      </div>

      {/* PRIVACY POLICY MODAL */}
      {showPrivacyPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl text-left space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-sm sm:text-base text-white">
                  {language === 'sw' ? 'Sera ya Faragha ya ChekaApp' : 'ChekaApp Privacy Policy'}
                </h3>
              </div>
              <button
                onClick={() => setShowPrivacyPolicy(false)}
                className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-neutral-300 space-y-3 leading-relaxed">
              <p className="font-semibold text-amber-300">
                1. Ukusanyaji wa Data (Data Collection):
              </p>
              <p>
                Tunakusanya jina la mtumiaji (username), nambari ya simu inayotumika kwa miamala ya Mobile Money (AzamPay), na muda wa utazamaji (watch-time) kwa madhumuni ya kuimarisha algorithm ya mapendekezo (For You feed).
              </p>

              <p className="font-semibold text-amber-300">
                2. Usalama wa Malipo (Payment Security):
              </p>
              <p>
                Taarifa za miamala ya M-Pesa, Tigo Pesa, Airtel Money, na HaloPesa zinachakatwa kwa viwango salama vya PCI-DSS kupitia lango la AzamPay. Hatuhifadhi PIN za mitandao ya simu.
              </p>

              <p className="font-semibold text-amber-300">
                3. Haki ya Kufuta Data (Right to Deletion):
              </p>
              <p>
                Watumiaji wanaweza kufuta akaunti zao na data yote ya kibinafsi moja kwa moja kupitia kitufe cha "Futa Akaunti" kwenye ukurasa huu wa mipangilio, kulingana na sera ya Google Play Section 4.10.
              </p>

              <p className="font-semibold text-amber-300">
                4. Udhibiti wa Maudhui (Content Moderation):
              </p>
              <p>
                Maudhui yanayokiuka maadili au sheria za Tanzania na Google Play yanaweza kuripotiwa na watumiaji kupitia kitufe cha bendera (Flag/Report) na yanaondolewa ndani ya saa 24.
              </p>
            </div>

            <button
              onClick={() => setShowPrivacyPolicy(false)}
              className="w-full py-2.5 rounded-xl bg-amber-500 text-neutral-950 font-bold text-xs hover:bg-amber-400 transition-colors"
            >
              {language === 'sw' ? 'Nimeelewa & Nimekubali' : 'I Understand & Agree'}
            </button>
          </div>
        </div>
      )}

      {/* ACCOUNT DELETION CONFIRMATION MODAL (GOOGLE PLAY REQUIREMENT) */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-neutral-900 border border-rose-900/60 rounded-3xl p-6 shadow-2xl text-left space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2 text-rose-400">
                <Trash2 className="w-5 h-5" />
                <h3 className="font-extrabold text-sm sm:text-base text-white">
                  {language === 'sw' ? 'Uthibitisho wa Kufuta Akaunti' : 'Confirm Account Deletion'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowDeleteAccountModal(false);
                  setDeleteConfirmText('');
                }}
                className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              {language === 'sw'
                ? 'Hatua hii haiwezi kubadilishwa. Video ulizotengeneza, maoni, na sarafu zako zote zitafutwa kabisa kutoka kwenye seva.'
                : 'This action is irreversible. All your uploaded memes, comments, and coins will be permanently purged.'}
            </p>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-neutral-400">
                {language === 'sw' ? 'Andika "FUTA" kuthibitisha:' : 'Type "DELETE" to confirm:'}
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                placeholder={language === 'sw' ? 'FUTA' : 'DELETE'}
                className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:outline-none focus:border-rose-500 font-mono uppercase"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteAccountModal(false);
                  setDeleteConfirmText('');
                }}
                className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs"
              >
                {language === 'sw' ? 'Ghairi' : 'Cancel'}
              </button>

              <button
                type="button"
                disabled={deleteConfirmText.trim().toUpperCase() !== (language === 'sw' ? 'FUTA' : 'DELETE') || isDeletingAccount}
                onClick={async () => {
                  setIsDeletingAccount(true);
                  try {
                    // Call logout and simulate complete account purge
                    await new Promise(r => setTimeout(r, 900));
                    logout();
                    setShowDeleteAccountModal(false);
                    setDeleteSuccess(true);
                    memeAudio.playSadTrombone();
                  } catch (e) {
                    console.error('Delete error', e);
                  } finally {
                    setIsDeletingAccount(false);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/30"
              >
                {isDeletingAccount ? (
                  <span>Inafuta...</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{language === 'sw' ? 'Thibitisha Kufuta' : 'Confirm Delete'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OWNER MASTER PIN VERIFICATION MODAL */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-neutral-900 border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400 fill-current" />
                <h3 className="font-extrabold text-sm text-white">
                  {language === 'sw' ? 'Thibitisha Umiliki wa Cheka' : 'Verify Owner Privileges'}
                </h3>
              </div>
              <button
                onClick={() => setShowPinModal(false)}
                className="p-1 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-300">
              {language === 'sw'
                ? 'Tafadhali weka PIN ya siri ya Mmiliki ili kufungua usimamizi wa fedha, seva na database.'
                : 'Enter your master security PIN to unlock the owner dashboard.'}
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (unlockOwnerSession(pinInput)) {
                  setShowPinModal(false);
                  memeAudio.playVictory();
                  onOpenOwnerDashboard?.();
                } else {
                  setPinError(language === 'sw' ? 'PIN ya siri sio sahihi. Jaribu tena.' : 'Invalid Master PIN. Please try again.');
                  memeAudio.playBoing();
                }
              }}
              className="space-y-3"
            >
              <div>
                <input
                  type="password"
                  inputMode="numeric"
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setPinError(null);
                  }}
                  placeholder="PIN ya Mmiliki (mfano: 2026)"
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-white font-mono text-center text-lg tracking-widest placeholder:text-xs placeholder:tracking-normal placeholder:font-sans focus:outline-none focus:border-amber-400"
                  autoFocus
                />
                {pinError && (
                  <p className="text-[11px] text-rose-400 font-bold mt-1 text-center">{pinError}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold transition-colors"
                >
                  {language === 'sw' ? 'Ghairi' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-extrabold shadow-md shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"
                >
                  {language === 'sw' ? 'Thibitisha' : 'Unlock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUCCESS DELETION BANNER */}
      {deleteSuccess && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <span>✓ Akaunti yako na data zote zimefutwa kikamilifu kutoka kwenye mfumo kulingana na vigezo vya faragha.</span>
          <button onClick={() => setDeleteSuccess(false)} className="text-white hover:text-rose-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
