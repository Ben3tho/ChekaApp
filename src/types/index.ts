export type Language = 'sw' | 'en';

export interface Creator {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  verified: boolean;
  followersCount: number;
}

export interface SoundTrack {
  id: string;
  title: string;
  artist: string;
  durationSec: number;
  effectKey?: string;
}

export interface MemeSignals {
  watchRatio: number; // 0.0 to 1.5+ (rewatches)
  watchMs: number;
  likes: number;
  shares: number;
  comments: number;
  skips: number;
  ageHours: number;
}

export interface MemeVideo {
  id: string;
  title: string;
  caption: string;
  creator: Creator;
  mediaUrl: string; // Image or video loop
  mediaType: 'image' | 'video';
  duration: number; // in seconds (15 - 60)
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  savesCount: number;
  laughsCount: number;
  viewsCount: number;
  tags: string[];
  soundTrack: SoundTrack;
  topOverlayText?: string;
  bottomOverlayText?: string;
  createdAt: string;
  isLiked?: boolean;
  isSaved?: boolean;
  videoUid?: string;
  status?: 'processing' | 'ready' | 'failed' | 'READY';
  streamPlayback?: {
    hls: string;
    iframe: string;
    mp4?: string;
    thumbnail?: string;
  };
  isFollowed?: boolean;
  signals: MemeSignals;
  moderationStatus: 'APPROVED' | 'PENDING' | 'FLAGGED';
}

export interface Comment {
  id: string;
  videoId: string;
  parentId?: string | null;
  user: {
    id?: string;
    name: string;
    username: string;
    avatar: string;
  };
  text: string;
  timestamp: string;
  createdAt?: string;
  likes: number;
  isLiked?: boolean;
  repliesCount?: number;
  replies?: Comment[];
}

export interface GiftItem {
  id: string;
  name: string;
  swahiliName: string;
  icon: string;
  coinPrice: number;
  color: string;
}

export interface RoadmapTask {
  id: string;
  task: string;
  swahiliTask: string;
  completed: boolean;
  riskMitigation: string;
}

export interface RoadmapPhase {
  phase: string;
  weeks: string;
  title: string;
  swahiliTitle: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PLANNED';
  priority: 'LAZIMA' | 'MUHIMU' | 'BAADAYE';
  tasks: RoadmapTask[];
}

export interface DbColumn {
  name: string;
  type: string;
  constraints: string;
  description: string;
}

export interface DbTable {
  name: string;
  description: string;
  swahiliDescription: string;
  columns: DbColumn[];
  sampleRows: Record<string, any>[];
}
