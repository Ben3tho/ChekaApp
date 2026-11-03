/**
 * =========================================================================
 * CHEKA RECOMMENDATION ENGINE v2 (AI WATCH-TIME & TASTE AFFINITY)
 * =========================================================================
 *
 * Formula Rasmi (v2):
 *   1. Completion Rate Signal (4.0×) - Muda uliotazamwa ukilinganishwa na urefu wa video
 *   2. Loop / Rewatch Bonus (3.0×) - Video ikitazamwa mara 2 au 3+
 *   3. High-Intent Signals: Saves/Shares (2.5×), Comments (1.5×), Likes (1.5×)
 *   4. Fast Skip Demotion (-3.0×) - Video ikirukwa chini ya sekunde 2
 *   5. Personalized Affinity Match (+30% hadi +100%) kulingana na Tags & Creators
 *   6. Exponential Time Decay: EXP(-age_seconds / 43200) (Half-life: 12h)
 *
 * =========================================================================
 */

export interface VideoSignalsData {
  id: string;
  durationSec: number;
  createdAt: Date | string;
  caption?: string;
  creatorId?: string;
  likesCount: number;
  commentsCount: number;
  savesCount: number;
  viewsCount: number;
  fastSkipsCount: number;
  totalWatchMs: number;
  avgWatchRatio?: number;
  avgLoops?: number;
}

export interface UserTasteProfile {
  userId?: string | null;
  totalWatchSec: number;
  completedVideosCount: number;
  avgCompletionRate: number;
  topTags: { tag: string; score: number; count: number }[];
  topCreators: { creatorId: string; username?: string; completionRate: number }[];
  skippedTags: string[];
  skippedCreators: string[];
}

export interface ScoreBreakdown {
  watchRatio: number;
  completionScore: number;
  loopScore: number;
  likesScore: number;
  sharesScore: number;
  commentsScore: number;
  fastSkipPenalty: number;
  baseViralScore: number;
  affinityMultiplier: number;
  matchedTags: string[];
  matchedReason?: string;
  hookBadge?: string;
  timeOfDayPeriod?: 'morning' | 'afternoon' | 'evening' | 'night';
  ageSeconds: number;
  decayFactor: number;
  finalScore: number;
}

export const RECOMMENDATION_CONFIG = {
  // Weights (Vigezo vya fomula v2)
  COMPLETION_RATE_WEIGHT: 4.0, // Watch duration is king
  LOOP_REWATCH_WEIGHT: 3.0,   // Rewatching a meme is the ultimate viral signal
  SHARES_WEIGHT: 2.5,         // Sending to friends / WhatsApp
  COMMENTS_WEIGHT: 1.5,       // Active discussion
  LIKES_WEIGHT: 1.5,          // Passive appreciation
  FAST_SKIP_PENALTY: 3.0,     // Swiping away immediately hurts score

  // Thresholds
  FAST_SKIP_MS: 2000,
  HEAVY_WATCH_MS: 5000,
  MIN_COMPLETION_FOR_AFFINITY: 0.70, // 70%+ watched counts as high interest

  // Personalization Boosts
  TAG_AFFINITY_BOOST_PER_MATCH: 0.25, // +25% per matched tag (up to +75%)
  CREATOR_AFFINITY_BOOST: 0.40,       // +40% if user loves this creator
  NEGATIVE_TAG_PENALTY: 0.50,         // -50% demotion if user skipped this tag before
  EXPLORATION_NOVELTY_RATIO: 0.15,    // 15% serendipitous discovery slots

  // Time decay half-life in seconds (43,200s = 12 hours)
  DECAY_WINDOW_SECONDS: 43200,

  // Hybrid feed distribution: 70% For You, 30% Following
  HYBRID_FOR_YOU_RATIO: 0.7,
  HYBRID_FOLLOWING_RATIO: 0.3,
};

/**
 * Returns time-of-day contextual comedy themes tailored for East Africa Time (EAT = UTC+3)
 */
export function getTimeOfDayContext(): {
  period: 'morning' | 'afternoon' | 'evening' | 'night';
  tagsBoosted: string[];
  bonus: number;
  badgeLabel: string;
} {
  const now = new Date();
  const eatHours = (now.getUTCHours() + 3) % 24;

  if (eatHours >= 5 && eatHours < 11) {
    return {
      period: 'morning',
      tagsBoosted: ['#daladala', '#kazi', '#ofisi', '#maisha', '#jumatatu', '#asubuhi'],
      bonus: 0.35,
      badgeLabel: '🌅 Kicheko cha Asubuhi & Daladala',
    };
  } else if (eatHours >= 11 && eatHours < 17) {
    return {
      period: 'afternoon',
      tagsBoosted: ['#mshahara', '#chakula', '#bongo', '#vunjambavu', '#mtaani', '#mchana'],
      bonus: 0.25,
      badgeLabel: '☀️ Vibe ya Mchana Mtaani',
    };
  } else if (eatHours >= 17 && eatHours < 22) {
    return {
      period: 'evening',
      tagsBoosted: ['#standup', '#cheka', '#vunjambavu', '#swahilimemes', '#furaha', '#jioni'],
      bonus: 0.30,
      badgeLabel: '🎭 Standup & Burudani ya Jioni',
    };
  } else {
    return {
      period: 'night',
      tagsBoosted: ['#usiku', '#standup', '#vunjambavu', '#cheka', '#mapenzi', '#usingizi'],
      bonus: 0.40,
      badgeLabel: '🌙 Kicheko cha Kitandani Kabla ya Kulala',
    };
  }
}

/**
 * Extracts hashtags (#Meme, #Bongo) and relevant comedy keywords from a caption string
 */
export function extractHashtags(caption?: string): string[] {
  if (!caption) return [];
  const tags = new Set<string>();
  
  // 1. Explicit hashtags
  const matches = caption.match(/#[a-zA-Z0-9_\u00C0-\u017F]+/g);
  if (matches) {
    matches.forEach(t => tags.add(t.toLowerCase()));
  }

  // 2. Keyword/Topic inference for Swahili & English comedy categories
  const lower = caption.toLowerCase();
  const keywordMap: Record<string, string> = {
    'daladala': '#daladala',
    'dereva': '#daladala',
    'paka': '#wanyama',
    'samaki': '#wanyama',
    'ofisi': '#kazi',
    'office': '#kazi',
    'mshahara': '#mshahara',
    'boss': '#kazi',
    'standup': '#standup',
    'mwalimu': '#standup',
    'comedy': '#vunjambavu',
    'cheka': '#cheka',
    'bongo': '#bongo',
    'swahili': '#swahilimemes',
    'simu': '#maisha',
    'rehearsal': '#standup',
    'meme': '#meme',
    'vunja': '#vunjambavu',
    'jumatatu': '#jumatatu',
    'asubuhi': '#asubuhi',
    'usiku': '#usiku',
    'mchana': '#mchana',
    'mapenzi': '#mapenzi',
    'chakula': '#chakula',
  };

  for (const [kw, tag] of Object.entries(keywordMap)) {
    if (lower.includes(kw)) {
      tags.add(tag);
    }
  }

  return Array.from(tags);
}

/**
 * Inakokotoa alama ya video (Global Viral Score + Personalized Affinity)
 */
export function calculateVideoScore(
  signals: VideoSignalsData,
  userProfile?: UserTasteProfile | null
): ScoreBreakdown {
  const durationSec = Math.max(1, signals.durationSec || 15);
  const views = Math.max(1, signals.viewsCount || 1);

  // 1. Completion ratio & Loop ratio
  let watchRatio = signals.avgWatchRatio;
  if (watchRatio === undefined) {
    const avgWatchMs = (signals.totalWatchMs || 0) / views;
    watchRatio = Math.max(0.05, avgWatchMs / (durationSec * 1000));
  }

  // Cap effective completion for base score calculation to 3.0 (up to 3 loops)
  const cappedWatchRatio = Math.min(3.0, watchRatio);
  const completionScore = Math.min(1.0, cappedWatchRatio) * RECOMMENDATION_CONFIG.COMPLETION_RATE_WEIGHT * 1000;
  
  // Loops score: if user stayed longer than 1.0 duration (rewatched the meme)
  const loops = signals.avgLoops !== undefined 
    ? signals.avgLoops 
    : Math.max(0, (signals.totalWatchMs || 0) / (durationSec * 1000) - 1.0);
  const loopScore = Math.min(3.0, loops) * RECOMMENDATION_CONFIG.LOOP_REWATCH_WEIGHT * 1000;

  const likesScore = signals.likesCount * RECOMMENDATION_CONFIG.LIKES_WEIGHT * 50;
  const sharesScore = signals.savesCount * RECOMMENDATION_CONFIG.SHARES_WEIGHT * 80;
  const commentsScore = signals.commentsCount * RECOMMENDATION_CONFIG.COMMENTS_WEIGHT * 60;
  const fastSkipPenalty = signals.fastSkipsCount * RECOMMENDATION_CONFIG.FAST_SKIP_PENALTY * 100;

  const baseViralScore = Math.max(
    10,
    completionScore + loopScore + likesScore + sharesScore + commentsScore - fastSkipPenalty
  );

  // 2. Personalized Taste Affinity Multiplier (Watch Time Based)
  const videoTags = extractHashtags(signals.caption);
  let affinityMultiplier = 1.0;
  const matchedTags: string[] = [];
  let matchedReason = '';

  if (userProfile) {
    // Watch Time Tag matching: Users who spend more watch time on these tags receive higher boost
    let tagBoost = 0;
    for (const tagObj of userProfile.topTags || []) {
      const normalizedUserTag = tagObj.tag.toLowerCase();
      if (videoTags.includes(normalizedUserTag)) {
        // Tag score is proportional to watch time ratio (higher watch time = higher boost)
        const weight = Math.min(1.5, Math.max(0.5, tagObj.score / 100));
        tagBoost += RECOMMENDATION_CONFIG.TAG_AFFINITY_BOOST_PER_MATCH * weight;
        matchedTags.push(tagObj.tag);
      }
    }
    // Max +100% boost from tags
    tagBoost = Math.min(1.0, tagBoost);
    affinityMultiplier += tagBoost;

    // Creator watch time matching: If user watched this creator with high completion rate
    if (signals.creatorId && userProfile.topCreators?.length) {
      const creatorMatch = userProfile.topCreators.find(c => c.creatorId === signals.creatorId);
      if (creatorMatch) {
        const creatorMultiplier = Math.min(1.5, Math.max(0.8, creatorMatch.completionRate || 1.0));
        affinityMultiplier += RECOMMENDATION_CONFIG.CREATOR_AFFINITY_BOOST * creatorMultiplier;
        if (!matchedReason) {
          matchedReason = creatorMatch.username 
            ? `Mchekeshaji unayemfuatilia na kutazama sana (@${creatorMatch.username})`
            : 'Mchekeshaji unayemtazama kwa muda mrefu';
        }
      }
    }

    // Negative penalty if user skips this tag consistently (< 2s)
    const hasNegativeTag = videoTags.some(t => userProfile.skippedTags?.includes(t.toLowerCase()));
    if (hasNegativeTag) {
      affinityMultiplier *= RECOMMENDATION_CONFIG.NEGATIVE_TAG_PENALTY;
    }

    if (matchedTags.length > 0 && !matchedReason) {
      matchedReason = `Kulingana na muda uliotazama maudhui ya ${matchedTags.slice(0, 2).join(' & ')}`;
    }
  }

  // 3. Time-Of-Day Contextual Relevance (EAT: UTC+3)
  const timeContext = getTimeOfDayContext();
  let timeOfDayBoost = 0;
  const isTimeMatched = videoTags.some(t => timeContext.tagsBoosted.includes(t.toLowerCase()));
  if (isTimeMatched) {
    timeOfDayBoost = timeContext.bonus;
    affinityMultiplier += timeOfDayBoost;
  }

  // 4. Hook Badge Generator (High-Dopamine Social Proof & Context)
  let hookBadge: string | undefined = undefined;
  if (loops >= 1.0) {
    hookBadge = '🔥 Watu 8.4k wamerudia kucheka mara 3+';
  } else if (watchRatio >= 1.2) {
    hookBadge = '⚡ Inayotazamwa Zaidi Tanzania';
  } else if (isTimeMatched) {
    hookBadge = timeContext.badgeLabel;
  } else if (matchedTags.length > 0) {
    hookBadge = `🎯 Kulingana na upendo wako wa ${matchedTags[0]}`;
  } else if (signals.likesCount > 5) {
    hookBadge = '👑 Chaguo Maarufu la Wachekeshaji';
  }

  // 5. Time Decay: EXP(-age_seconds / 43200) (Half-life ~12 hrs)
  const createdTime = new Date(signals.createdAt).getTime();
  const now = Date.now();
  const ageSeconds = Math.max(0, (now - createdTime) / 1000);
  const decayFactor = Math.exp(-ageSeconds / RECOMMENDATION_CONFIG.DECAY_WINDOW_SECONDS);

  const finalScore = Number((baseViralScore * affinityMultiplier * decayFactor).toFixed(2));

  return {
    watchRatio: Number(watchRatio.toFixed(2)),
    completionScore: Number(completionScore.toFixed(1)),
    loopScore: Number(loopScore.toFixed(1)),
    likesScore: Number(likesScore.toFixed(1)),
    sharesScore: Number(sharesScore.toFixed(1)),
    commentsScore: Number(commentsScore.toFixed(1)),
    fastSkipPenalty: Number(fastSkipPenalty.toFixed(1)),
    baseViralScore: Number(baseViralScore.toFixed(1)),
    affinityMultiplier: Number(affinityMultiplier.toFixed(2)),
    matchedTags,
    matchedReason: matchedReason || undefined,
    hookBadge,
    timeOfDayPeriod: timeContext.period,
    ageSeconds: Math.round(ageSeconds),
    decayFactor: Number(decayFactor.toFixed(4)),
    finalScore,
  };
}

/**
 * Inachanganya feed kwa uwiano wa 70% For You, 30% Following, na 15% Exploration Slots (Novelty Discovery)
 */
export function interleaveHybridFeed<T extends { id: string; scoreBreakdown?: ScoreBreakdown }>(
  forYouList: T[],
  followingList: T[],
  explorationCandidates: T[] = []
): T[] {
  const result: T[] = [];
  const seenIds = new Set<string>();

  let fyIdx = 0;
  let folIdx = 0;
  let expIdx = 0;

  while (fyIdx < forYouList.length || folIdx < followingList.length || expIdx < explorationCandidates.length) {
    // 1. Chukua hadi 5 kutoka For You
    for (let i = 0; i < 5 && fyIdx < forYouList.length; i++) {
      const item = forYouList[fyIdx++];
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        result.push(item);
      }
    }

    // 2. Chomeka Exploration Slot 1 (Ugunduzi Mpya kuzuia Filter Bubble)
    if (expIdx < explorationCandidates.length) {
      const expItem = explorationCandidates[expIdx++];
      if (!seenIds.has(expItem.id)) {
        seenIds.add(expItem.id);
        if (expItem.scoreBreakdown && !expItem.scoreBreakdown.hookBadge) {
          expItem.scoreBreakdown.hookBadge = '✨ Ugunduzi Mpya wa Bongo';
        }
        result.push(expItem);
      }
    }

    // 3. Chukua 2 kutoka Following
    for (let i = 0; i < 2 && folIdx < followingList.length; i++) {
      const item = followingList[folIdx++];
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        result.push(item);
      }
    }

    // 4. Ikiwa Following/Exploration zimeisha lakini For You bado ipo, malizia For You
    if (folIdx >= followingList.length && expIdx >= explorationCandidates.length && fyIdx < forYouList.length) {
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

const LOCAL_TASTE_KEY = 'cheka_taste_profile_v2';

export const DEFAULT_TASTE_PROFILE: UserTasteProfile = {
  totalWatchSec: 0,
  completedVideosCount: 0,
  avgCompletionRate: 0,
  topTags: [],
  topCreators: [],
  skippedTags: [],
  skippedCreators: [],
};

/**
 * Pata wasifu wa mapendeleo wa mtumiaji kutoka localStorage
 */
export function getLocalTasteProfile(): UserTasteProfile {
  if (typeof window === 'undefined') return DEFAULT_TASTE_PROFILE;
  try {
    const raw = localStorage.getItem(LOCAL_TASTE_KEY);
    if (!raw) return DEFAULT_TASTE_PROFILE;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_TASTE_PROFILE;
  }
}

/**
 * Rekodi watch time ya video moja na ubadilishe wasifu wa mtumiaji papo hapo (Client-side)
 */
export function recordLocalWatchTime(
  video: { id: string; caption?: string; duration?: number; creator?: { id: string; username?: string } },
  watchMs: number,
  loops: number = 0
): UserTasteProfile {
  const profile = getLocalTasteProfile();
  const watchSec = Math.round(watchMs / 1000);
  const durationSec = Math.max(1, video.duration || 15);
  const completionRatio = watchMs / (durationSec * 1000);
  const isFastSkip = watchMs < RECOMMENDATION_CONFIG.FAST_SKIP_MS;
  const isCompleted = completionRatio >= RECOMMENDATION_CONFIG.MIN_COMPLETION_FOR_AFFINITY;

  const tags = extractHashtags(video.caption);

  // Update totals
  profile.totalWatchSec = (profile.totalWatchSec || 0) + watchSec;
  if (isCompleted) {
    profile.completedVideosCount = (profile.completedVideosCount || 0) + 1;
  }

  // Calculate new average completion rate
  const prevComps = profile.avgCompletionRate || 0.8;
  profile.avgCompletionRate = Number(((prevComps * 0.8) + (completionRatio * 0.2)).toFixed(2));

  // If fast skip, add to negative affinity
  if (isFastSkip) {
    tags.forEach(t => {
      if (!profile.skippedTags) profile.skippedTags = [];
      if (!profile.skippedTags.includes(t)) {
        profile.skippedTags.push(t);
        if (profile.skippedTags.length > 20) profile.skippedTags.shift();
      }
    });
    if (video.creator?.id) {
      if (!profile.skippedCreators) profile.skippedCreators = [];
      if (!profile.skippedCreators.includes(video.creator.id)) {
        profile.skippedCreators.push(video.creator.id);
      }
    }
  } else if (watchSec >= 3) {
    // Positive watch time signal: boost tags
    if (!profile.topTags) profile.topTags = [];
    tags.forEach(tag => {
      const existing = profile.topTags.find(t => t.tag.toLowerCase() === tag.toLowerCase());
      // Score scales with watch duration & loop bonus
      const addedScore = Math.round((completionRatio * 20) + (loops * 30));
      if (existing) {
        existing.score += addedScore;
        existing.count += 1;
      } else {
        profile.topTags.push({ tag, score: addedScore, count: 1 });
      }

      // Remove from skippedTags if user watched it deeply now
      if (profile.skippedTags) {
        profile.skippedTags = profile.skippedTags.filter(st => st.toLowerCase() !== tag.toLowerCase());
      }
    });

    // Sort top tags by watch-time score
    profile.topTags.sort((a, b) => b.score - a.score);
    profile.topTags = profile.topTags.slice(0, 15);

    // Creator affinity
    if (video.creator?.id) {
      if (!profile.topCreators) profile.topCreators = [];
      const existingCreator = profile.topCreators.find(c => c.creatorId === video.creator?.id);
      if (existingCreator) {
        existingCreator.completionRate = Number(
          ((existingCreator.completionRate * 0.7) + (completionRatio * 0.3)).toFixed(2)
        );
      } else {
        profile.topCreators.push({
          creatorId: video.creator.id,
          username: video.creator.username,
          completionRate: Number(completionRatio.toFixed(2)),
        });
      }
      profile.topCreators.sort((a, b) => (b.completionRate || 0) - (a.completionRate || 0));
      profile.topCreators = profile.topCreators.slice(0, 10);
    }
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_TASTE_KEY, JSON.stringify(profile));
    } catch {
      // Ignore localStorage quotas
    }
  }

  return profile;
}

/**
 * Rejesha wasifu kuwa mpya kabisa
 */
export function resetLocalTasteProfile(): UserTasteProfile {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(LOCAL_TASTE_KEY);
    } catch {
      // Ignore
    }
  }
  return DEFAULT_TASTE_PROFILE;
}
