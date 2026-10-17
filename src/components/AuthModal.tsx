import React, { useState } from 'react';
import { X, Lock, Mail, User, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Language } from '../types';
import { memeAudio } from '../utils/audioSynth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, language }) => {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (mode === 'signup') {
      if (password.length < 8) {
        setError(language === 'sw' ? 'Nenosiri lazima liwe na herufi 8 au zaidi' : 'Password must be at least 8 characters');
        setIsSubmitting(false);
        return;
      }
      if (username.length < 3 || username.length > 20) {
        setError(language === 'sw' ? 'Jina la mtumiaji lazima liwe herufi 3 hadi 20' : 'Username must be between 3 and 20 characters');
        setIsSubmitting(false);
        return;
      }

      const res = await signup(username, email, password);
      setIsSubmitting(false);
      if (res.success) {
        memeAudio.playLaugh();
        setSuccessMsg(language === 'sw' ? 'Umefanikiwa kujisajili! Karibu Cheka.' : 'Account created successfully! Welcome to Cheka.');
        setTimeout(() => {
          setSuccessMsg(null);
          onClose();
        }, 1200);
      } else {
        memeAudio.playSadTrombone();
        setError(res.error || 'Signup failed');
      }
    } else {
      const res = await login(email, password);
      setIsSubmitting(false);
      if (res.success) {
        memeAudio.playBoing();
        setSuccessMsg(language === 'sw' ? 'Umefanikiwa kuingia!' : 'Login successful!');
        setTimeout(() => {
          setSuccessMsg(null);
          onClose();
        }, 1000);
      } else {
        memeAudio.playSadTrombone();
        setError(res.error || 'Login failed');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fade-in">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl bg-neutral-900 border border-neutral-800 p-6 shadow-2xl z-10 text-neutral-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500 text-neutral-950 flex items-center justify-center font-bold text-sm">
              😂
            </div>
            <h3 className="font-bold text-base">
              {mode === 'login'
                ? language === 'sw' ? 'Ingia kwenye Cheka' : 'Sign In to Cheka'
                : language === 'sw' ? 'Fungua Akaunti Mpya' : 'Create an Account'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode switcher tabs */}
        <div className="flex items-center bg-neutral-950 p-1 rounded-xl border border-neutral-800 mt-4 mb-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
              memeAudio.playBoing();
            }}
            className={`flex-1 py-1.5 rounded-lg transition-colors ${
              mode === 'login'
                ? 'bg-amber-500 text-neutral-950 shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            {language === 'sw' ? 'Ingia (Login)' : 'Sign In'}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError(null);
              memeAudio.playBoing();
            }}
            className={`flex-1 py-1.5 rounded-lg transition-colors ${
              mode === 'signup'
                ? 'bg-amber-500 text-neutral-950 shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            {language === 'sw' ? 'Jisajili (Sign Up)' : 'Register'}
          </button>
        </div>

        {/* Error or Success notification */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <div>
              <label className="block text-[11px] text-neutral-400 mb-1 font-medium">
                {language === 'sw' ? 'Jina la Mtumiaji (Username)' : 'Username'}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="mfano: mchekeshaji_tz"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-neutral-100 placeholder-neutral-500 outline-none focus:border-amber-500 transition-colors"
                />
              </div>
              <span className="text-[10px] text-neutral-500 mt-1 block">
                {language === 'sw' ? 'Herufi 3-20 bila nafasi' : '3-20 alphanumeric characters'}
              </span>
            </div>
          )}

          <div>
            <label className="block text-[11px] text-neutral-400 mb-1 font-medium">
              {language === 'sw' ? 'Barua Pepe (Email)' : 'Email'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="mfano: mchekeshaji@cheka.io"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-neutral-100 placeholder-neutral-500 outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-neutral-400 mb-1 font-medium">
              {language === 'sw' ? 'Nenosiri (Password)' : 'Password'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-neutral-100 placeholder-neutral-500 outline-none focus:border-amber-500 transition-colors"
              />
            </div>
            {mode === 'signup' && (
              <span className="text-[10px] text-neutral-500 mt-1 block">
                {language === 'sw' ? 'Herufi 8 au zaidi (bcrypt cost 12)' : '8+ characters (bcrypt factor 12)'}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5 mt-2"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : mode === 'login' ? (
              <span>{language === 'sw' ? 'Ingia Sasa' : 'Sign In'}</span>
            ) : (
              <span>{language === 'sw' ? 'Kamilisha Usajili' : 'Complete Registration'}</span>
            )}
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-neutral-800/80 text-center text-[11px] text-neutral-500">
          {mode === 'login' ? (
            <span>
              {language === 'sw' ? 'Huna akaunti bado? ' : "Don't have an account? "}
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="text-amber-400 hover:underline font-semibold"
              >
                {language === 'sw' ? 'Jisajili hapa' : 'Sign up here'}
              </button>
            </span>
          ) : (
            <span>
              {language === 'sw' ? 'Una akaunti tayari? ' : 'Already have an account? '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-amber-400 hover:underline font-semibold"
              >
                {language === 'sw' ? 'Ingia hapa' : 'Sign in here'}
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
