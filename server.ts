import express, { Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, db } from './src/db/index.ts';
import { users, videos, likes, comments, saves, follows, views } from './src/db/schema.ts';
import { seedDatabaseIfEmpty } from './src/db/seed.ts';
import { eq, and, desc, sql } from 'drizzle-orm';
import authRouter from './src/auth/authRouter.ts';
import { verifyAccessToken } from './src/auth/tokens.ts';
import { authenticate, AuthenticatedRequest } from './src/middleware/authenticate.ts';
import { calculateVideoScore, interleaveHybridFeed, RECOMMENDATION_CONFIG } from './src/algorithms/recommendation.ts';
import multer from 'multer';
import fs from 'fs';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

dotenv.config({ override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure local uploads directory for direct-upload fallback receiver
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
const uploadStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`),
});
const uploadMiddleware = multer({
  storage: uploadStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Cloud Run is behind Google Load Balancer / reverse proxy
  app.set('trust proxy', 1);

  // Helmet for secure HTTP response headers
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS whitelist
  const allowedOrigins: (string | RegExp)[] = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://localhost:3000',
    /\.run\.app$/,
  ];
  if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
  }
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const isAllowed = allowedOrigins.some((allowed) => {
          if (typeof allowed === 'string') return origin === allowed;
          if (allowed instanceof RegExp) return allowed.test(origin);
          return false;
        });
        if (isAllowed) {
          callback(null, true);
        } else {
          callback(new Error(`Not allowed by CORS: ${origin}`));
        }
      },
      credentials: true,
    })
  );

  // Cloud Run Structured JSON logging for observability
  app.use((req: Request, res: Response, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const durationMs = Date.now() - start;
      if (req.path.startsWith('/api') || res.statusCode >= 400) {
        console.log(
          JSON.stringify({
            severity: res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARNING' : 'INFO',
            timestamp: new Date().toISOString(),
            method: req.method,
            path: req.originalUrl || req.url,
            status: res.statusCode,
            durationMs,
            ip: req.ip,
            userAgent: req.get('user-agent') || '',
          })
        );
      }
    });
    next();
  });

  // Rate Limiting: Global API limiter (100 req/min) & Auth Login limiter (5 req/5min)
  const globalLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests from this IP, please try again in a minute.' },
  });

  const loginLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 5, // 5 attempts per 5 minutes per IP
    standardHeaders: true,
    legacyHeaders: false,
    statusCode: 429,
    message: { error: 'Too many login attempts. Please try again after 5 minutes.' },
  });

  app.use('/api/', globalLimiter);
  app.use('/api/auth/login', loginLimiter);

  app.use(express.json({ limit: '10mb' }));
  app.use(cookieParser());
  app.use('/uploads', express.static(uploadsDir));

  // Seed database if empty on boot
  await seedDatabaseIfEmpty();

  // Mount Real Authentication Router:
  app.use('/api/auth', authRouter);

  // Helper to extract authenticated user if token present
  const getOptionalUserId = (req: Request): string | null => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1].trim();
      try {
        const payload = verifyAccessToken(token);
        return payload.id;
      } catch {
        return null;
      }
    }
    return null;
  };

  // Initialize Google GenAI
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

  // 1. Health check endpoint with real database probe (SELECT 1)
  // Acceptance criterion: returns 200 when DB is up, returns 503 if DB is down
  app.get('/api/health', async (_req: Request, res: Response) => {
    try {
      const result = await pool.query('SELECT 1 as ping');
      if (!result.rows || result.rows[0]?.ping !== 1) {
        throw new Error('Database ping query returned invalid result');
      }

      return res.status(200).json({
        status: 'ok',
        database: 'connected',
        engine: 'PostgreSQL 16 (Cloud SQL)',
        pool: {
          total: pool.totalCount,
          idle: pool.idleCount,
          waiting: pool.waitingCount,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('Health check DB probe failed:', err);
      return res.status(503).json({
        status: 'error',
        error: 'Database unavailable',
        details: err.message,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // ==========================================
  // HATUA 3: Cloudflare Stream Real Pipeline
  // ==========================================

  // 1. POST /api/videos/upload-url (Authenticated)
  // Generates Cloudflare Stream direct upload URL (max 61s)
  app.post('/api/videos/upload-url', authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const cfAccountId = (process.env.CF_ACCOUNT_ID || '').trim();
      let rawToken = (process.env.CF_API_TOKEN || '').trim();
      // Auto-extract token if user pasted curl command or Bearer prefix
      const tokenMatch = rawToken.match(/cfut_[a-zA-Z0-9_-]+/);
      const cfApiToken = tokenMatch ? tokenMatch[0] : rawToken.replace(/^Bearer\s+/i, '').replace(/["']/g, '').trim();

      const hasRealCf = Boolean(
        cfAccountId && 
        cfApiToken && 
        !cfAccountId.includes('your_cloudflare') && 
        !cfApiToken.includes('your_cloudflare')
      );

      if (hasRealCf) {
        // Official Cloudflare Stream Direct Upload endpoint
        const cfRes = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/stream/direct_upload`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${cfApiToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              maxDurationSeconds: 61,
              creator: req.user!.id,
              meta: {
                uploader: req.user!.username,
                source: 'cheka_mobile_web',
              },
            }),
          }
        );

        const data: any = await cfRes.json();
        if (cfRes.ok && data.success && data.result?.uploadURL) {
          return res.json({
            uploadURL: data.result.uploadURL,
            uid: data.result.uid,
            provider: 'cloudflare',
          });
        }

        console.warn('Cloudflare direct_upload response:', {
          status: cfRes.status,
          success: data.success,
          errors: data.errors,
          messages: data.messages,
        });

        // If Cloudflare returns quota exceeded (413), inform client with precise diagnostics
        if (cfRes.status === 413 || (data.errors && data.errors.some((e: any) => e.code === 10011))) {
          return res.status(413).json({
            provider: 'cloudflare',
            error: 'Cloudflare Stream Storage Quota Exceeded (0 minutes allocated)',
            details: data.errors?.[0]?.message || 'You have uploaded 0.00 minutes and are allocated 0 minutes.',
            cfTokenVerified: true,
            hint: 'Kwenye Cloudflare Dashboard, nenda Stream -> bonyeza "Subscribe to Stream" (mpango wa $5/mo kwa dakika 1000) ili kuwezesha nafasi ya kuweka video.'
          });
        }
      }

      // Local Direct Upload fallback receiver for development/testing when CF keys not yet set or invalid
      const fallbackUid = 'cf_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      const host = req.get('host') || 'localhost:3000';
      const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
      const uploadURL = `${protocol}://${host}/api/videos/direct-upload-fallback/${fallbackUid}`;

      return res.json({
        uploadURL,
        uid: fallbackUid,
        provider: 'local_fallback',
        notice: 'CF_ACCOUNT_ID and CF_API_TOKEN are not set; using local direct upload receiver.',
      });
    } catch (err: any) {
      console.error('Error generating Cloudflare upload URL:', err);
      return res.status(500).json({ error: 'Internal server error generating upload URL' });
    }
  });

  // Local fallback endpoint to accept direct video multipart upload
  app.post('/api/videos/direct-upload-fallback/:uid', uploadMiddleware.single('file'), (req: Request, res: Response) => {
    const uid = req.params.uid;
    const uploadedFile = req.file;
    return res.json({
      success: true,
      uid,
      message: 'Direct upload received successfully',
      file: uploadedFile ? `/uploads/${uploadedFile.filename}` : null,
    });
  });

  // 2. POST /api/videos (Authenticated)
  // Receives: { uid, caption, hashtags } -> inserts into Video table with status: "processing"
  app.post('/api/videos', authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { uid, caption, hashtags, thumbnailUrl } = req.body;
      if (!uid) {
        return res.status(400).json({ error: 'Video UID is required' });
      }

      const userId = req.user!.id;
      const cleanCaption = caption || 'Meme Mpya ya Cheka';
      const defaultThumbnail = thumbnailUrl || `https://videodelivery.net/${uid}/thumbnails/thumbnail.jpg`;

      const [newVideo] = await db
        .insert(videos)
        .values({
          userId,
          caption: cleanCaption,
          videoUid: uid,
          thumbnailUrl: defaultThumbnail,
          durationSec: 0,
          status: 'processing',
        })
        .returning();

      return res.status(201).json({
        ...newVideo,
        hashtags: Array.isArray(hashtags) ? hashtags : [],
        creator: {
          id: req.user!.id,
          username: req.user!.username,
          avatarUrl: req.user!.avatarUrl,
        },
        streamPlayback: {
          hls: `https://videodelivery.net/${uid}/manifest/video.m3u8`,
          iframe: `https://iframe.videodelivery.net/${uid}`,
          mp4: `https://videodelivery.net/${uid}/downloads/default.mp4`,
          thumbnail: defaultThumbnail,
        },
      });
    } catch (err: any) {
      console.error('Error inserting video into PostgreSQL:', err);
      return res.status(500).json({ error: 'Failed to create video record in database' });
    }
  });

  // 3. GET /api/videos/:id (Authenticated)
  // Webhook / Status check endpoint: Queries Cloudflare Stream status by uid
  // If state = "ready" -> updates DB status="ready", thumbnail_url, duration_sec
  // If state = "error" -> updates DB status="failed"
  app.get('/api/videos/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const videoId = req.params.id;

      const [video] = await db
        .select({
          id: videos.id,
          userId: videos.userId,
          caption: videos.caption,
          videoUid: videos.videoUid,
          thumbnailUrl: videos.thumbnailUrl,
          durationSec: videos.durationSec,
          status: videos.status,
          createdAt: videos.createdAt,
          creator: {
            id: users.id,
            username: users.username,
            avatarUrl: users.avatarUrl,
          },
        })
        .from(videos)
        .innerJoin(users, eq(videos.userId, users.id))
        .where(eq(videos.id, videoId))
        .limit(1);

      if (!video) {
        return res.status(404).json({ error: 'Video not found' });
      }

      // If status is 'processing', query Cloudflare Stream for updated state
      if (video.status === 'processing') {
        const cfAccountId = process.env.CF_ACCOUNT_ID;
        const cfApiToken = process.env.CF_API_TOKEN;
        const hasRealCf = Boolean(
          cfAccountId && 
          cfApiToken && 
          !cfAccountId.includes('your_cloudflare') && 
          !cfApiToken.includes('your_cloudflare')
        );

        if (hasRealCf) {
          try {
            const cfRes = await fetch(
              `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/stream/${video.videoUid}`,
              {
                headers: {
                  Authorization: `Bearer ${cfApiToken}`,
                },
              }
            );

            if (cfRes.ok) {
              const data: any = await cfRes.json();
              const state = data?.result?.status?.state; // 'ready', 'inprogress', 'error', 'queued'

              if (state === 'ready') {
                const cfDuration = Math.round(Number(data.result.duration) || 15);
                const cfThumb = data.result.thumbnail || `https://videodelivery.net/${video.videoUid}/thumbnails/thumbnail.jpg`;

                await db
                  .update(videos)
                  .set({
                    status: 'ready',
                    thumbnailUrl: cfThumb,
                    durationSec: cfDuration,
                  })
                  .where(eq(videos.id, video.id));

                video.status = 'ready';
                video.thumbnailUrl = cfThumb;
                video.durationSec = cfDuration;
              } else if (state === 'error') {
                await db
                  .update(videos)
                  .set({ status: 'failed' })
                  .where(eq(videos.id, video.id));

                video.status = 'failed';
              }
            }
          } catch (cfErr) {
            console.error('Error querying Cloudflare Stream status:', cfErr);
          }
        } else {
          // Dev fallback: transition status to ready
          await db
            .update(videos)
            .set({
              status: 'ready',
              durationSec: 15,
            })
            .where(eq(videos.id, video.id));

          video.status = 'ready';
          video.durationSec = 15;
        }
      }

      return res.json({
        ...video,
        streamPlayback: {
          hls: `https://videodelivery.net/${video.videoUid}/manifest/video.m3u8`,
          iframe: `https://iframe.videodelivery.net/${video.videoUid}`,
          mp4: `https://videodelivery.net/${video.videoUid}/downloads/default.mp4`,
          thumbnail: video.thumbnailUrl,
        },
      });
    } catch (err: any) {
      console.error('Error fetching video by ID:', err);
      return res.status(500).json({ error: 'Failed to retrieve video status' });
    }
  });

  // ==========================================
  // HATUA 5: Real Database Feed with Cursor Pagination (No OFFSET)
  // ==========================================
  app.get('/api/feed', async (req: Request, res: Response) => {
    try {
      const currentUserId = getOptionalUserId(req);
      const limit = Math.min(Number(req.query.limit) || 10, 50);
      const cursor = req.query.cursor ? new Date(req.query.cursor as string) : null;
      const filter = (req.query.filter as string) || 'latest';

      // Route 'foryou' filter to the real recommendation engine
      if (filter === 'foryou') {
        return handleForYouFeed(req, res);
      }

      const conditions: any[] = [];
      if (cursor && !isNaN(cursor.getTime())) {
        conditions.push(sql`${videos.createdAt} < ${cursor}`);
      }

      // Ready videos only (or user's own processing videos if authenticated)
      if (currentUserId) {
        conditions.push(sql`(${videos.status} IN ('READY', 'ready') OR ${videos.userId} = ${currentUserId})`);
      } else {
        conditions.push(sql`${videos.status} IN ('READY', 'ready')`);
      }

      // Following filter
      if (filter === 'following') {
        if (!currentUserId) {
          return res.json({ videos: [], nextCursor: null, next_cursor: null, hasMore: false, has_more: false });
        }
        conditions.push(
          sql`EXISTS (SELECT 1 FROM follows f WHERE f.followee_id = ${videos.userId} AND f.follower_id = ${currentUserId})`
        );
      }

      // Query indexed by created_at DESC with limit + 1
      const allVideos = await db
        .select({
          id: videos.id,
          caption: videos.caption,
          videoUid: videos.videoUid,
          thumbnailUrl: videos.thumbnailUrl,
          durationSec: videos.durationSec,
          status: videos.status,
          createdAt: videos.createdAt,
          creator: {
            id: users.id,
            username: users.username,
            avatarUrl: users.avatarUrl,
          },
          likesCount: sql<number>`(SELECT count(*) FROM likes WHERE likes.video_id = ${videos.id})::int`,
          commentsCount: sql<number>`(SELECT count(*) FROM comments WHERE comments.video_id = ${videos.id})::int`,
          savesCount: sql<number>`(SELECT count(*) FROM saves WHERE saves.video_id = ${videos.id})::int`,
          viewsCount: sql<number>`(SELECT count(*) FROM views WHERE views.video_id = ${videos.id})::int`,
          liked_by_me: currentUserId
            ? sql<boolean>`EXISTS (SELECT 1 FROM likes WHERE likes.video_id = ${videos.id} AND likes.user_id = ${currentUserId})`
            : sql<boolean>`false`,
          saved_by_me: currentUserId
            ? sql<boolean>`EXISTS (SELECT 1 FROM saves WHERE saves.video_id = ${videos.id} AND saves.user_id = ${currentUserId})`
            : sql<boolean>`false`,
        })
        .from(videos)
        .innerJoin(users, eq(videos.userId, users.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(
          filter === 'trending'
            ? desc(sql`((SELECT count(*) FROM views WHERE views.video_id = ${videos.id}) + (SELECT count(*) FROM likes WHERE likes.video_id = ${videos.id}) * 5)`)
            : desc(videos.createdAt)
        )
        .limit(limit + 1);

      const hasMore = allVideos.length > limit;
      const results = hasMore ? allVideos.slice(0, limit) : allVideos;
      const nextCursor = hasMore ? allVideos[limit].createdAt.toISOString() : null;

      const formatted = results.map(v => ({
        ...v,
        liked_by_me: currentUserId ? Boolean(v.liked_by_me) : false,
        saved_by_me: currentUserId ? Boolean(v.saved_by_me) : false,
        isLiked: currentUserId ? Boolean(v.liked_by_me) : false,
        isSaved: currentUserId ? Boolean(v.saved_by_me) : false,
        likes_count: Number(v.likesCount) || 0,
        comments_count: Number(v.commentsCount) || 0,
        saves_count: Number(v.savesCount) || 0,
        views_count: Number(v.viewsCount) || 0,
        likesCount: Number(v.likesCount) || 0,
        commentsCount: Number(v.commentsCount) || 0,
        savesCount: Number(v.savesCount) || 0,
        viewsCount: Number(v.viewsCount) || 0,
        streamPlayback: {
          hls: `https://videodelivery.net/${v.videoUid}/manifest/video.m3u8`,
          iframe: `https://iframe.videodelivery.net/${v.videoUid}`,
          mp4: `https://videodelivery.net/${v.videoUid}/downloads/default.mp4`,
          thumbnail: v.thumbnailUrl || `https://videodelivery.net/${v.videoUid}/thumbnails/thumbnail.jpg`,
        },
      }));

      return res.json({
        videos: formatted,
        nextCursor,
        next_cursor: nextCursor,
        hasMore,
        has_more: hasMore,
      });
    } catch (err: any) {
      console.error('Error fetching feed from PostgreSQL:', err);
      return res.status(500).json({ error: 'Failed to query video feed' });
    }
  });

  // ==========================================
  // HATUA 6: For You Feed v1 (Data Halisi + Formula + Hybrid 70/30)
  // ==========================================
  const handleForYouFeed = async (req: Request, res: Response) => {
    try {
      const currentUserId = getOptionalUserId(req);
      const limit = Math.min(Number(req.query.limit) || 10, 50);

      // Candidate pool conditions:
      // Status ready
      const conditions: any[] = [
        sql`${videos.status} IN ('READY', 'ready')`,
      ];

      // Exclusions for authenticated user:
      if (currentUserId) {
        // 1. Exclude own videos (isipokuwa kwenye profile)
        conditions.push(sql`${videos.userId} != ${currentUserId}`);

        // 2. Exclude videos user has skipped fast (watch_ms < 2000)
        conditions.push(
          sql`NOT EXISTS (
            SELECT 1 FROM views vw 
            WHERE vw.video_id = ${videos.id} 
              AND vw.user_id = ${currentUserId} 
              AND vw.watch_ms < 2000
          )`
        );

        // 3. Exclude videos heavily watched by user (watch_ms > 5000)
        conditions.push(
          sql`NOT EXISTS (
            SELECT 1 FROM views vw 
            WHERE vw.video_id = ${videos.id} 
              AND vw.user_id = ${currentUserId} 
              AND vw.watch_ms > 5000
          )`
        );
      }

      // Query candidate pool
      const candidates = await db
        .select({
          id: videos.id,
          caption: videos.caption,
          videoUid: videos.videoUid,
          thumbnailUrl: videos.thumbnailUrl,
          durationSec: videos.durationSec,
          status: videos.status,
          createdAt: videos.createdAt,
          creator: {
            id: users.id,
            username: users.username,
            avatarUrl: users.avatarUrl,
          },
          likesCount: sql<number>`(SELECT count(*) FROM likes WHERE likes.video_id = ${videos.id})::int`,
          commentsCount: sql<number>`(SELECT count(*) FROM comments WHERE comments.video_id = ${videos.id})::int`,
          savesCount: sql<number>`(SELECT count(*) FROM saves WHERE saves.video_id = ${videos.id})::int`,
          viewsCount: sql<number>`(SELECT count(*) FROM views WHERE views.video_id = ${videos.id})::int`,
          fastSkipsCount: sql<number>`(SELECT count(*) FROM views WHERE views.video_id = ${videos.id} AND views.watch_ms < 2000)::int`,
          totalWatchMs: sql<number>`COALESCE((SELECT sum(watch_ms) FROM views WHERE views.video_id = ${videos.id}), 0)::int`,
          liked_by_me: currentUserId
            ? sql<boolean>`EXISTS (SELECT 1 FROM likes WHERE likes.video_id = ${videos.id} AND likes.user_id = ${currentUserId})`
            : sql<boolean>`false`,
          saved_by_me: currentUserId
            ? sql<boolean>`EXISTS (SELECT 1 FROM saves WHERE saves.video_id = ${videos.id} AND saves.user_id = ${currentUserId})`
            : sql<boolean>`false`,
        })
        .from(videos)
        .innerJoin(users, eq(videos.userId, users.id))
        .where(and(...conditions))
        .limit(50); // Candidate pool

      // Fallback: If exclusions leave fewer than 5 candidates, fetch ready videos gracefully
      let finalCandidates = candidates;
      if (finalCandidates.length < 5) {
        const fallbackCandidates = await db
          .select({
            id: videos.id,
            caption: videos.caption,
            videoUid: videos.videoUid,
            thumbnailUrl: videos.thumbnailUrl,
            durationSec: videos.durationSec,
            status: videos.status,
            createdAt: videos.createdAt,
            creator: {
              id: users.id,
              username: users.username,
              avatarUrl: users.avatarUrl,
            },
            likesCount: sql<number>`(SELECT count(*) FROM likes WHERE likes.video_id = ${videos.id})::int`,
            commentsCount: sql<number>`(SELECT count(*) FROM comments WHERE comments.video_id = ${videos.id})::int`,
            savesCount: sql<number>`(SELECT count(*) FROM saves WHERE saves.video_id = ${videos.id})::int`,
            viewsCount: sql<number>`(SELECT count(*) FROM views WHERE views.video_id = ${videos.id})::int`,
            fastSkipsCount: sql<number>`(SELECT count(*) FROM views WHERE views.video_id = ${videos.id} AND views.watch_ms < 2000)::int`,
            totalWatchMs: sql<number>`COALESCE((SELECT sum(watch_ms) FROM views WHERE views.video_id = ${videos.id}), 0)::int`,
            liked_by_me: currentUserId
              ? sql<boolean>`EXISTS (SELECT 1 FROM likes WHERE likes.video_id = ${videos.id} AND likes.user_id = ${currentUserId})`
              : sql<boolean>`false`,
            saved_by_me: currentUserId
              ? sql<boolean>`EXISTS (SELECT 1 FROM saves WHERE saves.video_id = ${videos.id} AND saves.user_id = ${currentUserId})`
              : sql<boolean>`false`,
          })
          .from(videos)
          .innerJoin(users, eq(videos.userId, users.id))
          .where(sql`${videos.status} IN ('READY', 'ready')`)
          .limit(20);
        finalCandidates = fallbackCandidates;
      }

      // Calculate transparent formula score for each candidate
      const scoredList = finalCandidates.map(c => {
        const scoreData = calculateVideoScore({
          id: c.id,
          durationSec: c.durationSec,
          createdAt: c.createdAt,
          likesCount: c.likesCount,
          commentsCount: c.commentsCount,
          savesCount: c.savesCount,
          viewsCount: c.viewsCount,
          fastSkipsCount: c.fastSkipsCount,
          totalWatchMs: c.totalWatchMs,
        });

        return {
          ...c,
          recommendationScore: scoreData.finalScore,
          scoreBreakdown: scoreData,
          streamPlayback: {
            hls: `https://videodelivery.net/${c.videoUid}/manifest/video.m3u8`,
            iframe: `https://iframe.videodelivery.net/${c.videoUid}`,
            mp4: `https://videodelivery.net/${c.videoUid}/downloads/default.mp4`,
            thumbnail: c.thumbnailUrl || `https://videodelivery.net/${c.videoUid}/thumbnails/thumbnail.jpg`,
          },
        };
      });

      // Sort candidates by finalScore DESC
      scoredList.sort((a, b) => b.recommendationScore - a.recommendationScore);

      // Hybrid feed (70% For You + 30% Following)
      let combinedFeed = scoredList;
      if (currentUserId) {
        const followingVideos = await db
          .select({
            id: videos.id,
            caption: videos.caption,
            videoUid: videos.videoUid,
            thumbnailUrl: videos.thumbnailUrl,
            durationSec: videos.durationSec,
            status: videos.status,
            createdAt: videos.createdAt,
            creator: {
              id: users.id,
              username: users.username,
              avatarUrl: users.avatarUrl,
            },
            likesCount: sql<number>`(SELECT count(*) FROM likes WHERE likes.video_id = ${videos.id})::int`,
            commentsCount: sql<number>`(SELECT count(*) FROM comments WHERE comments.video_id = ${videos.id})::int`,
            savesCount: sql<number>`(SELECT count(*) FROM saves WHERE saves.video_id = ${videos.id})::int`,
            viewsCount: sql<number>`(SELECT count(*) FROM views WHERE views.video_id = ${videos.id})::int`,
            liked_by_me: sql<boolean>`EXISTS (SELECT 1 FROM likes WHERE likes.video_id = ${videos.id} AND likes.user_id = ${currentUserId})`,
            saved_by_me: sql<boolean>`EXISTS (SELECT 1 FROM saves WHERE saves.video_id = ${videos.id} AND saves.user_id = ${currentUserId})`,
          })
          .from(videos)
          .innerJoin(users, eq(videos.userId, users.id))
          .innerJoin(follows, eq(follows.followeeId, videos.userId))
          .where(
            and(
              eq(follows.followerId, currentUserId),
              sql`${videos.status} IN ('READY', 'ready')`
            )
          )
          .orderBy(desc(videos.createdAt))
          .limit(10);

        if (followingVideos.length > 0) {
          const formattedFollowing = followingVideos.map(fv => ({
            ...fv,
            fastSkipsCount: 0,
            totalWatchMs: 0,
            recommendationScore: 9999,
            scoreBreakdown: {
              watchRatio: 1,
              watchScore: 3,
              likesScore: 2,
              sharesScore: 2,
              commentsScore: 1,
              fastSkipPenalty: 0,
              baseScore: 10,
              ageSeconds: 0,
              decayFactor: 1,
              finalScore: 9999,
            },
            streamPlayback: {
              hls: `https://videodelivery.net/${fv.videoUid}/manifest/video.m3u8`,
              iframe: `https://iframe.videodelivery.net/${fv.videoUid}`,
              mp4: `https://videodelivery.net/${fv.videoUid}/downloads/default.mp4`,
              thumbnail: fv.thumbnailUrl || `https://videodelivery.net/${fv.videoUid}/thumbnails/thumbnail.jpg`,
            },
          }));

          combinedFeed = interleaveHybridFeed(scoredList, formattedFollowing);
        }
      }

      const paginated = combinedFeed.slice(0, limit);
      const hasMore = combinedFeed.length > limit;
      const nextCursor = paginated.length > 0 ? paginated[paginated.length - 1].createdAt.toISOString() : null;

      const formatted = paginated.map(v => ({
        ...v,
        liked_by_me: currentUserId ? Boolean(v.liked_by_me) : false,
        saved_by_me: currentUserId ? Boolean(v.saved_by_me) : false,
        isLiked: currentUserId ? Boolean(v.liked_by_me) : false,
        isSaved: currentUserId ? Boolean(v.saved_by_me) : false,
        likes_count: Number(v.likesCount) || 0,
        comments_count: Number(v.commentsCount) || 0,
        saves_count: Number(v.savesCount) || 0,
        views_count: Number(v.viewsCount) || 0,
        likesCount: Number(v.likesCount) || 0,
        commentsCount: Number(v.commentsCount) || 0,
        savesCount: Number(v.savesCount) || 0,
        viewsCount: Number(v.viewsCount) || 0,
      }));

      return res.json({
        videos: formatted,
        nextCursor,
        next_cursor: nextCursor,
        hasMore,
        has_more: hasMore,
        algorithm: 'cheka_v1_decay_hybrid',
        weights: RECOMMENDATION_CONFIG,
      });
    } catch (err: any) {
      console.error('Error in For You feed calculation:', err);
      return res.status(500).json({ error: 'Failed to compute For You feed' });
    }
  };

  app.get('/api/for-you', handleForYouFeed);


  // 5. GET /api/videos (All videos list)
  app.get('/api/videos', async (req: Request, res: Response) => {
    try {
      const currentUserId = getOptionalUserId(req);

      const allVideos = await db
        .select({
          id: videos.id,
          caption: videos.caption,
          videoUid: videos.videoUid,
          thumbnailUrl: videos.thumbnailUrl,
          durationSec: videos.durationSec,
          status: videos.status,
          createdAt: videos.createdAt,
          creator: {
            id: users.id,
            username: users.username,
            avatarUrl: users.avatarUrl,
          },
          likesCount: sql<number>`(SELECT count(*) FROM likes WHERE likes.video_id = ${videos.id})::int`,
          commentsCount: sql<number>`(SELECT count(*) FROM comments WHERE comments.video_id = ${videos.id})::int`,
          savesCount: sql<number>`(SELECT count(*) FROM saves WHERE saves.video_id = ${videos.id})::int`,
          viewsCount: sql<number>`(SELECT count(*) FROM views WHERE views.video_id = ${videos.id})::int`,
          isLiked: currentUserId
            ? sql<boolean>`EXISTS (SELECT 1 FROM likes WHERE likes.video_id = ${videos.id} AND likes.user_id = ${currentUserId})`
            : sql<boolean>`false`,
          isSaved: currentUserId
            ? sql<boolean>`EXISTS (SELECT 1 FROM saves WHERE saves.video_id = ${videos.id} AND saves.user_id = ${currentUserId})`
            : sql<boolean>`false`,
        })
        .from(videos)
        .innerJoin(users, eq(videos.userId, users.id))
        .orderBy(desc(videos.createdAt));

      const formatted = allVideos.map(v => ({
        ...v,
        liked_by_me: currentUserId ? Boolean(v.isLiked) : false,
        saved_by_me: currentUserId ? Boolean(v.isSaved) : false,
        isLiked: currentUserId ? Boolean(v.isLiked) : false,
        isSaved: currentUserId ? Boolean(v.isSaved) : false,
        likes_count: Number(v.likesCount) || 0,
        comments_count: Number(v.commentsCount) || 0,
        saves_count: Number(v.savesCount) || 0,
        views_count: Number(v.viewsCount) || 0,
        likesCount: Number(v.likesCount) || 0,
        commentsCount: Number(v.commentsCount) || 0,
        savesCount: Number(v.savesCount) || 0,
        viewsCount: Number(v.viewsCount) || 0,
        streamPlayback: {
          hls: `https://videodelivery.net/${v.videoUid}/manifest/video.m3u8`,
          iframe: `https://iframe.videodelivery.net/${v.videoUid}`,
          mp4: `https://videodelivery.net/${v.videoUid}/downloads/default.mp4`,
          thumbnail: v.thumbnailUrl,
        },
      }));

      return res.json(formatted);
    } catch (err: any) {
      console.error('Error fetching videos from PostgreSQL:', err);
      return res.status(500).json({ error: 'Failed to query videos table' });
    }
  });

  // ==========================================
  // HATUA 4: Real Database Engagement Endpoints
  // ==========================================

  // 1. POST /api/videos/:id/like (Authenticated, Idempotent)
  // INSERT ... ON CONFLICT DO NOTHING (Hitting 10 times = 1 like only)
  app.post('/api/videos/:id/like', authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const videoId = req.params.id;
      const userId = req.user!.id;

      // Verify video exists
      const [existingVideo] = await db
        .select({ id: videos.id })
        .from(videos)
        .where(eq(videos.id, videoId))
        .limit(1);

      if (!existingVideo) {
        return res.status(404).json({ error: 'Video not found' });
      }

      // Idempotent insertion
      await db
        .insert(likes)
        .values({ userId, videoId })
        .onConflictDoNothing();

      const [countResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(likes)
        .where(eq(likes.videoId, videoId));

      const likesCount = countResult?.count || 0;

      return res.json({
        success: true,
        liked: true,
        liked_by_me: true,
        likes_count: likesCount,
        likesCount,
      });
    } catch (err: any) {
      console.error('Error recording like in PostgreSQL:', err);
      return res.status(500).json({ error: 'Database like insert failed' });
    }
  });

  // 2. DELETE /api/videos/:id/like (Authenticated, Unlike)
  app.delete('/api/videos/:id/like', authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const videoId = req.params.id;
      const userId = req.user!.id;

      await db
        .delete(likes)
        .where(and(eq(likes.userId, userId), eq(likes.videoId, videoId)));

      const [countResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(likes)
        .where(eq(likes.videoId, videoId));

      const likesCount = countResult?.count || 0;

      return res.json({
        success: true,
        liked: false,
        liked_by_me: false,
        likes_count: likesCount,
        likesCount,
      });
    } catch (err: any) {
      console.error('Error removing like from PostgreSQL:', err);
      return res.status(500).json({ error: 'Database unlike operation failed' });
    }
  });

  // 3. POST /api/videos/:id/save (Authenticated, Idempotent Save)
  app.post('/api/videos/:id/save', authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const videoId = req.params.id;
      const userId = req.user!.id;

      const [existingVideo] = await db
        .select({ id: videos.id })
        .from(videos)
        .where(eq(videos.id, videoId))
        .limit(1);

      if (!existingVideo) {
        return res.status(404).json({ error: 'Video not found' });
      }

      await db
        .insert(saves)
        .values({ userId, videoId })
        .onConflictDoNothing();

      const [countResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(saves)
        .where(eq(saves.videoId, videoId));

      const savesCount = countResult?.count || 0;

      return res.json({
        success: true,
        saved: true,
        saved_by_me: true,
        saves_count: savesCount,
        savesCount,
      });
    } catch (err: any) {
      console.error('Error saving video in PostgreSQL:', err);
      return res.status(500).json({ error: 'Database save operation failed' });
    }
  });

  // 4. DELETE /api/videos/:id/save (Authenticated, Unsave)
  app.delete('/api/videos/:id/save', authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const videoId = req.params.id;
      const userId = req.user!.id;

      await db
        .delete(saves)
        .where(and(eq(saves.userId, userId), eq(saves.videoId, videoId)));

      const [countResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(saves)
        .where(eq(saves.videoId, videoId));

      const savesCount = countResult?.count || 0;

      return res.json({
        success: true,
        saved: false,
        saved_by_me: false,
        saves_count: savesCount,
        savesCount,
      });
    } catch (err: any) {
      console.error('Error unsaving video from PostgreSQL:', err);
      return res.status(500).json({ error: 'Database unsave operation failed' });
    }
  });

  // 5. POST /api/videos/:id/comments (Authenticated)
  // Nested replies level 1 tu (parent_id can be null or top-level comment of this video)
  app.post('/api/videos/:id/comments', authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const videoId = req.params.id;
      const userId = req.user!.id;
      const rawText = req.body?.text;
      const parentId = req.body?.parent_id || req.body?.parentId || null;

      if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
        return res.status(400).json({ error: 'Comment text cannot be empty' });
      }
      const cleanText = rawText.trim();

      // Verify video exists
      const [existingVideo] = await db
        .select({ id: videos.id })
        .from(videos)
        .where(eq(videos.id, videoId))
        .limit(1);

      if (!existingVideo) {
        return res.status(404).json({ error: 'Video not found' });
      }

      let verifiedParentId: string | null = null;
      if (parentId) {
        const [parentComment] = await db
          .select({
            id: comments.id,
            videoId: comments.videoId,
            parentId: comments.parentId,
          })
          .from(comments)
          .where(eq(comments.id, parentId))
          .limit(1);

        if (!parentComment) {
          return res.status(404).json({ error: 'Parent comment not found' });
        }

        if (parentComment.videoId !== videoId) {
          return res.status(400).json({ error: 'Parent comment does not belong to this video' });
        }

        // Strict Level 1 check: Parent must not itself be a reply
        if (parentComment.parentId !== null) {
          return res.status(400).json({
            error: 'Nested replies cannot exceed level 1. You cannot reply to a reply.',
          });
        }

        verifiedParentId = parentComment.id;
      }

      const [newComment] = await db
        .insert(comments)
        .values({
          videoId,
          userId,
          text: cleanText,
          parentId: verifiedParentId,
        })
        .returning();

      const [countResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(comments)
        .where(eq(comments.videoId, videoId));

      const commentsCount = countResult?.count || 1;

      return res.status(201).json({
        id: newComment.id,
        videoId: newComment.videoId,
        parentId: newComment.parentId,
        text: newComment.text,
        createdAt: newComment.createdAt.toISOString(),
        timestamp: 'Sasa hivi',
        likes: 0,
        isLiked: false,
        repliesCount: 0,
        user: {
          id: req.user!.id,
          name: `@${req.user!.username}`,
          username: req.user!.username,
          avatar: req.user!.avatarUrl || '/src/assets/images/swahili_comedian_avatar_1792057038016.jpg',
        },
        comments_count: commentsCount,
        commentsCount,
      });
    } catch (err: any) {
      console.error('Error inserting comment into PostgreSQL:', err);
      return res.status(500).json({ error: 'Database comment insert failed' });
    }
  });

  // 6. GET /api/videos/:id/comments?cursor=... (Pagination of 20 per page)
  // By default returns TOP-LEVEL comments (where parent_id IS NULL)
  // Replies can be queried by ?parent_id=...
  app.get('/api/videos/:id/comments', async (req: Request, res: Response) => {
    try {
      const videoId = req.params.id;
      const limit = Math.min(Number(req.query.limit) || 20, 50);
      const cursor = req.query.cursor ? new Date(req.query.cursor as string) : null;
      const requestedParentId = req.query.parent_id || req.query.parentId;

      const conditions: any[] = [eq(comments.videoId, videoId)];

      if (cursor && !isNaN(cursor.getTime())) {
        conditions.push(sql`${comments.createdAt} < ${cursor}`);
      }

      if (requestedParentId) {
        // Query level-1 replies for this specific parent comment
        conditions.push(eq(comments.parentId, String(requestedParentId)));
      } else {
        // Top-level comments only (replies filtered out of page 1)
        conditions.push(sql`${comments.parentId} IS NULL`);
      }

      const commentList = await db
        .select({
          id: comments.id,
          videoId: comments.videoId,
          text: comments.text,
          parentId: comments.parentId,
          createdAt: comments.createdAt,
          user: {
            id: users.id,
            username: users.username,
            avatarUrl: users.avatarUrl,
          },
          repliesCount: sql<number>`(SELECT count(*) FROM comments r WHERE r.parent_id = ${comments.id})::int`,
        })
        .from(comments)
        .innerJoin(users, eq(comments.userId, users.id))
        .where(and(...conditions))
        .orderBy(desc(comments.createdAt))
        .limit(limit + 1);

      const hasMore = commentList.length > limit;
      const items = hasMore ? commentList.slice(0, limit) : commentList;
      const nextCursor = items.length > 0 ? items[items.length - 1].createdAt.toISOString() : null;

      const [totalRes] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(comments)
        .where(eq(comments.videoId, videoId));

      const formatted = items.map(c => ({
        id: c.id,
        videoId: c.videoId,
        parentId: c.parentId,
        text: c.text,
        createdAt: c.createdAt.toISOString(),
        timestamp: new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        likes: 0,
        isLiked: false,
        repliesCount: Number(c.repliesCount) || 0,
        user: {
          id: c.user.id,
          name: `@${c.user.username}`,
          username: c.user.username,
          avatar: c.user.avatarUrl || '/src/assets/images/swahili_comedian_avatar_1792057038016.jpg',
        },
      }));

      return res.json({
        comments: formatted,
        nextCursor,
        hasMore,
        totalCount: totalRes?.count || 0,
        total_count: totalRes?.count || 0,
      });
    } catch (err: any) {
      console.error('Error querying comments from PostgreSQL:', err);
      return res.status(500).json({ error: 'Database comments query failed' });
    }
  });

  // 7. POST /api/videos/:id/view (Watch duration signal with 1-minute duplicate prevention)
  const viewWindowCache = new Map<string, number>();

  // Sweep cache every 5 minutes
  setInterval(() => {
    const cutoff = Date.now() - 120_000;
    for (const [key, timestamp] of viewWindowCache.entries()) {
      if (timestamp < cutoff) viewWindowCache.delete(key);
    }
  }, 5 * 60 * 1000);

  const handleRecordView = async (req: Request, res: Response) => {
    try {
      const videoId = req.params.id || req.body?.videoId;
      if (!videoId) {
        return res.status(400).json({ error: 'videoId is required' });
      }

      const userId = getOptionalUserId(req);
      const clientIp = req.ip || req.socket.remoteAddress || 'unknown_ip';
      const watchMs = Math.max(1, Math.min(Number(req.body?.watch_ms || req.body?.watchMs) || 15000, 300000));
      const now = Date.now();

      const viewKey = userId ? `user:${userId}:${videoId}` : `ip:${clientIp}:${videoId}`;
      const lastView = viewWindowCache.get(viewKey);

      // Check in-memory 1-minute window
      if (lastView && now - lastView < 60_000) {
        return res.json({
          recorded: false,
          rateLimited: true,
          reason: 'View already recorded within 1-minute window',
        });
      }

      // Check PostgreSQL for authenticated user within the last 1 minute
      if (userId) {
        const recentDbView = await db
          .select({ id: views.id })
          .from(views)
          .where(
            and(
              eq(views.userId, userId),
              eq(views.videoId, videoId),
              sql`${views.createdAt} > NOW() - INTERVAL '1 minute'`
            )
          )
          .limit(1);

        if (recentDbView.length > 0) {
          viewWindowCache.set(viewKey, now);
          return res.json({
            recorded: false,
            rateLimited: true,
            reason: 'View already recorded within 1-minute window',
          });
        }
      }

      // Insert view into database
      await db.insert(views).values({
        videoId,
        userId: userId || null,
        watchMs,
      });

      viewWindowCache.set(viewKey, now);

      const [countResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(views)
        .where(eq(views.videoId, videoId));

      const viewsCount = countResult?.count || 1;

      return res.status(201).json({
        recorded: true,
        views_count: viewsCount,
        viewsCount,
      });
    } catch (err: any) {
      console.error('Error inserting view into PostgreSQL:', err);
      return res.status(500).json({ error: 'Database view insert failed' });
    }
  };

  app.post('/api/videos/:id/view', handleRecordView);
  app.post('/api/views', handleRecordView);

  // AI Meme Punchline Generator
  app.post('/api/gemini/meme-punchlines', async (req: Request, res: Response) => {
    try {
      const { topic, language = 'sw' } = req.body;

      if (!ai) {
        const fallbackCaptions = [
          {
            title: language === 'sw' ? 'Mshahara na Kodi' : 'Payday vs Landlord',
            caption: language === 'sw' 
              ? 'Mshahara ukiingia Ijumaa 2:00 PM, mwenye nyumba anabisha mlango 2:05 PM! 😂🏃‍♂️' 
              : 'When salary lands at 2:00 PM and landlord knocks at 2:05 PM! 😂',
            hashtags: ['#SwahiliMemes', '#Mshahara', '#VunjaMbavu']
          },
          {
            title: language === 'sw' ? 'Konda na Chenji' : 'Bus Conductor',
            caption: language === 'sw'
              ? 'Ukimwambia konda "Naomba chenji yangu" alafu anakuangalia kama umemuomba figo lake! 💀'
              : 'Asking the bus conductor for your balance and he looks at you like you asked for a kidney! 💀',
            hashtags: ['#Daladala', '#Cheka', '#MemeShorts']
          }
        ];
        return res.json({ captions: fallbackCaptions, source: 'curated_fallback' });
      }

      const prompt = `You are the lead comedy writer for "Cheka", an East African & global meme short reel platform.
Generate 3 witty, hilarious meme captions for: "${topic || 'Everyday relatable struggles'}".
Language: "${language === 'sw' ? 'Kiswahili with natural comedy slang' : 'English meme tone'}"
Output JSON:
{
  "captions": [
    {
      "title": "Short title (2-4 words)",
      "caption": "Punchline (1-2 sentences)",
      "hashtags": ["#Tag1", "#Tag2"]
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({ captions: parsed.captions || [], source: 'gemini' });
    } catch (err: any) {
      console.error('Error generating meme punchlines:', err);
      return res.status(500).json({ error: 'Failed to generate captions' });
    }
  });

  // Setup Vite dev server or serve built assets in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cheka server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
