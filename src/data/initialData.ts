import { MemeVideo, Comment, GiftItem, RoadmapPhase, DbTable } from '../types';

export const INITIAL_MEME_VIDEOS: MemeVideo[] = [
  {
    id: 'bd50085c-5a8f-4eca-8923-7173a14c38a1',
    title: 'Testing vibe',
    caption: 'Testing vibe - Hii imenikuta mimi mwenyewe live bila chenga! Cheka uongeze siku za kuishi 😂💀',
    creator: {
      id: '93021918-8fce-4c5a-a8d7-f446a8eef88b',
      name: 'Ben',
      username: 'Ben',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Ben',
      bio: 'Cheka App Creator & Owner',
      verified: true,
      followersCount: 52000
    },
    videoUid: '2d57e02c332ca91e3aa22f330eeb8f62',
    mediaUrl: 'https://customer-l52pq5hwfzlky2e2.cloudflarestream.com/2d57e02c332ca91e3aa22f330eeb8f62/thumbnails/thumbnail.jpg',
    mediaType: 'video',
    duration: 30,
    likesCount: 120,
    commentsCount: 15,
    sharesCount: 34,
    savesCount: 18,
    laughsCount: 45,
    viewsCount: 3413,
    tags: ['#Cheka', '#Vibe', '#BongoComedy', '#Burudani'],
    soundTrack: {
      id: 'sound_ben_01',
      title: 'Original Sound - Ben Comedy',
      artist: 'Ben',
      durationSec: 30,
      effectKey: 'laugh'
    },
    topOverlayText: 'TESTING VIBE LIVE',
    bottomOverlayText: 'CHEKA NA FURAHIA!',
    createdAt: '2026-10-18T07:48:22Z',
    isLiked: false,
    isSaved: false,
    isFollowed: false,
    streamPlayback: {
      hls: 'https://videodelivery.net/2d57e02c332ca91e3aa22f330eeb8f62/manifest/video.m3u8',
      iframe: 'https://iframe.videodelivery.net/2d57e02c332ca91e3aa22f330eeb8f62',
      mp4: 'https://videodelivery.net/2d57e02c332ca91e3aa22f330eeb8f62/downloads/default.mp4',
      thumbnail: 'https://customer-l52pq5hwfzlky2e2.cloudflarestream.com/2d57e02c332ca91e3aa22f330eeb8f62/thumbnails/thumbnail.jpg'
    },
    signals: {
      watchRatio: 1.2,
      watchMs: 36000,
      likes: 120,
      shares: 34,
      comments: 15,
      skips: 5,
      ageHours: 1
    },
    moderationStatus: 'APPROVED'
  },
  {
    id: 'c0ceac82-17c5-42cf-96f7-090147112651',
    title: 'POV: KAZI YA JUMATATU',
    caption: 'POV: KAZI YA JUMATATU - Hii imenikuta mimi mwenyewe live bila chenga! Cheka uongeze siku za kuishi 😂💀',
    creator: {
      id: '93021918-8fce-4c5a-a8d7-f446a8eef88b',
      name: 'Ben',
      username: 'Ben',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Ben',
      bio: 'Cheka App Creator & Owner',
      verified: true,
      followersCount: 52000
    },
    videoUid: '5047b7807a709a702c1a73c1ea5dbe67',
    mediaUrl: 'https://customer-l52pq5hwfzlky2e2.cloudflarestream.com/5047b7807a709a702c1a73c1ea5dbe67/thumbnails/thumbnail.jpg',
    mediaType: 'video',
    duration: 30,
    likesCount: 88,
    commentsCount: 9,
    sharesCount: 22,
    savesCount: 14,
    laughsCount: 65,
    viewsCount: 3413,
    tags: ['#KaziYaJumatatu', '#MemeReels', '#VunjaMbavu'],
    soundTrack: {
      id: 'sound_ben_02',
      title: 'Monday Blues Comedy Mix',
      artist: 'Ben',
      durationSec: 30,
      effectKey: 'vineBoom'
    },
    topOverlayText: 'POV: KAZI YA JUMATATU',
    bottomOverlayText: 'WIKI NZIMA INAANZA HIVI!',
    createdAt: '2026-10-18T07:48:22Z',
    isLiked: false,
    isSaved: false,
    isFollowed: false,
    streamPlayback: {
      hls: 'https://videodelivery.net/5047b7807a709a702c1a73c1ea5dbe67/manifest/video.m3u8',
      iframe: 'https://iframe.videodelivery.net/5047b7807a709a702c1a73c1ea5dbe67',
      mp4: 'https://videodelivery.net/5047b7807a709a702c1a73c1ea5dbe67/downloads/default.mp4',
      thumbnail: 'https://customer-l52pq5hwfzlky2e2.cloudflarestream.com/5047b7807a709a702c1a73c1ea5dbe67/thumbnails/thumbnail.jpg'
    },
    signals: {
      watchRatio: 1.1,
      watchMs: 33000,
      likes: 88,
      shares: 22,
      comments: 9,
      skips: 8,
      ageHours: 2
    },
    moderationStatus: 'APPROVED'
  },
  {
    id: '35580876-18ca-4401-a67d-78fcc1e3ff33',
    title: 'JARIBIO LANGU LA KWANZA',
    caption: 'JARIBIO LANGU LA KWANZA - Burudani mwanzo mwisho',
    creator: {
      id: '93021918-8fce-4c5a-a8d7-f446a8eef88b',
      name: 'Ben',
      username: 'Ben',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Ben',
      bio: 'Cheka App Creator & Owner',
      verified: true,
      followersCount: 52000
    },
    videoUid: 'c5b3320c463567bc7d4dee18c0a1156e',
    mediaUrl: 'https://customer-l52pq5hwfzlky2e2.cloudflarestream.com/c5b3320c463567bc7d4dee18c0a1156e/thumbnails/thumbnail.jpg',
    mediaType: 'video',
    duration: 25,
    likesCount: 245,
    commentsCount: 30,
    sharesCount: 60,
    savesCount: 42,
    laughsCount: 110,
    viewsCount: 8101,
    tags: ['#JaribioLaKwanza', '#Cheka', '#Comedy'],
    soundTrack: {
      id: 'sound_ben_03',
      title: 'Comedy Vibes EA',
      artist: 'Ben',
      durationSec: 25,
      effectKey: 'laugh'
    },
    topOverlayText: 'JARIBIO LANGU LA KWANZA',
    bottomOverlayText: 'BURUDANI MWANZO MWISHO!',
    createdAt: '2026-10-18T07:47:57Z',
    isLiked: false,
    isSaved: false,
    isFollowed: false,
    streamPlayback: {
      hls: 'https://videodelivery.net/c5b3320c463567bc7d4dee18c0a1156e/manifest/video.m3u8',
      iframe: 'https://iframe.videodelivery.net/c5b3320c463567bc7d4dee18c0a1156e',
      mp4: 'https://videodelivery.net/c5b3320c463567bc7d4dee18c0a1156e/downloads/default.mp4',
      thumbnail: 'https://customer-l52pq5hwfzlky2e2.cloudflarestream.com/c5b3320c463567bc7d4dee18c0a1156e/thumbnails/thumbnail.jpg'
    },
    signals: {
      watchRatio: 1.4,
      watchMs: 35000,
      likes: 245,
      shares: 60,
      comments: 30,
      skips: 3,
      ageHours: 3
    },
    moderationStatus: 'APPROVED'
  },
  {
    id: '3857ab96-9b3a-4f33-8a70-33673b86fcb2',
    title: 'JARIBIO LANGU LA KWANZA (Part 2)',
    caption: 'JARIBIO LANGU LA KWANZA - Burudani mwanzo mwisho',
    creator: {
      id: '93021918-8fce-4c5a-a8d7-f446a8eef88b',
      name: 'Ben',
      username: 'Ben',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Ben',
      bio: 'Cheka App Creator & Owner',
      verified: true,
      followersCount: 52000
    },
    videoUid: 'ac386c7bde396a1365c521c13844a212',
    mediaUrl: 'https://customer-l52pq5hwfzlky2e2.cloudflarestream.com/ac386c7bde396a1365c521c13844a212/thumbnails/thumbnail.jpg',
    mediaType: 'video',
    duration: 20,
    likesCount: 160,
    commentsCount: 18,
    sharesCount: 40,
    savesCount: 29,
    laughsCount: 75,
    viewsCount: 5553,
    tags: ['#ChekaTanzania', '#ComedyGold'],
    soundTrack: {
      id: 'sound_ben_04',
      title: 'Original Sound',
      artist: 'Ben',
      durationSec: 20,
      effectKey: 'boing'
    },
    topOverlayText: 'JARIBIO LA PILI',
    bottomOverlayText: 'CHEKA KWA NGUVU!',
    createdAt: '2026-10-18T07:47:42Z',
    isLiked: false,
    isSaved: false,
    isFollowed: false,
    streamPlayback: {
      hls: 'https://videodelivery.net/ac386c7bde396a1365c521c13844a212/manifest/video.m3u8',
      iframe: 'https://iframe.videodelivery.net/ac386c7bde396a1365c521c13844a212',
      mp4: 'https://videodelivery.net/ac386c7bde396a1365c521c13844a212/downloads/default.mp4',
      thumbnail: 'https://customer-l52pq5hwfzlky2e2.cloudflarestream.com/ac386c7bde396a1365c521c13844a212/thumbnails/thumbnail.jpg'
    },
    signals: {
      watchRatio: 1.3,
      watchMs: 26000,
      likes: 160,
      shares: 40,
      comments: 18,
      skips: 4,
      ageHours: 4
    },
    moderationStatus: 'APPROVED'
  },
  {
    id: 'b3c3b16e-a2a3-4120-b9a5-861d8ed455ca',
    title: 'POV: KAZI YA JUMATATU (Special)',
    caption: 'POV: KAZI YA JUMATATU - Hii imenikuta mimi mwenyewe live bila chenga! Cheka uongeze siku za kuishi 😂💀',
    creator: {
      id: '93021918-8fce-4c5a-a8d7-f446a8eef88b',
      name: 'Ben',
      username: 'Ben',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Ben',
      bio: 'Cheka App Creator & Owner',
      verified: true,
      followersCount: 52000
    },
    videoUid: '1a67f20e1a0adc4561c3dfcf4488a17d',
    mediaUrl: 'https://customer-l52pq5hwfzlky2e2.cloudflarestream.com/1a67f20e1a0adc4561c3dfcf4488a17d/thumbnails/thumbnail.jpg',
    mediaType: 'video',
    duration: 28,
    likesCount: 310,
    commentsCount: 42,
    sharesCount: 78,
    savesCount: 55,
    laughsCount: 140,
    viewsCount: 9047,
    tags: ['#ChekaApp', '#StandupComedy', '#Relatable'],
    soundTrack: {
      id: 'sound_ben_05',
      title: 'Monday Comedy Beat',
      artist: 'Ben',
      durationSec: 28,
      effectKey: 'vineBoom'
    },
    topOverlayText: 'POV: KAZI YA JUMATATU',
    bottomOverlayText: 'USIKATE TAMAA!',
    createdAt: '2026-10-18T07:41:52Z',
    isLiked: false,
    isSaved: false,
    isFollowed: false,
    streamPlayback: {
      hls: 'https://videodelivery.net/1a67f20e1a0adc4561c3dfcf4488a17d/manifest/video.m3u8',
      iframe: 'https://iframe.videodelivery.net/1a67f20e1a0adc4561c3dfcf4488a17d',
      mp4: 'https://videodelivery.net/1a67f20e1a0adc4561c3dfcf4488a17d/downloads/default.mp4',
      thumbnail: 'https://customer-l52pq5hwfzlky2e2.cloudflarestream.com/1a67f20e1a0adc4561c3dfcf4488a17d/thumbnails/thumbnail.jpg'
    },
    signals: {
      watchRatio: 1.5,
      watchMs: 42000,
      likes: 310,
      shares: 78,
      comments: 42,
      skips: 2,
      ageHours: 5
    },
    moderationStatus: 'APPROVED'
  }
];

const MEME_COMMENTS_1: Comment[] = [
  {
    id: 'c1_01',
    videoId: '897cb5b0-9057-4b5e-b0d1-1c2ef034a17b',
    user: {
      name: 'Fatma K',
      username: 'fatma_tech',
      avatar: '/assets/images/funny_cat_shock_meme_1792057039146.jpg'
    },
    text: 'Mimi nililia ofisini mbele ya HR kabisa! Hii maumivu hayana dawa 😭😭',
    timestamp: 'Dakika 15 zilizopita',
    likes: 420,
    isLiked: false,
    replies: [
      {
        id: 'c1_01_r1',
        videoId: '897cb5b0-9057-4b5e-b0d1-1c2ef034a17b',
        user: {
          name: 'Rashid Dev',
          username: 'rashid_code',
          avatar: '/assets/images/swahili_comedian_avatar_1792057038016.jpg'
        },
        text: 'Ctrl + S inatakiwa iwe reflex kama kupumua mkuu 😂',
        timestamp: 'Dakika 8 zilizopita',
        likes: 85
      }
    ]
  },
  {
    id: 'c1_02',
    videoId: '897cb5b0-9057-4b5e-b0d1-1c2ef034a17b',
    user: {
      name: 'Brian Omondi',
      username: 'brian_nbo',
      avatar: '/assets/images/bongo_street_comedy_1792057041770.jpg'
    },
    text: 'Windows updates are the real villains of generation Z! 💀',
    timestamp: 'Saa 1 iliyopita',
    likes: 215,
    isLiked: true
  }
];

const MEME_COMMENTS_2: Comment[] = [
  {
    id: 'c2_01',
    videoId: '04263945-e8e7-4bf2-9dfb-2579a76aa67e',
    user: {
      name: 'Asha Mzee',
      username: 'asha_kariakoo',
      avatar: '/assets/images/swahili_comedian_avatar_1792057038016.jpg'
    },
    text: 'Huyo paka sura yake inasema: "Kwa hiyo mimi nile nyasi leo?" 😹😹😹',
    timestamp: 'Dakika 25 zilizopita',
    likes: 890,
    isLiked: true
  },
  {
    id: 'c2_02',
    videoId: '04263945-e8e7-4bf2-9dfb-2579a76aa67e',
    user: {
      name: 'Kevin Mutua',
      username: 'kev_comedy',
      avatar: '/assets/images/bongo_street_comedy_1792057041770.jpg'
    },
    text: 'Soko la Ferry hali ya hewa na bei vimegombana wote wawili haha',
    timestamp: 'Dakika 40 zilizopita',
    likes: 310
  }
];

const MEME_COMMENTS_3: Comment[] = [
  {
    id: 'c3_01',
    videoId: '4be1bbc1-c54b-4bea-beef-1d714c22af1d',
    user: {
      name: 'Juma Selemani',
      username: 'juma_driver',
      avatar: '/assets/images/swahili_comedian_avatar_1792057038016.jpg'
    },
    text: 'Dereva wa daladala akishika usukani anajiona kama Lewis Hamilton wa Kariakoo 😂',
    timestamp: 'Dakika 5 zilizopita',
    likes: 145
  }
];

const MEME_COMMENTS_4: Comment[] = [
  {
    id: 'c4_01',
    videoId: '4d1c55c6-908c-4d85-a0ca-6b4951405ba9',
    user: {
      name: 'Zuhura Bakari',
      username: 'zuhura_b',
      avatar: '/assets/images/funny_cat_shock_meme_1792057039146.jpg'
    },
    text: 'Alafu jibu linalofuata ni "Nilikuwa tu nataka kusikia sauti yako" saa saba usiku jamani! 🤦‍♀️🤣',
    timestamp: 'Saa 2 zilizopita',
    likes: 1204,
    isLiked: true
  }
];

export const INITIAL_COMMENTS: Record<string, Comment[]> = {
  '897cb5b0-9057-4b5e-b0d1-1c2ef034a17b': MEME_COMMENTS_1,
  '04263945-e8e7-4bf2-9dfb-2579a76aa67e': MEME_COMMENTS_2,
  '4be1bbc1-c54b-4bea-beef-1d714c22af1d': MEME_COMMENTS_3,
  '4d1c55c6-908c-4d85-a0ca-6b4951405ba9': MEME_COMMENTS_4,
  meme_01: MEME_COMMENTS_1,
  meme_02: MEME_COMMENTS_2,
  meme_03: MEME_COMMENTS_3,
  meme_04: MEME_COMMENTS_4,
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
