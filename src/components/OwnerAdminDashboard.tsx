import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Crown, 
  DollarSign, 
  Users, 
  Film, 
  Activity, 
  Server, 
  AlertTriangle, 
  CheckCircle2, 
  Trash2, 
  Eye, 
  Megaphone, 
  Sparkles, 
  ArrowLeft, 
  Lock, 
  TrendingUp, 
  CreditCard, 
  Search, 
  Check, 
  X, 
  Clock, 
  Radio, 
  RefreshCw,
  Sliders,
  Send,
  Download,
  Loader2,
  Timer,
  Laptop,
  Smartphone
} from 'lucide-react';
import { MemeVideo, Language, Creator } from '../types';
import { memeAudio } from '../utils/audioSynth';
import { useAuth } from '../context/AuthContext';

interface OwnerAdminDashboardProps {
  videos: MemeVideo[];
  onDeleteVideo?: (videoId: string) => void;
  onVerifyCreator?: (creatorId: string) => void;
  onClose: () => void;
  language: Language;
  dbHealth: {
    status: 'ok' | 'error' | 'loading';
    database?: string;
    pool?: { total: number; idle: number; waiting: number };
    error?: string;
  };
  onOpenArchitecture: () => void;
  onOpenAlgorithm: () => void;
}

export const OwnerAdminDashboard: React.FC<OwnerAdminDashboardProps> = ({
  videos,
  onDeleteVideo,
  onVerifyCreator,
  onClose,
  language,
  dbHealth,
  onOpenArchitecture,
  onOpenAlgorithm
}) => {
  const { user, lockOwnerSession } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'revenue' | 'users' | 'moderation' | 'database' | 'ads' | 'visitors'>('overview');
  
  // Real live statistics state from PostgreSQL
  const [loadingStats, setLoadingStats] = useState<boolean>(true);
  const [stats, setStats] = useState<{
    totalUsers: number;
    totalVideos: number;
    totalRevenue: number;
    netRevenue: number;
    totalTransactions: number;
    recentPayments: Array<{
      id: string;
      phone: string;
      operator: string;
      amount: number;
      coins: number;
      status: string;
      ref: string;
      createdAt: string;
    }>;
    operatorStats: Array<{
      operator: string;
      operatorName: string;
      totalAmount: number;
      count: number;
    }>;
    flaggedVideos: Array<{
      id: string;
      caption: string;
      status: string;
      createdAt: string;
      creator: { id: string; username: string };
    }>;
    visitorAnalytics?: {
      totalVisits: number;
      uniqueVisitors: number;
      todayVisits: number;
      todayUniqueVisitors: number;
      activeNow: number;
      avgDurationSec: number;
      totalTimeSpentSec: number;
      recentSessions: Array<{
        session_id: string;
        visitor_id: string;
        username: string | null;
        device_type: string | null;
        duration_sec: number;
        reels_watched: number;
        started_at: string;
        last_heartbeat_at: string;
        is_live: boolean;
      }>;
    };
  }>({
    totalUsers: 0,
    totalVideos: 0,
    totalRevenue: 0,
    netRevenue: 0,
    totalTransactions: 0,
    recentPayments: [],
    operatorStats: [],
    flaggedVideos: [],
    visitorAnalytics: {
      totalVisits: 0,
      uniqueVisitors: 0,
      todayVisits: 0,
      todayUniqueVisitors: 0,
      activeNow: 0,
      avgDurationSec: 0,
      totalTimeSpentSec: 0,
      recentSessions: [],
    }
  });

  const formatDurationSwahili = (sec: number): string => {
    if (!sec || sec <= 0) return 'Sekunde chache';
    if (sec < 60) return `${sec}s`;
    const mins = Math.floor(sec / 60);
    const remSec = sec % 60;
    if (mins < 60) {
      return remSec > 0 ? `${mins}m ${remSec}s` : `${mins}m`;
    }
    const hours = Math.floor(mins / 60);
    const remM = mins % 60;
    return `${hours}h ${remM}m`;
  };

  // Detailed registered users audit
  const [usersList, setUsersList] = useState<Array<{
    id: string;
    username: string;
    email: string;
    avatarUrl: string | null;
    createdAt: string;
    videoCount: number;
  }>>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');

  const fetchUsersList = async () => {
    try {
      setLoadingUsers(true);
      const res = await fetch('/api/admin/users-audit');
      if (res.ok) {
        const data = await res.json();
        setUsersList(data.users || []);
      }
    } catch (err) {
      console.error('Error fetching users audit:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchLiveStats = async () => {
    try {
      setLoadingStats(true);
      const res = await fetch('/api/admin/owner-stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching live stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchLiveStats();
    fetchUsersList();
  }, []);

  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  const exportFinancialCsv = () => {
    memeAudio.playBoing();
    const headers = ['Kitambulisho', 'Namba ya Simu', 'Mtandao', 'Kiasi (TZS)', 'Coins Zilizoongezwa', 'Namba ya Kumbukumbu (Ref)', 'Tarehe na Saa', 'Hali'];
    const rows = stats.recentPayments.map(t => [
      t.id,
      `"${t.phone}"`,
      `"${t.operator}"`,
      t.amount,
      t.coins,
      `"${t.ref}"`,
      `"${new Date(t.createdAt).toLocaleString('sw-TZ')}"`,
      t.status
    ]);
    
    rows.push(['JUMLA YA MAUZO', '""', '""', stats.totalRevenue, '""', '""', '""', '""']);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + 
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ChekaApp_Miamala_Halisi_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Ripoti halisi ya CSV ya miamala ya fedha imepakuliwa kikamilifu!');
  };

  const handleResolveReport = async (reportId: string, action: 'keep' | 'delete') => {
    try {
      await fetch(`/api/admin/flagged-videos/${reportId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: action === 'keep' ? 'approve' : 'delete' }),
      });
    } catch (err) {
      console.warn('Sync report resolution notice:', err);
    }

    if (action === 'delete') {
      onDeleteVideo?.(reportId);
      setStats(prev => ({
        ...prev,
        flaggedVideos: prev.flaggedVideos.filter(v => v.id !== reportId)
      }));
      showToast('Video imefutwa kwenye kanzidata ya ChekaApp!');
      memeAudio.playBoing();
    } else {
      setStats(prev => ({
        ...prev,
        flaggedVideos: prev.flaggedVideos.filter(v => v.id !== reportId)
      }));
      showToast('Video imeidhinishwa na kuruhusiwa kwenye feed ya umma.');
      memeAudio.playPop();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950 text-white animate-fade-in flex flex-col">
      {/* OWNER TOP BAR */}
      <div className="sticky top-0 z-20 bg-neutral-900/95 backdrop-blur-md border-b border-amber-500/40 px-4 py-3 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              onClose();
              memeAudio.playPop();
            }}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
            title="Rudi kwenye App ya Watumiaji"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-neutral-950 font-black shadow-md shadow-amber-500/30">
              <Crown className="w-4 h-4 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-extrabold tracking-wide text-white">
                  Dashibodi ya Mmiliki (Owner Portal)
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                  SUPER ADMIN
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 font-mono">
                Akaunti: {user?.email || 'benedictojoseph08@gmail.com'} (Ufikiaji wa Siri)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportFinancialCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all shadow-sm"
            title="Pakua ripoti ya CSV ya miamala na fedha kwa ajili ya uhasibu"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pakua CSV ya Fedha</span>
          </button>

          <button
            onClick={() => {
              lockOwnerSession();
              onClose();
              memeAudio.playBoing();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 text-xs font-bold transition-all"
            title="Funga kikao cha siri cha mmiliki"
          >
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Funga Hali ya Mmiliki</span>
          </button>
        </div>
      </div>

      {/* TOAST ALERT */}
      {notificationMsg && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-neutral-950 text-xs font-bold px-4 py-2 rounded-full shadow-2xl animate-bounce flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 fill-current" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* DASHBOARD NAVIGATION TABS */}
      <div className="bg-neutral-900 border-b border-neutral-800 px-4 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => {
            setActiveTab('overview');
            memeAudio.playPop();
          }}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-xs whitespace-nowrap transition-colors ${
            activeTab === 'overview'
              ? 'border-amber-400 text-amber-300'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Muhtasari wa Jumla</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('revenue');
            memeAudio.playPop();
          }}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-xs whitespace-nowrap transition-colors ${
            activeTab === 'revenue'
              ? 'border-amber-400 text-amber-300'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Mapato & M-Pesa</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('users');
            fetchUsersList();
            memeAudio.playPop();
          }}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-xs whitespace-nowrap transition-colors ${
            activeTab === 'users'
              ? 'border-amber-400 text-amber-300'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Users className="w-4 h-4 text-sky-400" />
          <span>Watumiaji Waliojisajili ({stats.totalUsers})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('visitors');
            fetchLiveStats();
            memeAudio.playPop();
          }}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-xs whitespace-nowrap transition-colors ${
            activeTab === 'visitors'
              ? 'border-amber-400 text-amber-300'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Timer className="w-4 h-4 text-emerald-400" />
          <span>Wageni & Muda ({stats.visitorAnalytics?.totalVisits || 0})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('moderation');
            memeAudio.playPop();
          }}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-xs whitespace-nowrap transition-colors ${
            activeTab === 'moderation'
              ? 'border-amber-400 text-amber-300'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-rose-400" />
          <span>Ulinzi & Ripoti za Video ({stats.flaggedVideos.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('database');
            memeAudio.playPop();
          }}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-xs whitespace-nowrap transition-colors ${
            activeTab === 'database'
              ? 'border-amber-400 text-amber-300'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Seva & PostgreSQL</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('ads');
            memeAudio.playPop();
          }}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-xs whitespace-nowrap transition-colors ${
            activeTab === 'ads'
              ? 'border-amber-400 text-amber-300'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Megaphone className="w-4 h-4 text-sky-400" />
          <span>Kituo cha Matangazo (Ads)</span>
        </button>
      </div>

      {/* DASHBOARD CONTENT BODY */}
      <div className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6 pb-24">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-1">
                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Mapato ya Jumla</span>
                </p>
                <p className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                  TZS {stats.totalRevenue.toLocaleString()}/=
                </p>
                <p className="text-[10px] text-emerald-500/80 font-medium">
                  {stats.totalTransactions} miamala kwenye database
                </p>
              </div>

              <button 
                onClick={() => {
                  setActiveTab('users');
                  fetchUsersList();
                  memeAudio.playPop();
                }}
                className="bg-neutral-900 hover:bg-neutral-800/80 border border-neutral-800 hover:border-sky-500/50 rounded-2xl p-4 space-y-1 text-left transition-all group"
              >
                <p className="text-[11px] font-bold text-neutral-400 group-hover:text-sky-300 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-sky-400" />
                    <span>Watumiaji Waliosajiliwa</span>
                  </span>
                  <span className="text-[9px] text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity">Tazama &rarr;</span>
                </p>
                <p className="text-xl sm:text-2xl font-black text-sky-400 font-mono">
                  {stats.totalUsers.toLocaleString()}
                </p>
                <p className="text-[10px] text-sky-500/80 font-medium">Akaunti halisi za PostgreSQL</p>
              </button>

              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-1">
                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5 text-amber-400" />
                  <span>Meme Video Reels</span>
                </p>
                <p className="text-xl sm:text-2xl font-black text-amber-300 font-mono">
                  {stats.totalVideos || videos.length}
                </p>
                <p className="text-[10px] text-amber-400/80 font-medium">Cloudflare Stream HLS Active</p>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-1">
                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-purple-400" />
                  <span>Afya ya Database</span>
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <span className={`w-2.5 h-2.5 rounded-full ${dbHealth.status === 'ok' ? 'bg-emerald-400 animate-ping' : 'bg-rose-500'}`} />
                  <p className="text-base sm:text-lg font-bold text-white font-mono uppercase">
                    {dbHealth.status === 'ok' ? 'ONLINE' : 'CHECK'}
                  </p>
                </div>
                <p className="text-[10px] text-neutral-400 font-mono">PostgreSQL 16 Enterprise</p>
              </div>
            </div>

            {/* Real-time App Visitor & Screen Time Retention Metrics */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
                    <Timer className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <span>Wageni Waliofungua App & Muda Waliokaa</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        LIVE TRACKING
                      </span>
                    </h3>
                    <p className="text-xs text-neutral-400">
                      Inahesabu papo hapo mtu yeyote anayefungua App hata bila kujisajili, na kupima dakika na sekunde alizokaa.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      fetchLiveStats();
                      showToast('Takwimu za wageni na muda zimesasishwa!');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition-all"
                    title="Sasisha takwimu kutoka PostgreSQL"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingStats ? 'animate-spin' : ''}`} />
                    <span>Sasisha</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('visitors');
                      memeAudio.playPop();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all flex items-center gap-1"
                  >
                    <span>Orodha ya Wageni</span>
                    <span>&rarr;</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-neutral-950 border border-neutral-800/80 rounded-xl p-3.5 space-y-1">
                  <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    <span>Waliopo Hewani Sasa</span>
                  </p>
                  <p className="text-2xl font-black text-emerald-400 font-mono">
                    {stats.visitorAnalytics?.activeNow || 0}
                  </p>
                  <p className="text-[10px] text-emerald-500/80">
                    Watu walio ndani ya App sasa hivi
                  </p>
                </div>

                <div className="bg-neutral-950 border border-neutral-800/80 rounded-xl p-3.5 space-y-1">
                  <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-sky-400" />
                    <span>Jumla Waliofungua</span>
                  </p>
                  <p className="text-2xl font-black text-sky-400 font-mono">
                    {stats.visitorAnalytics?.totalVisits || 0}
                  </p>
                  <p className="text-[10px] text-sky-400/80">
                    {stats.visitorAnalytics?.uniqueVisitors || 0} vifaa vya kipekee (Unique)
                  </p>
                </div>

                <div className="bg-neutral-950 border border-neutral-800/80 rounded-xl p-3.5 space-y-1">
                  <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Waliofungua Leo</span>
                  </p>
                  <p className="text-2xl font-black text-amber-300 font-mono">
                    {stats.visitorAnalytics?.todayVisits || 0}
                  </p>
                  <p className="text-[10px] text-amber-400/80">
                    {stats.visitorAnalytics?.todayUniqueVisitors || 0} wageni wapya leo
                  </p>
                </div>

                <div className="bg-neutral-950 border border-neutral-800/80 rounded-xl p-3.5 space-y-1">
                  <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Timer className="w-3.5 h-3.5 text-purple-400" />
                    <span>Muda wa Kukaa (Avg)</span>
                  </p>
                  <p className="text-2xl font-black text-purple-300 font-mono">
                    {formatDurationSwahili(stats.visitorAnalytics?.avgDurationSec || 0)}
                  </p>
                  <p className="text-[10px] text-purple-400/80">
                    Jumla: {formatDurationSwahili(stats.visitorAnalytics?.totalTimeSpentSec || 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Action shortcuts for Owner */}
            <div className="bg-neutral-900 border border-amber-500/20 rounded-2xl p-5 space-y-3">
              <h2 className="text-sm font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4" />
                <span>Njia za Haraka za Mmiliki</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => {
                    onOpenArchitecture();
                    onClose();
                  }}
                  className="flex items-center justify-between p-3 rounded-xl bg-neutral-800 hover:bg-neutral-700/80 border border-neutral-700 text-left transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <Server className="w-4 h-4 text-sky-400" />
                    <div>
                      <p className="text-xs font-bold text-white">Muundo wa Miundombinu</p>
                      <p className="text-[10px] text-neutral-400">PostgreSQL + Cloudflare</p>
                    </div>
                  </div>
                  <Check className="w-4 h-4 text-emerald-400" />
                </button>

                <button
                  onClick={() => {
                    onOpenAlgorithm();
                    onClose();
                  }}
                  className="flex items-center justify-between p-3 rounded-xl bg-neutral-800 hover:bg-neutral-700/80 border border-neutral-700 text-left transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <div>
                      <p className="text-xs font-bold text-white">AI Algorithm Explorer</p>
                      <p className="text-[10px] text-neutral-400">Watch-Time Weights & Graph</p>
                    </div>
                  </div>
                  <Check className="w-4 h-4 text-emerald-400" />
                </button>

                <button
                  onClick={() => setActiveTab('moderation')}
                  className="flex items-center justify-between p-3 rounded-xl bg-neutral-800 hover:bg-neutral-700/80 border border-neutral-700 text-left transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <div>
                      <p className="text-xs font-bold text-white">Kagua Video Zilizoripotiwa</p>
                      <p className="text-[10px] text-neutral-400">
                        {stats.flaggedVideos.length === 0 ? '0 zinasubiri (Safi)' : `${stats.flaggedVideos.length} zinasubiri uamuzi`}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-400">→</span>
                </button>
              </div>
            </div>

            {/* Recent Transaction Feed */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span>Miamala ya Hivi Karibuni ya Mobile Money (PostgreSQL Live)</span>
                </h3>
                <span className="text-[11px] font-mono text-emerald-400 font-bold">100% Salama</span>
              </div>
              <div className="divide-y divide-neutral-800">
                {stats.recentPayments.length === 0 ? (
                  <p className="text-xs text-neutral-400 py-6 text-center">
                    Hakuna miamala mipya iliyorekodiwa kwenye kanzidata ya PostgreSQL.
                  </p>
                ) : (
                  stats.recentPayments.slice(0, 5).map(tx => (
                    <div key={tx.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold">
                          TZS
                        </div>
                        <div>
                          <p className="font-bold text-white">{tx.operator} ({tx.phone})</p>
                          <p className="text-[10px] text-neutral-400 font-mono">
                            {tx.ref} · {new Date(tx.createdAt).toLocaleDateString('sw-TZ', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-400 font-mono">
                          {tx.amount > 0 ? `+${tx.amount.toLocaleString()}` : tx.amount.toLocaleString()} TZS
                        </p>
                        <span className="text-[10px] font-bold text-amber-400 font-mono">+{tx.coins} Coins</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: REVENUE */}
        {activeTab === 'revenue' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-emerald-950/40 via-neutral-900 to-neutral-900 border border-emerald-500/30 rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Mauzo Halisi ya Sarafu Kupitia Mitandao ya Simu</p>
                  <h2 className="text-3xl font-black text-white font-mono pt-1">
                    TZS {stats.totalRevenue.toLocaleString()}/=
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={exportFinancialCsv}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-xs shadow-lg shadow-emerald-500/25 transition active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>Pakua Ripoti ya CSV (Excel)</span>
                  </button>
                  <div className="p-3 bg-emerald-500/20 rounded-2xl text-emerald-400 hidden sm:block">
                    <DollarSign className="w-8 h-8" />
                  </div>
                </div>
              </div>
              <p className="text-xs text-neutral-300">
                Takwimu hizi zinasomwa moja kwa moja kutoka kwenye jedwali la malipo (PostgreSQL Payments Ledger).
              </p>
            </div>

            {/* Breakdown by Operator */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                Mgao wa Malipo kwa Mitandao ya Simu (Tanzania)
              </h3>
              <div className="space-y-3">
                {stats.operatorStats.length === 0 ? (
                  <p className="text-xs text-neutral-400 py-2">Hakuna mauzo yaliyorekodiwa bado.</p>
                ) : (
                  stats.operatorStats.map(op => {
                    const pct = stats.totalRevenue > 0 ? Math.round((op.totalAmount / stats.totalRevenue) * 100) : 0;
                    return (
                      <div key={op.operator}>
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span>{op.operatorName}</span>
                          <span className="text-amber-400 font-mono">{pct}% (TZS {op.totalAmount.toLocaleString()})</span>
                        </div>
                        <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full transition-all duration-500" 
                            style={{ width: `${Math.min(100, Math.max(4, pct))}%` }} 
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* All Transactions Table */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                Orodha ya Miamala Yote (PostgreSQL Audit Trail)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-[10px] uppercase text-neutral-400 border-b border-neutral-800">
                    <tr>
                      <th className="pb-2">Nambari ya Simu</th>
                      <th className="pb-2">Mtandao</th>
                      <th className="pb-2">Kiasi (TZS)</th>
                      <th className="pb-2">Sarafu</th>
                      <th className="pb-2">Kumbukumbu (Ref)</th>
                      <th className="pb-2">Hali</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800 font-mono">
                    {stats.recentPayments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-neutral-400">
                          Hakuna miamala kwenye kanzidata ya PostgreSQL.
                        </td>
                      </tr>
                    ) : (
                      stats.recentPayments.map(tx => (
                        <tr key={tx.id} className="hover:bg-neutral-800/40">
                          <td className="py-2.5 font-bold text-white">{tx.phone}</td>
                          <td className="py-2.5 text-neutral-300">{tx.operator}</td>
                          <td className="py-2.5 text-emerald-400 font-bold">
                            {tx.amount > 0 ? `+${tx.amount.toLocaleString()}` : tx.amount.toLocaleString()}
                          </td>
                          <td className="py-2.5 text-amber-300 font-bold">{tx.coins}</td>
                          <td className="py-2.5 text-neutral-400 text-[10px]">{tx.ref}</td>
                          <td className="py-2.5">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: WATUMIAJI WALIOJISAJILI (USERS AUDIT) */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-sky-400" />
                    <span>Ukaguzi wa Watumiaji Waliojisajili (Database User Accounts)</span>
                  </h3>
                  <p className="text-xs text-neutral-400 pt-0.5">
                    Hapa unaona orodha kamili na sahihi ya watu wote waliopo kwenye kanzidata ya PostgreSQL.
                  </p>
                </div>
                <button
                  onClick={() => {
                    fetchUsersList();
                    memeAudio.playBoing();
                  }}
                  className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-sky-400 border border-neutral-700 text-xs font-bold transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingUsers ? 'animate-spin' : ''}`} />
                  <span>Sasisha Orodha</span>
                </button>
              </div>

              {/* Breakdown Summary Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                  <p className="text-[10px] text-neutral-400 uppercase font-semibold">Jumla ya Akaunti</p>
                  <p className="text-lg font-black text-white font-mono">{usersList.length}</p>
                </div>
                <div className="p-3 bg-neutral-950 rounded-xl border border-sky-500/30">
                  <p className="text-[10px] text-sky-400 uppercase font-semibold">Watumiaji Halisi (Organic)</p>
                  <p className="text-lg font-black text-sky-400 font-mono">
                    {usersList.filter(u => !['mwalimu@cheka.io', 'bongo@cheka.io', 'street@cheka.io'].includes(u.email) && u.email !== 'benedictojoseph08@gmail.com').length}
                  </p>
                </div>
                <div className="p-3 bg-neutral-950 rounded-xl border border-amber-500/30">
                  <p className="text-[10px] text-amber-400 uppercase font-semibold">Akaunti ya Mmiliki</p>
                  <p className="text-lg font-black text-amber-400 font-mono">1 (Wewe)</p>
                </div>
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                  <p className="text-[10px] text-neutral-400 uppercase font-semibold">Akaunti za Mfumo (Seeded)</p>
                  <p className="text-lg font-black text-neutral-400 font-mono">3</p>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative pt-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="Tafuta mtumiaji kwa jina (username) au barua pepe..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto pt-2">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-neutral-800 text-neutral-400 uppercase text-[10px]">
                      <th className="pb-2 font-bold">#</th>
                      <th className="pb-2 font-bold">Mtumiaji (Username)</th>
                      <th className="pb-2 font-bold">Barua Pepe (Email)</th>
                      <th className="pb-2 font-bold text-center">Video zake</th>
                      <th className="pb-2 font-bold">Tarehe ya Kujisajili</th>
                      <th className="pb-2 font-bold text-right">Hadhi ya Akaunti</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-850">
                    {loadingUsers ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-neutral-400">
                          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-sky-400" />
                          <span>Inapakua orodha ya watumiaji kutoka PostgreSQL...</span>
                        </td>
                      </tr>
                    ) : usersList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-neutral-400">
                          Hakuna akaunti zilizopatikana kwenye mfumo.
                        </td>
                      </tr>
                    ) : (
                      usersList
                        .filter(u => {
                          if (!userSearchQuery) return true;
                          const q = userSearchQuery.toLowerCase();
                          return u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
                        })
                        .map((u, idx) => {
                          const isOwner = u.email === 'benedictojoseph08@gmail.com';
                          const isSeeded = ['mwalimu@cheka.io', 'bongo@cheka.io', 'street@cheka.io'].includes(u.email);
                          const isRealNewUser = !isOwner && !isSeeded;

                          return (
                            <tr key={u.id} className="hover:bg-neutral-800/40 transition-colors">
                              <td className="py-3 font-mono text-neutral-500">{idx + 1}</td>
                              <td className="py-3">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 overflow-hidden flex items-center justify-center shrink-0">
                                    {u.avatarUrl ? (
                                      <img src={u.avatarUrl} alt={u.username} className="w-full h-full object-cover" />
                                    ) : (
                                      <span className="text-xs font-bold text-neutral-300 uppercase">
                                        {u.username.slice(0, 2)}
                                      </span>
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-bold text-white flex items-center gap-1.5">
                                      <span>@{u.username}</span>
                                      {isOwner && (
                                        <span title="Mmiliki wa Mfumo">
                                          <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                        </span>
                                      )}
                                    </p>
                                    <p className="text-[10px] text-neutral-500 font-mono truncate max-w-[120px] sm:max-w-[180px]">
                                      {u.id}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 font-mono text-neutral-300">
                                {u.email}
                              </td>
                              <td className="py-3 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                                  u.videoCount > 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-neutral-800 text-neutral-500'
                                }`}>
                                  {u.videoCount} {u.videoCount === 1 ? 'video' : 'video'}
                                </span>
                              </td>
                              <td className="py-3 text-neutral-400 text-[11px] whitespace-nowrap">
                                {new Date(u.createdAt).toLocaleString('sw-TZ', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </td>
                              <td className="py-3 text-right">
                                {isOwner ? (
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                    Mmiliki (Super Admin)
                                  </span>
                                ) : isSeeded ? (
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-neutral-800 text-neutral-400 border border-neutral-700">
                                    Akaunti ya Mfumo (Seeded)
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                    Mtumiaji Halisi (Organic)
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MODERATION */}
        {activeTab === 'moderation' && (
          <div className="space-y-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Usimamizi wa Maadili & Google Play UGC Compliance</span>
                  </h3>
                  <p className="text-xs text-neutral-400 pt-0.5">
                    Hapa unadhibiti maudhui yaliyoripotiwa na watumiaji ili kulinda jukwaa dhidi ya matusi, ubaguzi au uvunjifu wa sheria.
                  </p>
                </div>
              </div>
            </div>

            {/* Reported List */}
            <div className="space-y-3">
              {stats.flaggedVideos.length === 0 ? (
                <div className="bg-neutral-900 border border-emerald-500/30 rounded-2xl p-8 text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-base font-bold text-white">Kanzidata ya ChekaApp Iko Safi (100% Compliant)</h4>
                  <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
                    Hakuna video iliyoripotiwa na mtumiaji yeyote inayongoja ukaguzi. Maudhui yote kwenye mfumo yanafuata miongozo ya jamii.
                  </p>
                </div>
              ) : (
                stats.flaggedVideos.map(item => (
                  <div 
                    key={item.id} 
                    className="bg-neutral-900 border border-rose-500/40 rounded-2xl p-4 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">@{item.creator?.username || 'mchekeshaji'}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30">
                            Hali: {item.status}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-300 line-clamp-1">{item.caption || 'Video ya meme'}</p>
                        <p className="text-[10px] text-neutral-500 font-mono">
                          Tarehe: {new Date(item.createdAt).toLocaleDateString('sw-TZ')}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                          onClick={() => handleResolveReport(item.id, 'keep')}
                          className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold transition-colors"
                        >
                          Ruhusu Video
                        </button>
                        <button
                          onClick={() => handleResolveReport(item.id, 'delete')}
                          className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-bold transition-colors flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Futa Mara Moja</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 4: DATABASE & SERVER */}
        {activeTab === 'database' && (
          <div className="space-y-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Server className="w-4 h-4 text-sky-400" />
                    <span>Miundombinu ya Kanzidata (PostgreSQL + Cloud Run)</span>
                  </h3>
                  <p className="text-xs text-neutral-400 pt-0.5">
                    Taarifa hizi za kiufundi zimefichwa kwa watumiaji wote na zinaonekana kwako tu.
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 ${
                  dbHealth.status === 'ok' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-400'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${dbHealth.status === 'ok' ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'}`} />
                  <span>{dbHealth.status === 'ok' ? 'ONLINE (Healthy)' : 'OFFLINE'}</span>
                </div>
              </div>

              {dbHealth.pool && (
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-center">
                    <p className="text-[10px] text-neutral-400 uppercase">Jumla ya Connections</p>
                    <p className="text-lg font-bold text-white font-mono">{dbHealth.pool.total}</p>
                  </div>
                  <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-center">
                    <p className="text-[10px] text-emerald-400 uppercase">Idle Connections</p>
                    <p className="text-lg font-bold text-emerald-400 font-mono">{dbHealth.pool.idle}</p>
                  </div>
                  <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-center">
                    <p className="text-[10px] text-amber-400 uppercase">Waiting Requests</p>
                    <p className="text-lg font-bold text-amber-400 font-mono">{dbHealth.pool.waiting}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    onOpenArchitecture();
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-colors flex items-center gap-2"
                >
                  <Server className="w-3.5 h-3.5" />
                  <span>Fungua Full Database Schema Explorer</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: ADS */}
        {activeTab === 'ads' && (
          <div className="space-y-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-sky-400" />
                    <span>Usimamizi wa Matangazo ya Biashara (Ad Platform)</span>
                  </h3>
                  <p className="text-xs text-neutral-400 pt-0.5">
                    Dhibiti matangazo ya wafanyabiashara yanayoonekana kila baada ya reels 6 kwenye feed ya watumiaji.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  MONETIZATION READY
                </span>
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                Kampeni za Matangazo (Ad Campaigns)
              </h4>
              <div className="p-8 rounded-2xl bg-neutral-950 border border-neutral-800 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
                  <Megaphone className="w-6 h-6 text-amber-400" />
                </div>
                <p className="text-sm font-bold text-white">Hakuna matangazo ya kulipia yanayoendelea kwa sasa</p>
                <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
                  Mfumo uko tayari kuonyesha matangazo ya video kila baada ya video 6 pale mfanyabiashara anapochapisha kampeni kupitia kituo cha matangazo.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: VISITORS & SCREEN TIME RETENTION */}
        {activeTab === 'visitors' && (
          <div className="space-y-6">
            {/* Header info */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Timer className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <span>Wageni Waliofungua App & Muda Waliokaa</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        LIVE METRICS
                      </span>
                    </h3>
                    <p className="text-xs text-neutral-400 pt-0.5">
                      Kila mtu anayefungua ChekaApp (hata bila kujisajili wala kulike) anahesabiwa hapa papo hapo na muda wake wa kukaa unarekodiwa kwa sekunde.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    fetchLiveStats();
                    showToast('Takwimu za wageni zimesasishwa!');
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold transition-all border border-neutral-700/60 shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingStats ? 'animate-spin' : ''}`} />
                  <span>Sasisha Data</span>
                </button>
              </div>

              {/* 4 Summary Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 space-y-1">
                  <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    <span>Waliopo Hewani Sasa</span>
                  </p>
                  <p className="text-2xl font-black text-emerald-400 font-mono">
                    {stats.visitorAnalytics?.activeNow || 0}
                  </p>
                  <p className="text-[10px] text-emerald-500/80">Watu waliopo ndani ya App</p>
                </div>

                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 space-y-1">
                  <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-sky-400" />
                    <span>Jumla ya Waliofungua</span>
                  </p>
                  <p className="text-2xl font-black text-sky-400 font-mono">
                    {stats.visitorAnalytics?.totalVisits || 0}
                  </p>
                  <p className="text-[10px] text-sky-400/80">
                    {stats.visitorAnalytics?.uniqueVisitors || 0} wageni wa kipekee (Unique)
                  </p>
                </div>

                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 space-y-1">
                  <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Waliofungua Leo</span>
                  </p>
                  <p className="text-2xl font-black text-amber-300 font-mono">
                    {stats.visitorAnalytics?.todayVisits || 0}
                  </p>
                  <p className="text-[10px] text-amber-400/80">
                    {stats.visitorAnalytics?.todayUniqueVisitors || 0} wageni wapya leo
                  </p>
                </div>

                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 space-y-1">
                  <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Timer className="w-3.5 h-3.5 text-purple-400" />
                    <span>Muda wa Kukaa (Avg)</span>
                  </p>
                  <p className="text-2xl font-black text-purple-300 font-mono">
                    {formatDurationSwahili(stats.visitorAnalytics?.avgDurationSec || 0)}
                  </p>
                  <p className="text-[10px] text-purple-400/80">
                    Jumla: {formatDurationSwahili(stats.visitorAnalytics?.totalTimeSpentSec || 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Detailed Sessions Table */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span>Kumbukumbu ya Hivi Karibuni ya Wageni (Vikao 25 vya Mwisho)</span>
                  </h4>
                  <p className="text-[11px] text-neutral-400">
                    Taarifa hizi zinaonyesha kila mtu aliyefungua App, kifaa chake, muda aliokaa, na video alizoangalia.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-neutral-400">
                  {stats.visitorAnalytics?.recentSessions?.length || 0} rekodi
                </span>
              </div>

              {(!stats.visitorAnalytics?.recentSessions || stats.visitorAnalytics.recentSessions.length === 0) ? (
                <div className="p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-center mx-auto text-neutral-500">
                    <Timer className="w-6 h-6 text-emerald-400" />
                  </div>
                  <p className="text-sm font-bold text-neutral-300">Hakuna kumbukumbu za wageni bado</p>
                  <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                    Mara tu mtu anapofungua ChekaApp kwenye simu au kompyuta, data zake za muda na kifaa zitaonekana hapa papo hapo.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-950/80 text-[10px] uppercase font-bold text-neutral-400 border-b border-neutral-800">
                      <tr>
                        <th className="p-3.5">Hali</th>
                        <th className="p-3.5">Mgeni / Akaunti</th>
                        <th className="p-3.5">Kifaa Alichotumia</th>
                        <th className="p-3.5">Muda Aliokaa</th>
                        <th className="p-3.5">Reels Alizotazama</th>
                        <th className="p-3.5">Muda Aliofungua</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800 font-mono">
                      {stats.visitorAnalytics.recentSessions.map((sess, idx) => {
                        const isLive = Boolean(sess.is_live);
                        const devType = sess.device_type || 'Mobile';
                        const isPhone = devType.toLowerCase().includes('simu') || devType.toLowerCase().includes('android') || devType.toLowerCase().includes('ios') || devType.toLowerCase().includes('iphone');

                        return (
                          <tr key={sess.session_id || idx} className="hover:bg-neutral-800/40 transition-colors">
                            <td className="p-3.5">
                              {isLive ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  <span>HEWANI SASA</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-800 text-neutral-400 border border-neutral-700/50">
                                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-500" />
                                  <span>Aliondoka</span>
                                </span>
                              )}
                            </td>

                            <td className="p-3.5">
                              <div>
                                <p className="font-bold text-white font-sans text-xs">
                                  {sess.username ? `@${sess.username}` : 'Mgeni (Bila Kujisajili)'}
                                </p>
                                <p className="text-[10px] text-neutral-400 truncate max-w-[140px]" title={sess.visitor_id}>
                                  ID: {sess.visitor_id}
                                </p>
                              </div>
                            </td>

                            <td className="p-3.5">
                              <div className="flex items-center gap-1.5 text-neutral-300 font-sans">
                                {isPhone ? (
                                  <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                                ) : (
                                  <Laptop className="w-3.5 h-3.5 text-sky-400" />
                                )}
                                <span className="text-xs">{devType}</span>
                              </div>
                            </td>

                            <td className="p-3.5">
                              <span className="px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-300 font-bold text-xs">
                                {formatDurationSwahili(sess.duration_sec)}
                              </span>
                            </td>

                            <td className="p-3.5">
                              <span className="text-neutral-200 font-bold">
                                {sess.reels_watched || 0} reels
                              </span>
                            </td>

                            <td className="p-3.5 text-neutral-400 text-[11px]">
                              {new Date(sess.started_at).toLocaleString('sw-TZ', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
