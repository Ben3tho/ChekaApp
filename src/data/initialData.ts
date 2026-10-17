import { MemeVideo, Comment, GiftItem, RoadmapPhase, DbTable } from '../types';

export const INITIAL_MEME_VIDEOS: MemeVideo[] = [
  {
    id: 'meme_01',
    title: 'Kazi ya Ofisi & Critical Error',
    caption: 'Ukiwa umefanya kazi wiki mbili bila ku-save halafu ghafla Windows inaleta blue screen: "Restarting in 5 seconds" 😭💀',
    creator: {
      id: 'creator_01',
      name: 'Mwalimu wa Memes',
      username: 'mwalimu_comedy',
      avatar: '/src/assets/images/swahili_comedian_avatar_1792057038016.jpg',
      bio: 'Vicheko vya kila siku | Dar es Salaam & Nairobi 🇹🇿🇰🇪 | Usilie, Cheka!',
      verified: true,
      followersCount: 142800
    },
    mediaUrl: '/src/assets/images/funny_office_meme_thumb_1792057039620.jpg',
    mediaType: 'image',
    duration: 18,
    likesCount: 28450,
    commentsCount: 1340,
    sharesCount: 5210,
    savesCount: 3410,
    laughsCount: 9820,
    viewsCount: 184500,
    tags: ['#OfficeHumor', '#VunjaMbavu', '#KaziNgumu', '#SwahiliMemes'],
    soundTrack: {
      id: 'sound_01',
      title: 'Emotional Damage (East Africa Drill Remix)',
      artist: 'DJ Kicheko',
      durationSec: 18,
      effectKey: 'vineBoom'
    },
    topOverlayText: 'POV: WIKI 2 ZA KAZI BILA KU-SAVE',
    bottomOverlayText: 'WINDOWS: "CRITICAL RESTART IN 3, 2, 1..."',
    createdAt: '2026-10-14T18:30:00Z',
    isLiked: false,
    isSaved: false,
    isFollowed: false,
    signals: {
      watchRatio: 1.35, // rewatched
      watchMs: 24300,
      likes: 28450,
      shares: 5210,
      comments: 1340,
      skips: 82,
      ageHours: 6
    },
    moderationStatus: 'APPROVED'
  },
  {
    id: 'meme_02',
    title: 'Paka na Bei ya Kilo ya Samaki',
    caption: 'Paka akisikia samaki kilo moja soko la Ferry imetoka elfu tano hadi elfu kumi na nane! Atakula ugali bila mchuzi 🐟😹',
    creator: {
      id: 'creator_02',
      name: 'Bongo Comedy Hub',
      username: 'bongomemes_hq',
      avatar: '/src/assets/images/funny_cat_shock_meme_1792057039146.jpg',
      bio: 'Memes za wanyama na maisha halisi ya kitaa 🔥',
      verified: true,
      followersCount: 89400
    },
    mediaUrl: '/src/assets/images/funny_cat_shock_meme_1792057039146.jpg',
    mediaType: 'image',
    duration: 15,
    likesCount: 45200,
    commentsCount: 2890,
    sharesCount: 11200,
    savesCount: 6800,
    laughsCount: 19400,
    viewsCount: 310200,
    tags: ['#AnimalMemes', '#Uchumi', '#Cheka', '#PakaWaKitaa'],
    soundTrack: {
      id: 'sound_02',
      title: 'Oh No No No (High Pitch Afro)',
      artist: 'CapCut Meme Sounds',
      durationSec: 15,
      effectKey: 'laugh'
    },
    topOverlayText: 'BEI YA SAMAKI SOKONI:',
    bottomOverlayText: 'MIMI NA ELFU MBILI YANGU MFUKONI:',
    createdAt: '2026-10-14T21:15:00Z',
    isLiked: true,
    isSaved: true,
    isFollowed: true,
    signals: {
      watchRatio: 1.6,
      watchMs: 24000,
      likes: 45200,
      shares: 11200,
      comments: 2890,
      skips: 40,
      ageHours: 4
    },
    moderationStatus: 'APPROVED'
  },
  {
    id: 'meme_03',
    title: 'Kusimama Mbele ya Daladala',
    caption: 'Ukikaa siti ya mbele karibu na dereva wa daladala halafu uanze kumshauri akanyage mafuta mwendo kasi 😂🚌',
    creator: {
      id: 'creator_03',
      name: 'Nairobi & Dar Vines',
      username: 'streetcomedy_ea',
      avatar: '/src/assets/images/bongo_street_comedy_1792057041770.jpg',
      bio: 'Vicheko vya daladala, matatu, mtaani na vijiweni!',
      verified: false,
      followersCount: 63100
    },
    mediaUrl: '/src/assets/images/bongo_street_comedy_1792057041770.jpg',
    mediaType: 'image',
    duration: 22,
    likesCount: 19700,
    commentsCount: 860,
    sharesCount: 3400,
    savesCount: 1980,
    laughsCount: 6500,
    viewsCount: 125000,
    tags: ['#BongoVibe', '#Daladala', '#NairobiComedy', '#Matatu'],
    soundTrack: {
      id: 'sound_03',
      title: 'Bongo Taarab Hip Hop Comedy Drop',
      artist: 'Producer Juma',
      durationSec: 22,
      effectKey: 'rimshot'
    },
    topOverlayText: 'DEREVA: "NINA MIAKA 20 BARABARANI"',
    bottomOverlayText: 'MIMI KWENYE PASSENGER SEAT: "WEKA GIA YA TANO BRO"',
    createdAt: '2026-10-15T01:00:00Z',
    isLiked: false,
    isSaved: false,
    isFollowed: false,
    signals: {
      watchRatio: 1.1,
      watchMs: 24200,
      likes: 19700,
      shares: 3400,
      comments: 860,
      skips: 110,
      ageHours: 2
    },
    moderationStatus: 'APPROVED'
  },
  {
    id: 'meme_04',
    title: 'Simu ya Saa Saba Usiku',
    caption: 'Mtu anakupigia simu saa saba usiku: "Vipi umelala?" Hapana mzee niko rehearsal ya mazishi yangu! 💀🤣',
    creator: {
      id: 'creator_01',
      name: 'Mwalimu wa Memes',
      username: 'mwalimu_comedy',
      avatar: '/src/assets/images/swahili_comedian_avatar_1792057038016.jpg',
      bio: 'Vicheko vya kila siku | Dar es Salaam & Nairobi 🇹🇿🇰🇪 | Usilie, Cheka!',
      verified: true,
      followersCount: 142800
    },
    mediaUrl: '/src/assets/images/swahili_comedian_avatar_1792057038016.jpg',
    mediaType: 'image',
    duration: 16,
    likesCount: 52100,
    commentsCount: 4120,
    sharesCount: 14900,
    savesCount: 8900,
    laughsCount: 23100,
    viewsCount: 420000,
    tags: ['#StandUpComedy', '#Kicheko', '#SwahiliHumor', '#Relatable'],
    soundTrack: {
      id: 'sound_04',
      title: 'Swahili Live Comedy Club Crowd Roar',
      artist: 'StandUp Live',
      durationSec: 16,
      effectKey: 'bruh'
    },
    topOverlayText: 'CALL SAA 7:30 USIKU: "UMELALA?"',
    bottomOverlayText: 'MIMI: "HAPANA NINAANGALIA KAMA DARAJA LA KIGAMBONI LIKO WAZI"',
    createdAt: '2026-10-14T12:00:00Z',
    isLiked: false,
    isSaved: false,
    isFollowed: true,
    signals: {
      watchRatio: 1.85,
      watchMs: 29600,
      likes: 52100,
      shares: 14900,
      comments: 4120,
      skips: 18,
      ageHours: 14
    },
    moderationStatus: 'APPROVED'
  }
];

export const INITIAL_COMMENTS: Record<string, Comment[]> = {
  meme_01: [
    {
      id: 'c1_01',
      videoId: 'meme_01',
      user: {
        name: 'Fatma K',
        username: 'fatma_tech',
        avatar: '/src/assets/images/funny_cat_shock_meme_1792057039146.jpg'
      },
      text: 'Mimi nililia ofisini mbele ya HR kabisa! Hii maumivu hayana dawa 😭😭',
      timestamp: 'Dakika 15 zilizopita',
      likes: 420,
      isLiked: false,
      replies: [
        {
          id: 'c1_01_r1',
          videoId: 'meme_01',
          user: {
            name: 'Rashid Dev',
            username: 'rashid_code',
            avatar: '/src/assets/images/swahili_comedian_avatar_1792057038016.jpg'
          },
          text: 'Ctrl + S inatakiwa iwe reflex kama kupumua mkuu 😂',
          timestamp: 'Dakika 8 zilizopita',
          likes: 85
        }
      ]
    },
    {
      id: 'c1_02',
      videoId: 'meme_01',
      user: {
        name: 'Brian Omondi',
        username: 'brian_nbo',
        avatar: '/src/assets/images/bongo_street_comedy_1792057041770.jpg'
      },
      text: 'Windows updates are the real villains of generation Z! 💀',
      timestamp: 'Saa 1 iliyopita',
      likes: 215,
      isLiked: true
    }
  ],
  meme_02: [
    {
      id: 'c2_01',
      videoId: 'meme_02',
      user: {
        name: 'Asha Mzee',
        username: 'asha_kariakoo',
        avatar: '/src/assets/images/swahili_comedian_avatar_1792057038016.jpg'
      },
      text: 'Huyo paka sura yake inasema: "Kwa hiyo mimi nile nyasi leo?" 😹😹😹',
      timestamp: 'Dakika 25 zilizopita',
      likes: 890,
      isLiked: true
    },
    {
      id: 'c2_02',
      videoId: 'meme_02',
      user: {
        name: 'Kevin Mutua',
        username: 'kev_comedy',
        avatar: '/src/assets/images/bongo_street_comedy_1792057041770.jpg'
      },
      text: 'Soko la Ferry hali ya hewa na bei vimegombana wote wawili haha',
      timestamp: 'Dakika 40 zilizopita',
      likes: 310
    }
  ],
  meme_03: [
    {
      id: 'c3_01',
      videoId: 'meme_03',
      user: {
        name: 'Juma Selemani',
        username: 'juma_driver',
        avatar: '/src/assets/images/swahili_comedian_avatar_1792057038016.jpg'
      },
      text: 'Dereva wa daladala akishika usukani anajiona kama Lewis Hamilton wa Kariakoo 😂',
      timestamp: 'Dakika 5 zilizopita',
      likes: 145
    }
  ],
  meme_04: [
    {
      id: 'c4_01',
      videoId: 'meme_04',
      user: {
        name: 'Zuhura Bakari',
        username: 'zuhura_b',
        avatar: '/src/assets/images/funny_cat_shock_meme_1792057039146.jpg'
      },
      text: 'Alafu jibu linalofuata ni "Nilikuwa tu nataka kusikia sauti yako" saa saba usiku jamani! 🤦‍♀️🤣',
      timestamp: 'Saa 2 zilizopita',
      likes: 1204,
      isLiked: true
    }
  ]
};

export const GIFTS_CATALOG: GiftItem[] = [
  { id: 'gift_sambusa', name: 'Sambusa Moto', swahiliName: 'Sambusa ya Nyama', icon: '🥟', coinPrice: 5, color: '#f59e0b' },
  { id: 'gift_kahawa', name: 'Kahawa ya Tangawizi', swahiliName: 'Kahawa Chungu', icon: '☕', coinPrice: 10, color: '#b45309' },
  { id: 'gift_nyamachoma', name: 'Nyama Choma Plate', swahiliName: 'Kilo ya Choma', icon: '🥩', coinPrice: 50, color: '#ef4444' },
  { id: 'gift_kofia', name: 'Kofia ya Ushindi', swahiliName: 'Taji la Mchekeshaji', icon: '👑', coinPrice: 100, color: '#eab308' },
  { id: 'gift_diamond', name: 'Almasi ya Meme', swahiliName: 'Meme Diamond', icon: '💎', coinPrice: 500, color: '#06b6d4' }
];

// Database Schema definition matching section 5 of user prompt
export const DB_TABLES_SCHEMA: DbTable[] = [
  {
    name: 'users',
    description: 'Stores user accounts, authentication credentials, profiles and bios',
    swahiliDescription: 'Inashikilia taarifa za watumiaji, akaunti, picha na bio',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY DEFAULT gen_random_uuid()', description: 'Unique user identifier' },
      { name: 'username', type: 'VARCHAR(50)', constraints: 'UNIQUE NOT NULL', description: 'Handle e.g. @mwalimu_comedy' },
      { name: 'email', type: 'VARCHAR(255)', constraints: 'UNIQUE NOT NULL', description: 'User login email' },
      { name: 'password_hash', type: 'VARCHAR(255)', constraints: 'NOT NULL', description: 'Bcrypt hashed password' },
      { name: 'avatar_url', type: 'TEXT', constraints: 'DEFAULT NULL', description: 'CDN URL to profile picture' },
      { name: 'bio', type: 'TEXT', constraints: 'DEFAULT NULL', description: 'Short creator biography' },
      { name: 'created_at', type: 'TIMESTAMPTZ', constraints: 'DEFAULT NOW()', description: 'Account creation timestamp' }
    ],
    sampleRows: [
      { id: 'u_101', username: 'mwalimu_comedy', email: 'mwalimu@cheka.io', avatar_url: 'cdn/avatars/mwalimu.jpg', bio: 'Dar es Salaam standup 🇹🇿' },
      { id: 'u_102', username: 'streetcomedy_ea', email: 'nairobi@cheka.io', avatar_url: 'cdn/avatars/street.jpg', bio: 'Vicheko vya mtaani 🔥' }
    ]
  },
  {
    name: 'videos',
    description: 'Core vertical reel metadata, transcoding status, HLS links and durations',
    swahiliDescription: 'Metadata ya video fupi za meme, maelezo, link za HLS na hali ya transcode',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY DEFAULT gen_random_uuid()', description: 'Unique reel video ID' },
      { name: 'user_id', type: 'UUID', constraints: 'REFERENCES users(id) ON DELETE CASCADE', description: 'Creator user identifier' },
      { name: 'caption', type: 'TEXT', constraints: 'NOT NULL', description: 'Meme punchline & caption' },
      { name: 'video_url', type: 'TEXT', constraints: 'NOT NULL', description: 'HLS Master manifest m3u8 URL' },
      { name: 'thumbnail_url', type: 'TEXT', constraints: 'NOT NULL', description: 'Poster image URL' },
      { name: 'duration', type: 'SMALLINT', constraints: 'CHECK(duration BETWEEN 5 AND 60)', description: 'Video duration in seconds' },
      { name: 'status', type: 'VARCHAR(20)', constraints: "DEFAULT 'READY'", description: 'READY, PROCESSING, FLAGGED' },
      { name: 'created_at', type: 'TIMESTAMPTZ', constraints: 'DEFAULT NOW()', description: 'Upload timestamp' }
    ],
    sampleRows: [
      { id: 'v_801', user_id: 'u_101', caption: 'Kazi ya ofisi bila ku-save 😭', duration: 18, status: 'READY', video_url: 'cdn/hls/v_801/master.m3u8' },
      { id: 'v_802', user_id: 'u_102', caption: 'Paka na bei ya samaki soko la Ferry 🐟', duration: 15, status: 'READY', video_url: 'cdn/hls/v_802/master.m3u8' }
    ]
  },
  {
    name: 'likes',
    description: 'High-volume like table with composite primary key preventing duplicate likes',
    swahiliDescription: 'Jedwali la likes, lina unique key kuzuia like mara mbili',
    columns: [
      { name: 'user_id', type: 'UUID', constraints: 'REFERENCES users(id) ON DELETE CASCADE', description: 'User who liked' },
      { name: 'video_id', type: 'UUID', constraints: 'REFERENCES videos(id) ON DELETE CASCADE', description: 'Reel that was liked' },
      { name: 'created_at', type: 'TIMESTAMPTZ', constraints: 'DEFAULT NOW()', description: 'Timestamp of like event' }
    ],
    sampleRows: [
      { user_id: 'u_101', video_id: 'v_802', created_at: '2026-10-14 21:20:00' },
      { user_id: 'u_102', video_id: 'v_801', created_at: '2026-10-14 22:05:12' }
    ]
  },
  {
    name: 'comments',
    description: 'Threaded user comments and discussions under reels',
    swahiliDescription: 'Maoni ya watumiaji na majibu chini ya video ya meme',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY DEFAULT gen_random_uuid()', description: 'Comment ID' },
      { name: 'video_id', type: 'UUID', constraints: 'REFERENCES videos(id) ON DELETE CASCADE', description: 'Parent video' },
      { name: 'user_id', type: 'UUID', constraints: 'REFERENCES users(id) ON DELETE CASCADE', description: 'Author' },
      { name: 'text', type: 'VARCHAR(500)', constraints: 'NOT NULL', description: 'Comment content' },
      { name: 'created_at', type: 'TIMESTAMPTZ', constraints: 'DEFAULT NOW()', description: 'Comment timestamp' }
    ],
    sampleRows: [
      { id: 'c_01', video_id: 'v_801', user_id: 'u_102', text: 'Hii imenipata live ofisini juzi!' }
    ]
  },
  {
    name: 'views',
    description: 'High-throughput stream events recording exact watch time in milliseconds',
    swahiliDescription: 'Matukio ya kutazama video na muda halisi (milliseconds) kwa ajili ya algorithm',
    columns: [
      { name: 'video_id', type: 'UUID', constraints: 'REFERENCES videos(id)', description: 'Target video' },
      { name: 'user_id', type: 'UUID', constraints: 'REFERENCES users(id)', description: 'Viewer or guest' },
      { name: 'watch_ms', type: 'INTEGER', constraints: 'NOT NULL', description: 'Time watched in ms (critical signal)' },
      { name: 'created_at', type: 'TIMESTAMPTZ', constraints: 'DEFAULT NOW()', description: 'Event time' }
    ],
    sampleRows: [
      { video_id: 'v_801', user_id: 'u_102', watch_ms: 24300, created_at: '2026-10-15 01:23:45' }
    ]
  },
  {
    name: 'follows',
    description: 'Social graph follower / following relationships',
    swahiliDescription: 'Uhusiano wa nani anamfuata nani (Follower -> Followee)',
    columns: [
      { name: 'follower_id', type: 'UUID', constraints: 'REFERENCES users(id)', description: 'User following' },
      { name: 'followee_id', type: 'UUID', constraints: 'REFERENCES users(id)', description: 'Creator being followed' },
      { name: 'created_at', type: 'TIMESTAMPTZ', constraints: 'DEFAULT NOW()', description: 'Follow event timestamp' }
    ],
    sampleRows: [
      { follower_id: 'u_102', followee_id: 'u_101', created_at: '2026-10-10 14:00:00' }
    ]
  }
];

// 12-Week Roadmap matching section 7 of user prompt
export const ROADMAP_PHASES: RoadmapPhase[] = [
  {
    phase: 'Phase 1',
    weeks: 'Wiki 1–3',
    title: 'Core Engine: Auth, Upload & Vertical Video Player',
    swahiliTitle: 'Msingi wa Kwanza: Usajili, Upakiaji & Video Player',
    status: 'COMPLETED',
    priority: 'LAZIMA',
    tasks: [
      { id: 't1', task: 'Implement Vertical Reel Player with smooth swipe up/down', swahiliTask: 'Tengeneza Vertical Video Feed (swipe juu/chini)', completed: true, riskMitigation: 'Hardware accelerated CSS transforms' },
      { id: 't2', task: 'Build Auth & Session Management (JWT / Refresh tokens)', swahiliTask: 'Mfumo wa Usajili na Kuingia (JWT + Redis session)', completed: true, riskMitigation: 'HttpOnly secure cookies' },
      { id: 't3', task: 'Video Upload & Client Trimmer (15-60s limit)', swahiliTask: 'Uchapishaji wa video fupi na chombo cha kukata (Trim)', completed: true, riskMitigation: 'Client-side canvas validation' },
      { id: 't4', task: 'Cloud Transcoding Pipeline (HLS 240p to 1080p)', swahiliTask: 'Bomba la Transcoding (Cloudflare Stream / AWS)', completed: true, riskMitigation: 'Adaptive multi-bitrate HLS' }
    ]
  },
  {
    phase: 'Phase 2',
    weeks: 'Wiki 4–6',
    title: 'Social Graph: Likes, Comments, Shares & Creator Profiles',
    swahiliTitle: 'Mahusiano: Like, Maoni, Kusambaza & Wasifu wa Watayarishaji',
    status: 'COMPLETED',
    priority: 'LAZIMA',
    tasks: [
      { id: 't5', task: 'Real-time Likes with Idempotency & Debounce', swahiliTask: 'Like ya papo hapo na kuzuia duplicate (Idempotency)', completed: true, riskMitigation: 'Redis SETNX / Composite keys' },
      { id: 't6', task: 'Nested Comments Drawer with Quick Reactions', swahiliTask: 'Dirisha la maoni na hisia za haraka (Emoji reactions)', completed: true, riskMitigation: 'PostgreSQL nested trees' },
      { id: 't7', task: 'Creator Profile View with Tabbed Grids', swahiliTask: 'Wasifu wa mtayarishaji na gridi ya video', completed: true, riskMitigation: 'Cached profile counters' },
      { id: 't8', task: 'Native Web Share & Social Share Integration', swahiliTask: 'Kusambaza WhatsApp, Twitter na kunakili link', completed: true, riskMitigation: 'Deep linking with fallback URL' }
    ]
  },
  {
    phase: 'Phase 3',
    weeks: 'Wiki 7–9',
    title: 'Recommendation Engine v1 & Real-time Notifications',
    swahiliTitle: 'Mfumo wa For You (Algorithm) & Arifa za Moja kwa Moja',
    status: 'IN_PROGRESS',
    priority: 'MUHIMU',
    tasks: [
      { id: 't9', task: 'Ranking formula implementation with watch_ratio signal', swahiliTask: 'Formula ya ranking: score = (watch*3) + (likes*2) + shares - skips', completed: true, riskMitigation: 'Event-driven Kafka aggregation' },
      { id: 't10', task: 'Cold-start feed based on trending hashtags & locality', swahiliTask: 'Feed ya mwanzo (Cold start) kwa kutumia vitambulisho maarufu', completed: true, riskMitigation: 'Location + trending fallback cache' },
      { id: 't11', task: 'WebSockets notification gateway for creator alerts', swahiliTask: 'WebSockets kwa arifa za likes na maoni', completed: true, riskMitigation: 'Redis Pub/Sub cluster' },
      { id: 't12', task: 'Time-decay decay curve for fresh content discovery', swahiliTask: 'Mporomoko wa muda (Decay) kuzuia video za zamani kutawala', completed: true, riskMitigation: 'Exponential half-life decay' }
    ]
  },
  {
    phase: 'Phase 4',
    weeks: 'Wiki 10–12',
    title: 'Polish, AI Moderation & Android Beta Launch',
    swahiliTitle: 'Kusafisha Mfumo, AI ya Usalama & Uzinduzi wa Awali wa Android',
    status: 'PLANNED',
    priority: 'LAZIMA',
    tasks: [
      { id: 't13', task: 'Automated AI Content Moderation & Swahili Slang Filter', swahiliTask: 'Uchujaji wa picha na matusi ya Kiswahili kupitia AI', completed: true, riskMitigation: 'Sightengine / Hive API + human review' },
      { id: 't14', task: 'Audio Fingerprint Detection for Copyright Compliance', swahiliTask: 'Ugunduzi wa hakimiliki ya sauti (Audible Magic style)', completed: false, riskMitigation: 'Acoustic fingerprint matching' },
      { id: 't15', task: 'Coins & Gifts monetization MVP setup', swahiliTask: 'Mfumo wa Zawadi na Sarafu (Coins & Gifts)', completed: true, riskMitigation: 'Ledger-based double entry database' },
      { id: 't16', task: 'Android APK Beta Release on Play Store', swahiliTask: 'Uzinduzi wa Android Beta kwa watumiaji 1,000 wa kwanza', completed: false, riskMitigation: 'Staged rollout 10% -> 50% -> 100%' }
    ]
  }
];
