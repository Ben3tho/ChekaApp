import React, { useState } from 'react';
import { 
  Server, 
  Database, 
  Layers, 
  CheckCircle2, 
  Copy, 
  Check, 
  ShieldAlert, 
  Zap, 
  ArrowRight, 
  Activity, 
  DollarSign, 
  Cpu, 
  Code2, 
  Sliders, 
  Radio, 
  HelpCircle,
  TrendingUp,
  FileText
} from 'lucide-react';
import { Language, DbTable, RoadmapPhase } from '../types';
import { DB_TABLES_SCHEMA, ROADMAP_PHASES } from '../data/initialData';
import { memeAudio } from '../utils/audioSynth';

interface ArchitectureViewProps {
  language: Language;
}

export const ArchitectureView: React.FC<ArchitectureViewProps> = ({ language }) => {
  const [activeTab, setActiveTab] = useState<'system' | 'database' | 'roadmap' | 'calculator' | 'risks'>('system');
  const [copiedTable, setCopiedTable] = useState<string | null>(null);
  const [copiedQuery, setCopiedQuery] = useState<string | null>(null);
  const [roadmap, setRoadmap] = useState<RoadmapPhase[]>(ROADMAP_PHASES);
  const [selectedNode, setSelectedNode] = useState<string>('feed_service');

  // Interactive Cost Calculator state (Section 8)
  const [storedMinutes, setStoredMinutes] = useState<number>(10000); // 10,000 minutes stored
  const [viewedMinutes, setViewedMinutes] = useState<number>(150000); // 150,000 minutes watched

  // Fan-out model simulator state (Section 4)
  const [followerCount, setFollowerCount] = useState<number>(5000);

  const toggleTask = (phaseIdx: number, taskId: string) => {
    setRoadmap(prev => {
      const updated = [...prev];
      const task = updated[phaseIdx].tasks.find(t => t.id === taskId);
      if (task) {
        task.completed = !task.completed;
      }
      return updated;
    });
    memeAudio.playBoing();
  };

  const copySqlSchema = (table: DbTable) => {
    const colsSql = table.columns
      .map(c => `  ${c.name.padEnd(16)} ${c.type.padEnd(14)} ${c.constraints}`)
      .join(',\n');
    const fullSql = `CREATE TABLE ${table.name} (\n${colsSql}\n);`;

    navigator.clipboard.writeText(fullSql);
    setCopiedTable(table.name);
    memeAudio.playBoing();
    setTimeout(() => setCopiedTable(null), 2000);
  };

  const copySnippet = (queryName: string, sqlText: string) => {
    navigator.clipboard.writeText(sqlText);
    setCopiedQuery(queryName);
    memeAudio.playBoing();
    setTimeout(() => setCopiedQuery(null), 2000);
  };

  // Cost calculator calculations
  // Cloudflare Stream: $5 per 1,000 min stored + $1 per 1,000 min delivered
  const cloudflareCost = Math.round((storedMinutes / 1000) * 5 + (viewedMinutes / 1000) * 1);
  
  // AWS MediaConvert + S3 + CloudFront:
  // Storage: ~$0.023 per GB (1 min 720p H.264 ~ 15MB)
  const storageGB = (storedMinutes * 15) / 1024;
  const awsS3Cost = storageGB * 0.023;
  // Encoding: ~$0.0075 per min (one-time on upload)
  const awsEncodeCost = (storedMinutes / 10) * 0.0075; // assuming 10% new monthly uploads
  // Egress: ~$0.085 per GB (1 min delivered ~ 12MB average HLS)
  const egressGB = (viewedMinutes * 12) / 1024;
  const awsCloudFrontCost = egressGB * 0.085;
  const awsTotalCost = Math.round(awsS3Cost + awsEncodeCost + awsCloudFrontCost);

  // Fan-out calculations
  const isFanOutWrite = followerCount < 25000;
  const fanOutWriteCost = `${followerCount.toLocaleString()} Redis RPUSH writes`;
  const fanOutReadCost = `1 Redis Query on App Open (Fetch from followees & merge)`;

  const systemNodes: Record<string, {
    title: string;
    tech: string;
    role: string;
    throughput: string;
    latency: string;
    notes: string;
  }> = {
    mobile_app: {
      title: 'Mobile App Client',
      tech: 'Flutter / React Native (Cross-Platform)',
      role: 'Single codebase for iOS & Android, high-FPS vertical gesture feed, caching, offline playback',
      throughput: 'Endless feed scrolling',
      latency: '< 50ms UI response',
      notes: 'Optimized video buffer with ExoPlayer (Android) & AVPlayer (iOS). Dual-bitrate prefetching.'
    },
    api_gateway: {
      title: 'API Gateway & Rate Limiter',
      tech: 'Kong / Envoy / Node.js Express Gateway',
      role: 'Traffic routing, SSL termination, JWT authentication verification, DDoS rate limiting',
      throughput: '100k+ req/sec',
      latency: '2ms overhead',
      notes: 'Token bucket rate limiting per IP and authenticated user token.'
    },
    feed_service: {
      title: 'Feed Service & Pre-computation',
      tech: 'Node.js (NestJS) / Go Microservice',
      role: 'Generates personal For You feed, performs hybrid fan-out read / write for creators and users',
      throughput: '50k RPS',
      latency: '< 15ms target',
      notes: 'Fan-out-write for high-engagement meme creators, fan-out-read for standard active consumers.'
    },
    recommendation_engine: {
      title: 'Recommendation Engine',
      tech: 'Python FastAPI / Redis Feature Store',
      role: 'Calculates ranking scores: (watch_ratio*3) + (likes*2) + shares + comments - (skip*2)',
      throughput: 'Real-time scoring',
      latency: '10ms per batch',
      notes: 'Cold start via location + trending hashtags, collaborative filtering with user clustering.'
    },
    scylla_db: {
      title: 'ScyllaDB / Cassandra (High Write Events)',
      tech: 'ScyllaDB NoSQL (C++ rewrite of Cassandra)',
      role: 'Stores extreme write-heavy user events: video views (watch_ms), continuous heartbeat telemetry',
      throughput: '1M+ writes/sec',
      latency: '< 2ms writes',
      notes: 'Linear horizontal scaling, zero garbage collection pauses for heavy video streaming telemetry.'
    },
    redis_cache: {
      title: 'Redis Cluster (Feed & Trending Cache)',
      tech: 'Redis v7 in-memory cluster',
      role: 'Stores pre-computed user feed IDs, trending hashtag sorted sets (ZSET), and like idempotency',
      throughput: '500k ops/sec',
      latency: '< 1ms',
      notes: 'Sorted sets (ZADD/ZREVRANGEBYSCORE) for lightning-fast trending leaderboards.'
    },
    postgres_db: {
      title: 'PostgreSQL (Core Relational Data)',
      tech: 'PostgreSQL 16 with Read Replicas',
      role: 'ACID source of truth for users, accounts, videos metadata, comments threads, and follows graph',
      throughput: '10k transactions/sec',
      latency: '3ms read replica',
      notes: 'Strict foreign keys, transactional integrity for creator gift earnings and billing.'
    },
    video_pipeline: {
      title: 'Video Upload & HLS Transcoder',
      tech: 'AWS S3 / GCS -> MediaConvert / Cloudflare Stream',
      role: 'Transcodes uploaded MP4 into HLS multi-bitrate chunks (1080p, 720p, 480p, 240p) with CDN edge',
      throughput: 'Automated async queue',
      latency: '15-30s per 15s reel',
      notes: 'Kafka/SQS queue buffers incoming uploads, Cloudflare Stream reduces bandwidth costs by 60%.'
    }
  };

  const selectedData = systemNodes[selectedNode] || systemNodes.feed_service;

  // Real production SQL query snippets
  const SQL_SNIPPETS = [
    {
      name: 'Cursor-based Feed Pagination',
      description: 'Pata video 10 zinazofuata kwa kutumia cursor (created_at) badala ya OFFSET',
      sql: `-- Cursor pagination is 100x faster than OFFSET on 1M+ rows
SELECT 
    v.id,
    v.caption,
    v.video_url,
    v.thumbnail_url,
    v.duration,
    v.created_at,
    u.username,
    u.avatar_url,
    COUNT(l.user_id) AS likes_count
FROM videos v
INNER JOIN users u ON u.id = v.user_id
LEFT JOIN likes l ON l.video_id = v.id
WHERE v.status = 'READY'
  AND v.created_at < $1 -- $1 is the timestamp cursor
GROUP BY v.id, u.id
ORDER BY v.created_at DESC
LIMIT 10;`
    },
    {
      name: 'Idempotent Like na Atomic Counter',
      description: 'Zuia double-like kwa kutumia ON CONFLICT DO NOTHING kwenye PostgreSQL',
      sql: `-- Idempotent Like: If user already liked, do nothing
INSERT INTO likes (user_id, video_id, created_at)
VALUES ($1, $2, NOW())
ON CONFLICT (user_id, video_id) DO NOTHING;

-- Redis counter increment (Atomic & Non-blocking)
-- INCR video:{video_id}:likes`
    },
    {
      name: 'Batch Watch Time Ingestion (ScyllaDB/PostgreSQL)',
      description: 'Rekodi muda ambao mtumiaji ametazama video kwa milliseconds kwa ajili ya algorithm',
      sql: `-- Insert view event with watch time in ms
INSERT INTO views (video_id, user_id, watch_ms, created_at)
VALUES ($1, $2, $3, NOW());

-- Push event to Kafka topic for real-time recommendation calculation:
-- topic: user-reel-impressions | payload: { videoId, userId, watchMs, completedRatio }`
    },
    {
      name: 'Trending Leaderboard (Redis Sorted Set)',
      description: 'Sasisha na kuvuta video 20 zinazoongoza kwa vicheko masaa 6 yaliyopita',
      sql: `-- Add or update video viral score in Redis ZSET
ZADD trending_reels:tz 18450 "v_801"
ZADD trending_reels:tz 29400 "v_802"

-- Fetch top 20 trending videos in East Africa
ZREVRANGE trending_reels:tz 0 19 WITHSCORES;`
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-100 flex items-center gap-2">
            <Server className="w-5 h-5 text-amber-500" />
            <span>
              {language === 'sw'
                ? 'Msingi Imara wa Tech Stack & Mfumo (Architecture Hub)'
                : 'Tech Stack Foundation & System Architecture Hub'}
            </span>
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            {language === 'sw'
              ? 'Sehemu 4–8 kwa kina: System Design, Database DDL, Recommendation Engine, Wiki 12, na Makadirio ya Gharama.'
              : 'Deep dive into Sections 4–8: System Topology, Database DDL, Recommendation Engine, 12-Week Roadmap, and Cost Calculator.'}
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs font-semibold overflow-x-auto no-scrollbar">
          {[
            { id: 'system', label: language === 'sw' ? 'Sehemu 4: System Design' : 'S4: System Design', icon: Layers },
            { id: 'database', label: language === 'sw' ? 'Sehemu 5: Database & SQL' : 'S5: Database & SQL', icon: Database },
            { id: 'roadmap', label: language === 'sw' ? 'Sehemu 7: Wiki 12' : 'S7: 12-Week Roadmap', icon: CheckCircle2 },
            { id: 'calculator', label: language === 'sw' ? 'Sehemu 8: Gharama (Cloud)' : 'S8: Cloud Costs', icon: DollarSign },
            { id: 'risks', label: language === 'sw' ? 'Ulinzi & Hakimiliki' : 'Risks & Safety', icon: ShieldAlert }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  memeAudio.playBoing();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-amber-500 text-neutral-950 shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: System Design (Section 4) */}
      {activeTab === 'system' && (
        <div className="space-y-6 animate-fade-in">
          {/* Fan-Out Model Simulator (Section 4 Core Decision) */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
              <div>
                <h3 className="font-bold text-sm text-neutral-100 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  <span>
                    {language === 'sw'
                      ? 'Uamuzi Mkuu wa Design: Fan-out Write vs Fan-out Read (Feed Pre-computation)'
                      : 'Core Architectural Decision: Hybrid Fan-out Model'}
                  </span>
                </h3>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  {language === 'sw'
                    ? 'Jinsi feed inavyojengwa mapema bila kuangusha seva pindi mtayarishaji anapochapisha video.'
                    : 'Interactive model balancing write-amplification for influencers vs read-latency for normal users.'}
                </p>
              </div>

              <div className="flex items-center gap-2 bg-neutral-950 px-3 py-1.5 rounded-xl border border-neutral-800 text-xs">
                <span className="text-neutral-400">Followers:</span>
                <span className="font-mono text-amber-400 font-bold tabular-nums">
                  {followerCount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-neutral-400">
                <span>Mtayarishaji wa kawaida (100 followers)</span>
                <span>Mchekeshaji Maarufu / Influencer (100,000+ followers)</span>
              </div>
              <input
                type="range"
                min="100"
                max="100000"
                step="500"
                value={followerCount}
                onChange={e => setFollowerCount(parseInt(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Decision card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
              <div className={`p-4 rounded-xl border transition-all ${
                isFanOutWrite 
                  ? 'bg-amber-500/10 border-amber-500/50 text-neutral-100 shadow-sm'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 opacity-60'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm">Mode: Fan-out Write (Push Model)</span>
                  {isFanOutWrite && (
                    <span className="text-[10px] bg-amber-500 text-neutral-950 px-2 py-0.5 rounded font-bold">
                      ACTIVE (&lt; 25k)
                    </span>
                  )}
                </div>
                <p className="leading-relaxed text-[11px] mb-2">
                  Mtayarishaji akipost, video ID inaandikwa papo hapo kwenye Redis inboxes za wafuasi wake wote:
                </p>
                <div className="p-2 bg-neutral-950/80 rounded-lg font-mono text-[11px] text-amber-300">
                  {fanOutWriteCost}
                </div>
                <span className="text-[10px] text-neutral-500 mt-2 block">
                  Faida: Mtumiaji anapofungua app, feed yake inasoma mara moja ndani ya &lt; 5ms!
                </span>
              </div>

              <div className={`p-4 rounded-xl border transition-all ${
                !isFanOutWrite 
                  ? 'bg-sky-500/10 border-sky-500/50 text-neutral-100 shadow-sm'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 opacity-60'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm">Mode: Fan-out Read (Pull Model)</span>
                  {!isFanOutWrite && (
                    <span className="text-[10px] bg-sky-500 text-neutral-950 px-2 py-0.5 rounded font-bold">
                      ACTIVE (&gt; 25k)
                    </span>
                  )}
                </div>
                <p className="leading-relaxed text-[11px] mb-2">
                  Kwa mastaa wakubwa wenye wafuasi 25k+, hatusukumi kwa kila mtu ili kuzuia kuangusha Redis:
                </p>
                <div className="p-2 bg-neutral-950/80 rounded-lg font-mono text-[11px] text-sky-300">
                  {fanOutReadCost}
                </div>
                <span className="text-[10px] text-neutral-500 mt-2 block">
                  Faida: Hakuna write amplification ya kutupa mamilioni ya writes mara moja.
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Topology Diagram */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider font-mono">
                {language === 'sw' ? 'Mtandao wa Huduma (Interactive Topology)' : 'Service Topology Diagram'}
              </span>
              <span className="text-[11px] text-neutral-500">
                {language === 'sw' ? 'Bofya kisanduku kuona maelezo ya ndani' : 'Click any node to inspect telemetry & role'}
              </span>
            </div>

            {/* Visual Node Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <button
                onClick={() => setSelectedNode('mobile_app')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  selectedNode === 'mobile_app'
                    ? 'bg-amber-500/15 border-amber-500 shadow-md'
                    : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-neutral-100">📱 Mobile Client</span>
                  <span className="text-[10px] text-amber-400 font-mono">Flutter / RN</span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Vertical swipe feed, video pre-caching & gestures.
                </p>
              </button>

              <button
                onClick={() => setSelectedNode('api_gateway')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  selectedNode === 'api_gateway'
                    ? 'bg-amber-500/15 border-amber-500 shadow-md'
                    : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-neutral-100">🚪 API Gateway</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Rate Limit</span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Auth validation, routing, token bucket rate limiter.
                </p>
              </button>

              <button
                onClick={() => setSelectedNode('feed_service')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  selectedNode === 'feed_service'
                    ? 'bg-amber-500/15 border-amber-500 shadow-md'
                    : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-neutral-100">⚡ Feed Service</span>
                  <span className="text-[10px] text-sky-400 font-mono">NestJS / Go</span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Fan-out write for influencers, fan-out read for users.
                </p>
              </button>

              <button
                onClick={() => setSelectedNode('recommendation_engine')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  selectedNode === 'recommendation_engine'
                    ? 'bg-amber-500/15 border-amber-500 shadow-md'
                    : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-neutral-100">🧠 For You Engine</span>
                  <span className="text-[10px] text-purple-400 font-mono">Algorithm</span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Ranking score calculation based on watch ratio (3×) & likes.
                </p>
              </button>
            </div>

            {/* Secondary Storage & Pipeline Layer */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs pt-1">
              <button
                onClick={() => setSelectedNode('postgres_db')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  selectedNode === 'postgres_db'
                    ? 'bg-amber-500/15 border-amber-500 shadow-md'
                    : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-neutral-100">🐘 PostgreSQL</span>
                  <span className="text-[10px] text-blue-400 font-mono">ACID Core</span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Users, profiles, video metadata, comments, follows.
                </p>
              </button>

              <button
                onClick={() => setSelectedNode('redis_cache')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  selectedNode === 'redis_cache'
                    ? 'bg-amber-500/15 border-amber-500 shadow-md'
                    : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-neutral-100">🔴 Redis Cluster</span>
                  <span className="text-[10px] text-red-400 font-mono">&lt; 1ms Cache</span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Pre-computed feeds, trending ZSETs, idempotency keys.
                </p>
              </button>

              <button
                onClick={() => setSelectedNode('scylla_db')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  selectedNode === 'scylla_db'
                    ? 'bg-amber-500/15 border-amber-500 shadow-md'
                    : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-neutral-100">🌊 ScyllaDB</span>
                  <span className="text-[10px] text-teal-400 font-mono">High Write</span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Billions of views (watch_ms), real-time engagement events.
                </p>
              </button>

              <button
                onClick={() => setSelectedNode('video_pipeline')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  selectedNode === 'video_pipeline'
                    ? 'bg-amber-500/15 border-amber-500 shadow-md'
                    : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-neutral-100">🎬 HLS Transcoder</span>
                  <span className="text-[10px] text-amber-400 font-mono">Cloudflare CDN</span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Upload → S3 → Multi-bitrate HLS (1080p-240p) → Edge CDN.
                </p>
              </button>
            </div>
          </div>

          {/* Node Inspector Detail Panel */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm text-neutral-100">
                  {selectedData.title}
                </h3>
              </div>
              <span className="text-xs font-mono text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/20">
                {selectedData.tech}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                <span className="text-neutral-500 block mb-1">
                  {language === 'sw' ? 'Wajibu Mkuu (Role)' : 'Primary Function'}
                </span>
                <p className="text-neutral-200 leading-relaxed">{selectedData.role}</p>
              </div>

              <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                <span className="text-neutral-500 block mb-1">
                  {language === 'sw' ? 'Kasi & Uwezo (Throughput)' : 'Throughput & Latency'}
                </span>
                <div className="space-y-1 font-mono text-xs">
                  <div className="text-emerald-400">Target: {selectedData.throughput}</div>
                  <div className="text-amber-300">P99 Latency: {selectedData.latency}</div>
                </div>
              </div>

              <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                <span className="text-neutral-500 block mb-1">
                  {language === 'sw' ? 'Uamuzi wa Kihandisi (Design Decision)' : 'Engineering Decision'}
                </span>
                <p className="text-neutral-300 leading-relaxed">{selectedData.notes}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Database & SQL Queries (Section 5) */}
      {activeTab === 'database' && (
        <div className="space-y-6 animate-fade-in">
          {/* Production SQL Queries Workbench */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div>
                <h3 className="font-bold text-sm text-neutral-100 flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-amber-400" />
                  <span>
                    {language === 'sw'
                      ? 'SQL Queries za Msingi (Production Queries & Indexes)'
                      : 'Production SQL Queries & Indexing Strategy'}
                  </span>
                </h3>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  {language === 'sw'
                    ? 'Queries zilizoboreshwa kuzuia slow queries za mamilioni ya watumiaji.'
                    : 'Cursor-based pagination, idempotent likes, and streaming view events.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SQL_SNIPPETS.map(snip => (
                <div
                  key={snip.name}
                  className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 space-y-2 flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300 font-mono">
                        {snip.name}
                      </span>
                      <button
                        onClick={() => copySnippet(snip.name, snip.sql)}
                        className="flex items-center gap-1 text-[10px] text-neutral-400 hover:text-white px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 transition-colors"
                      >
                        {copiedQuery === snip.name ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy SQL</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] text-neutral-400">{snip.description}</p>
                  </div>

                  <pre className="p-3 bg-neutral-900/90 rounded-lg text-[11px] font-mono text-neutral-300 overflow-x-auto leading-relaxed border border-neutral-800/80">
                    <code>{snip.sql}</code>
                  </pre>
                </div>
              ))}
            </div>
          </div>

          {/* Schema DDL */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div>
                <h3 className="font-bold text-sm text-neutral-100">
                  {language === 'sw'
                    ? 'Majedwali Kamili ya PostgreSQL & ScyllaDB (DDL Schemas)'
                    : 'Relational Database Schema (PostgreSQL)'}
                </h3>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  {language === 'sw'
                    ? 'Majedwali 6 yenye funguo za kigeni (Foreign Keys), Unique constraints, na cascades'
                    : 'Production-ready normalized tables with composite keys and foreign cascades'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {DB_TABLES_SCHEMA.map(table => (
                <div
                  key={table.name}
                  className="bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden"
                >
                  <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-900/80 border-b border-neutral-800">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-400">
                        TABLE {table.name}
                      </span>
                      <span className="text-[11px] text-neutral-500 hidden md:inline">
                        — {language === 'sw' ? table.swahiliDescription : table.description}
                      </span>
                    </div>

                    <button
                      onClick={() => copySqlSchema(table)}
                      className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 transition-colors"
                    >
                      {copiedTable === table.name ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied SQL</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy DDL</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead>
                        <tr className="border-b border-neutral-800 text-neutral-500 text-[10px] uppercase">
                          <th className="px-4 py-2 font-semibold">Column</th>
                          <th className="px-4 py-2 font-semibold">Type</th>
                          <th className="px-4 py-2 font-semibold">Constraints</th>
                          <th className="px-4 py-2 font-semibold font-sans">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-900">
                        {table.columns.map(col => (
                          <tr key={col.name} className="hover:bg-neutral-900/40">
                            <td className="px-4 py-2 text-neutral-200 font-bold">{col.name}</td>
                            <td className="px-4 py-2 text-sky-400">{col.type}</td>
                            <td className="px-4 py-2 text-amber-300/90 text-[11px]">{col.constraints}</td>
                            <td className="px-4 py-2 text-neutral-400 font-sans text-[11px]">{col.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: 12-Week Roadmap (Section 7) */}
      {activeTab === 'roadmap' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div>
                <h3 className="font-bold text-sm text-neutral-100">
                  {language === 'sw'
                    ? 'Mpango Kazi wa Wiki 12 (12-Week MVP Delivery Roadmap)'
                    : '12-Week MVP Engineering Roadmap'}
                </h3>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  {language === 'sw'
                    ? 'Kutoka wazo la msingi hadi uzinduzi wa Android Beta: Bofya kazi ili uweke tiki ya utekelezaji'
                    : 'Structured timeline from initial player to beta launch. Click to toggle milestone deliverables.'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {roadmap.map((phase, pIdx) => {
                const totalTasks = phase.tasks.length;
                const completedCount = phase.tasks.filter(t => t.completed).length;
                const progressPct = Math.round((completedCount / totalTasks) * 100);

                return (
                  <div
                    key={phase.phase}
                    className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-3"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2 border-b border-neutral-800/80">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-amber-400">
                            {phase.weeks}
                          </span>
                          <span className="text-neutral-600">·</span>
                          <h4 className="font-bold text-sm text-neutral-200">
                            {language === 'sw' ? phase.swahiliTitle : phase.title}
                          </h4>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-neutral-400">
                          {completedCount}/{totalTasks} Tasks ({progressPct}%)
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                            phase.status === 'COMPLETED'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : phase.status === 'IN_PROGRESS'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-neutral-800 text-neutral-400'
                          }`}
                        >
                          {phase.status}
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-500 h-full transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 text-xs">
                      {phase.tasks.map(task => (
                        <button
                          key={task.id}
                          onClick={() => toggleTask(pIdx, task.id)}
                          className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-left transition-colors ${
                            task.completed
                              ? 'bg-neutral-900/60 border-neutral-800 text-neutral-300'
                              : 'bg-neutral-900/30 border-neutral-800/60 text-neutral-400 hover:border-neutral-700'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded mt-0.5 shrink-0 flex items-center justify-center border transition-colors ${
                              task.completed
                                ? 'bg-amber-500 border-amber-500 text-neutral-950 font-bold'
                                : 'border-neutral-600'
                            }`}
                          >
                            {task.completed && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>

                          <div className="space-y-0.5">
                            <span
                              className={`block leading-snug font-medium ${
                                task.completed ? 'line-through text-neutral-400' : 'text-neutral-200'
                              }`}
                            >
                              {language === 'sw' ? task.swahiliTask : task.task}
                            </span>
                            <span className="text-[10px] text-neutral-500 block">
                              Mitigation: {task.riskMitigation}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Cloud Cost Calculator (Section 3.3 & 8) */}
      {activeTab === 'calculator' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-5">
            <div className="pb-3 border-b border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-neutral-100 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>
                    {language === 'sw'
                      ? 'Kikokotoo cha Gharama za Video: Cloudflare Stream vs AWS'
                      : 'Video Infrastructure Cost Estimator: Cloudflare vs AWS'}
                  </span>
                </h3>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  {language === 'sw'
                    ? 'Hesabu halisi ya bei ya video za meme zilizohifadhiwa na kutazamwa kila mwezi.'
                    : 'Real-time billing comparison based on monthly uploaded storage and viewer watch minutes.'}
                </p>
              </div>

              <div className="bg-neutral-950 px-3 py-1.5 rounded-xl border border-neutral-800 text-xs font-mono text-emerald-400">
                CF Savings: ${Math.max(0, awsTotalCost - cloudflareCost)}/mo
              </div>
            </div>

            {/* Sliders */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-2">
                <div className="flex justify-between items-center text-neutral-300">
                  <span>Dakika za Video Zilizohifadhiwa (Storage):</span>
                  <span className="font-mono text-amber-400 font-bold tabular-nums">
                    {storedMinutes.toLocaleString()} min (~{(storedMinutes / 60).toFixed(0)} masaa)
                  </span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="100000"
                  step="1000"
                  value={storedMinutes}
                  onChange={e => setStoredMinutes(parseInt(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <span className="text-[10px] text-neutral-500 block">
                  Takriban video {(storedMinutes * 4).toLocaleString()} za sekunde 15 kila moja.
                </span>
              </div>

              <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-2">
                <div className="flex justify-between items-center text-neutral-300">
                  <span>Dakika Zinazotazamwa kwa Mwezi (Traffic / Watch Time):</span>
                  <span className="font-mono text-sky-400 font-bold tabular-nums">
                    {viewedMinutes.toLocaleString()} min
                  </span>
                </div>
                <input
                  type="range"
                  min="10000"
                  max="2000000"
                  step="10000"
                  value={viewedMinutes}
                  onChange={e => setViewedMinutes(parseInt(e.target.value))}
                  className="w-full accent-sky-500 cursor-pointer"
                />
                <span className="text-[10px] text-neutral-500 block">
                  Sawa na watazamaji {(viewedMinutes / 15).toLocaleString()} wa wastani wa dakika 15 kwa siku.
                </span>
              </div>
            </div>

            {/* Side-by-side comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cloudflare Stream Card */}
              <div className="bg-gradient-to-br from-neutral-950 to-amber-950/20 border-2 border-amber-500/40 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🟠</span>
                    <span className="font-bold text-sm text-neutral-100">Cloudflare Stream (MVP Rec)</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-bold font-mono">
                    RECOMMENDED
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-amber-400 font-mono tabular-nums">
                    ${cloudflareCost}
                  </span>
                  <span className="text-xs text-neutral-400">/ mwezi</span>
                </div>

                <div className="space-y-1 text-xs text-neutral-300 border-t border-neutral-800/80 pt-2 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span>Hifadhi ($5 / 1k min):</span>
                    <span>${((storedMinutes / 1000) * 5).toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Uwasilishaji ($1 / 1k min):</span>
                    <span>${((viewedMinutes / 1000) * 1).toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Egress Bandwidth Fees:</span>
                    <span>$0 (BURE)</span>
                  </div>
                </div>

                <p className="text-[11px] text-neutral-400 pt-1 leading-relaxed">
                  ✅ Rahisi sana: Hakuna haja ya kujenga seva ya FFmpeg, queue, au kulipa pesa za data transfer (egress).
                </p>
              </div>

              {/* AWS Custom Pipeline Card */}
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">☁️</span>
                    <span className="font-bold text-sm text-neutral-100">AWS (S3 + MediaConvert + CloudFront)</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    ENTERPRISE SCALE
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-neutral-200 font-mono tabular-nums">
                    ${awsTotalCost}
                  </span>
                  <span className="text-xs text-neutral-400">/ mwezi</span>
                </div>

                <div className="space-y-1 text-xs text-neutral-300 border-t border-neutral-800/80 pt-2 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span>S3 Storage (~{storageGB.toFixed(0)}GB):</span>
                    <span>${awsS3Cost.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>MediaConvert Encoding:</span>
                    <span>${awsEncodeCost.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between text-rose-400">
                    <span>CloudFront Egress (~{egressGB.toFixed(0)}GB):</span>
                    <span>${awsCloudFrontCost.toFixed(0)}</span>
                  </div>
                </div>

                <p className="text-[11px] text-neutral-400 pt-1 leading-relaxed">
                  ⚠️ Tahadhari: Gharama za CloudFront Egress ($0.085/GB) huongezeka haraka sana watazamaji wanapozidi 50,000.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Production Risks & Guardrails (Section 8) */}
      {activeTab === 'risks' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
            <div className="pb-3 border-b border-neutral-800">
              <h3 className="font-bold text-sm text-neutral-100 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>
                  {language === 'sw'
                    ? 'Hatari Kubwa za Uendeshaji & Mbinu za Kujikinga (Section 8)'
                    : 'Production Risks, Scaling Bottlenecks & Guardrails'}
                </span>
              </h3>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                {language === 'sw'
                  ? 'Jinsi ya kulinda app dhidi ya gharama kubwa za video, ukiukwaji wa hakimiliki, na matusi.'
                  : 'Mitigation strategies for streaming bandwidth costs, copyright liability, and creator churn.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Risk 1: Video Costs */}
              <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-200 text-sm">
                    {language === 'sw' ? '1. Gharama za Bandwidth & Video' : '1. Video Bandwidth & Transcoding'}
                  </span>
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
                    High Impact
                  </span>
                </div>
                <p className="text-neutral-400 leading-relaxed">
                  {language === 'sw'
                    ? 'Kupakia video mamilioni kunaweza kuleta gharama za juu kwenye AWS MediaConvert na CloudFront.'
                    : 'Video egress and transcoding compute can quickly balloon in early growth phases.'}
                </p>
                <div className="p-2.5 bg-neutral-900/80 rounded-lg border border-neutral-800 text-neutral-300 space-y-1">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block font-sans">
                    {language === 'sw' ? 'Kinga (Mitigation):' : 'Mitigation:'}
                  </span>
                  <p className="text-[11px]">
                    {language === 'sw'
                      ? 'Tumia Cloudflare Stream mwanzoni ($5 kwa dakika 1000 za video zilizohifadhiwa + $1 kwa dakika 1000 zilizotazamwa, bila gharama za egress). Kwenye simu, tumia HLS 480p default kwa mtandao wa 3G/4G.'
                      : 'Adopt Cloudflare Stream ($5/1000 min stored, $1/1000 min streamed, zero egress fees). Default to 480p on cellular networks.'}
                  </p>
                </div>
              </div>

              {/* Risk 2: Content Moderation */}
              <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-200 text-sm">
                    {language === 'sw' ? '2. Udhibiti wa Maudhui (Moderation)' : '2. Content Moderation & Safety'}
                  </span>
                  <span className="text-[10px] font-mono text-rose-400 bg-rose-400/10 px-2 py-0.5 rounded">
                    Legal / App Store
                  </span>
                </div>
                <p className="text-neutral-400 leading-relaxed">
                  {language === 'sw'
                    ? 'Maudhui yasiyofaa, matusi ya Kiswahili, au uchochezi yanaweza kufanya app ifungiwe Play Store au Apple App Store.'
                    : 'Toxic content, local slang profanity, and explicit imagery violate store guidelines.'}
                </p>
                <div className="p-2.5 bg-neutral-900/80 rounded-lg border border-neutral-800 text-neutral-300 space-y-1">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block font-sans">
                    {language === 'sw' ? 'Kinga (Mitigation):' : 'Mitigation:'}
                  </span>
                  <p className="text-[11px]">
                    {language === 'sw'
                      ? 'Unganisha AI ya Sightengine / Hive kwa ajili ya kukagua picha kabla ya kuchapishwa. Weka kamusi ya matusi ya Kiswahili/Sheng kwenye Redis kwa ukaguzi wa papo hapo.'
                      : 'Automated 2-tier pipeline: Sightengine image prober + localized Swahili/Sheng regex filter on text overlays before release.'}
                  </p>
                </div>
              </div>

              {/* Risk 3: Copyright */}
              <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-200 text-sm">
                    {language === 'sw' ? '3. Hakimiliki ya Sauti & Video' : '3. Audio Copyright Fingerprinting'}
                  </span>
                  <span className="text-[10px] font-mono text-sky-400 bg-sky-400/10 px-2 py-0.5 rounded">
                    DMCA Risk
                  </span>
                </div>
                <p className="text-neutral-400 leading-relaxed">
                  {language === 'sw'
                    ? 'Memes nyingi hutumia nyimbo zenye hakimiliki kutoka lebo za muziki (WCB, Sony, Universal).'
                    : 'Creators frequently upload music snippets that trigger copyright takedown notices.'}
                </p>
                <div className="p-2.5 bg-neutral-900/80 rounded-lg border border-neutral-800 text-neutral-300 space-y-1">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block font-sans">
                    {language === 'sw' ? 'Kinga (Mitigation):' : 'Mitigation:'}
                  </span>
                  <p className="text-[11px]">
                    {language === 'sw'
                      ? 'Zuia klipu za sauti kuwa chini ya sekunde 15 (Fair Use meme exemption) na weka Audio Fingerprinting ya Audible Magic au ACRCloud kutambua nyimbo na kuwapa wasanii mikopo.'
                      : 'Cap commercial audio snippet length to <= 15s. Integrate ACRCloud acoustic fingerprinting to credit artists.'}
                  </p>
                </div>
              </div>

              {/* Risk 4: Creator Economy & Retention */}
              <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-200 text-sm">
                    {language === 'sw' ? '4. Utunzaji wa Watayarishaji (Retention)' : '4. Creator Economy & Retention'}
                  </span>
                  <span className="text-[10px] font-mono text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded">
                    Growth Factor
                  </span>
                </div>
                <p className="text-neutral-400 leading-relaxed">
                  {language === 'sw'
                    ? 'Kutumia pesa nyingi kwa watayarishaji kabla ya Product-Market Fit (PMF) kunamaliza mtaji mapema.'
                    : 'Premature creator fund payouts drain runway before achieving organic audience retention.'}
                </p>
                <div className="p-2.5 bg-neutral-900/80 rounded-lg border border-neutral-800 text-neutral-300 space-y-1">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block font-sans">
                    {language === 'sw' ? 'Kinga (Mitigation):' : 'Mitigation:'}
                  </span>
                  <p className="text-[11px]">
                    {language === 'sw'
                      ? 'Zingatia kwanza kuwapa watayarishaji hadhira (Distribution) na kutambuliwa kabla ya pesa. Tumia sarafu na zawadi za mashabiki (Gifts/Coins) ambapo mashabiki wenyewe ndio wanaomlipa mtayarishaji.'
                      : 'Prioritize algorithmic reach & distribution over cash subsidies. Use fan-funded virtual gifts (Sambusa, Kahawa, Diamond) for organic monetization.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
