/**
 * =========================================================================
 * CHEKA RECOMMENDATION ENGINE v1 (DATA HALISI)
 * =========================================================================
 *
 * Formula Rasmi:
 *   score = (watch_ratio * 3.0) + (likes_count * 2.0) + (shares_count * 2.5) + (comments_count * 1.5) - (fast_skips * 2.0)
 *   fast_skip = view yenye watch_ms < 2000ms
 *   final = score * EXP(-EXTRACT(EPOCH FROM (NOW() - created_at)) / 43200) // decay 48h
 *
 * Hybrid Feed:
 *   70% For You algorithmic recommendations + 30% Following feed
 * =========================================================================
 */

export interface VideoSignalsData {
  id: string;
  durationSec: number;
  createdAt: Date | string;
  likesCount: number;
  commentsCount: number;
  savesCount: number; // Used for high-intent shares / saves
  viewsCount: number;
  fastSkipsCount: number;
  totalWatchMs: number;
  avgWatchRatio?: number;
}

export interface ScoreBreakdown {
  watchRatio: number;
  watchScore: number;
  likesScore: number;
  sharesScore: number;
  commentsScore: number;
  fastSkipPenalty: number;
  baseScore: number;
  ageSeconds: number;
  decayFactor: number;
  finalScore: number;
}

export const RECOMMENDATION_CONFIG = {
  // Weights (vigezo vya fomula)
  WATCH_RATIO_WEIGHT: 3.0,
  LIKES_WEIGHT: 2.0,
  SHARES_WEIGHT: 2.5,
  COMMENTS_WEIGHT: 1.5,
  FAST_SKIP_PENALTY: 2.0,

  // Thresholds
  FAST_SKIP_MS: 2000,
  HEAVY_WATCH_MS: 5000,
  CANDIDATE_POOL_DAYS: 7,

  // Time decay half-life in seconds (43,200s = 12 hours)
  DECAY_WINDOW_SECONDS: 43200,

  // Hybrid feed distribution: 70% For You, 30% Following
  HYBRID_FOR_YOU_RATIO: 0.7,
  HYBRID_FOLLOWING_RATIO: 0.3,
};

/**
 * Inakokotoa alama ya video kwa kutumia formula iliyobainishwa
 */
export function calculateVideoScore(signals: VideoSignalsData): ScoreBreakdown {
  const durationSec = Math.max(1, signals.durationSec || 15);
  const views = Math.max(1, signals.viewsCount || 1);

  // Watch ratio: Wastani wa muda uliotazamwa ukilinganishwa na urefu wa video (0.0 hadi 2.0)
  let watchRatio = signals.avgWatchRatio;
  if (watchRatio === undefined) {
    const avgWatchMs = (signals.totalWatchMs || 0) / views;
    watchRatio = Math.min(2.0, Math.max(0.1, avgWatchMs / (durationSec * 1000)));
  }

  const watchScore = watchRatio * RECOMMENDATION_CONFIG.WATCH_RATIO_WEIGHT;
  const likesScore = signals.likesCount * RECOMMENDATION_CONFIG.LIKES_WEIGHT;
  const sharesScore = signals.savesCount * RECOMMENDATION_CONFIG.SHARES_WEIGHT;
  const commentsScore = signals.commentsCount * RECOMMENDATION_CONFIG.COMMENTS_WEIGHT;
  const fastSkipPenalty = signals.fastSkipsCount * RECOMMENDATION_CONFIG.FAST_SKIP_PENALTY;

  const baseScore = Math.max(
    0.01,
    watchScore + likesScore + sharesScore + commentsScore - fastSkipPenalty
  );

  // Decay: EXP(-age_seconds / 43200)
  const createdTime = new Date(signals.createdAt).getTime();
  const now = Date.now();
  const ageSeconds = Math.max(0, (now - createdTime) / 1000);
  const decayFactor = Math.exp(-ageSeconds / RECOMMENDATION_CONFIG.DECAY_WINDOW_SECONDS);

  const finalScore = Number((baseScore * decayFactor).toFixed(4));

  return {
    watchRatio: Number(watchRatio.toFixed(3)),
    watchScore: Number(watchScore.toFixed(2)),
    likesScore: Number(likesScore.toFixed(2)),
    sharesScore: Number(sharesScore.toFixed(2)),
    commentsScore: Number(commentsScore.toFixed(2)),
    fastSkipPenalty: Number(fastSkipPenalty.toFixed(2)),
    baseScore: Number(baseScore.toFixed(2)),
    ageSeconds: Math.round(ageSeconds),
    decayFactor: Number(decayFactor.toFixed(4)),
    finalScore,
  };
}

/**
 * Inachanganya feed kwa uwiano wa 70% For You na 30% Following
 */
export function interleaveHybridFeed<T extends { id: string }>(
  forYouList: T[],
  followingList: T[]
): T[] {
  const result: T[] = [];
  const seenIds = new Set<string>();

  let fyIdx = 0;
  let folIdx = 0;

  while (fyIdx < forYouList.length || folIdx < followingList.length) {
    // Chukua 7 kutoka For You (70%)
    for (let i = 0; i < 7 && fyIdx < forYouList.length; i++) {
      const item = forYouList[fyIdx++];
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        result.push(item);
      }
    }

    // Chukua 3 kutoka Following (30%)
    for (let i = 0; i < 3 && folIdx < followingList.length; i++) {
      const item = followingList[folIdx++];
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        result.push(item);
      }
    }

    // Ikiwa Following imeisha lakini For You bado ipo, malizia For You
    if (folIdx >= followingList.length && fyIdx < forYouList.length) {
      while (fyIdx < forYouList.length) {
        const item = forYouList[fyIdx++];
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          result.push(item);
        }
      }
    }
  }

  return result;
}
