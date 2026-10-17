import { db } from './index.ts';
import { users, videos, comments, likes, saves, follows } from './schema.ts';
import { sql } from 'drizzle-orm';

export async function seedDatabaseIfEmpty() {
  try {
    // Ensure critical indexes are created in PostgreSQL
    try {
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_videos_created ON videos(created_at DESC);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_likes_video_user ON likes(video_id, user_id);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_saves_video_user ON saves(video_id, user_id);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_views_video_user ON views(video_id, user_id);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_views_created ON views(created_at DESC);`);
    } catch (idxErr) {
      console.warn('Index verification note:', idxErr);
    }

    const userCountResult = await db.select({ count: sql<number>`count(*)` }).from(users);
    const count = Number(userCountResult[0]?.count || 0);

    if (count > 0) {
      console.log(`Database already contains ${count} users. Skipping seed.`);
      return;
    }

    console.log('Database is empty. Seeding initial creators and meme reels into PostgreSQL...');

    // 1. Seed Users
    const [u1, u2, u3] = await db
      .insert(users)
      .values([
        {
          username: 'mwalimu_comedy',
          email: 'mwalimu@cheka.io',
          passwordHash: '$2b$12$e8YxP4...hashed_pass_mwalimu',
          avatarUrl: '/src/assets/images/swahili_comedian_avatar_1792057038016.jpg',
        },
        {
          username: 'bongomemes_hq',
          email: 'bongo@cheka.io',
          passwordHash: '$2b$12$e8YxP4...hashed_pass_bongo',
          avatarUrl: '/src/assets/images/funny_cat_shock_meme_1792057039146.jpg',
        },
        {
          username: 'streetcomedy_ea',
          email: 'street@cheka.io',
          passwordHash: '$2b$12$e8YxP4...hashed_pass_street',
          avatarUrl: '/src/assets/images/bongo_street_comedy_1792057041770.jpg',
        },
      ])
      .returning();

    // 2. Seed Videos
    const [v1, v2, v3, v4] = await db
      .insert(videos)
      .values([
        {
          userId: u1.id,
          caption: 'Ukiwa umefanya kazi wiki mbili bila ku-save halafu ghafla Windows inaleta blue screen: "Restarting in 5 seconds" 😭💀',
          videoUid: 'vid_office_001',
          thumbnailUrl: '/src/assets/images/funny_office_meme_thumb_1792057039620.jpg',
          durationSec: 18,
          status: 'READY',
        },
        {
          userId: u2.id,
          caption: 'Paka akisikia samaki kilo moja soko la Ferry imetoka elfu tano hadi elfu kumi na nane! Atakula ugali bila mchuzi 🐟😹',
          videoUid: 'vid_cat_002',
          thumbnailUrl: '/src/assets/images/funny_cat_shock_meme_1792057039146.jpg',
          durationSec: 15,
          status: 'READY',
        },
        {
          userId: u3.id,
          caption: 'Ukikaa siti ya mbele karibu na dereva wa daladala halafu uanze kumshauri akanyage mafuta mwendo kasi 😂🚌',
          videoUid: 'vid_street_003',
          thumbnailUrl: '/src/assets/images/bongo_street_comedy_1792057041770.jpg',
          durationSec: 22,
          status: 'READY',
        },
        {
          userId: u1.id,
          caption: 'Mtu anakupigia simu saa saba usiku: "Vipi umelala?" Hapana mzee niko rehearsal ya mazishi yangu! 💀🤣',
          videoUid: 'vid_standup_004',
          thumbnailUrl: '/src/assets/images/swahili_comedian_avatar_1792057038016.jpg',
          durationSec: 16,
          status: 'READY',
        },
      ])
      .returning();

    // 3. Seed Comments
    const [c1] = await db
      .insert(comments)
      .values([
        {
          videoId: v1.id,
          userId: u2.id,
          text: 'Mimi nililia ofisini mbele ya HR kabisa! Hii maumivu hayana dawa 😭😭',
        },
        {
          videoId: v1.id,
          userId: u3.id,
          text: 'Windows updates are the real villains of generation Z! 💀',
        },
        {
          videoId: v2.id,
          userId: u1.id,
          text: 'Huyo paka sura yake inasema: "Kwa hiyo mimi nile nyasi leo?" 😹😹😹',
        },
      ])
      .returning();

    // Nested reply
    await db.insert(comments).values([
      {
        videoId: v1.id,
        userId: u1.id,
        parentId: c1.id,
        text: 'Ctrl + S inatakiwa iwe reflex kama kupumua mkuu 😂',
      },
    ]);

    // 4. Seed Initial Likes & Follows
    await db.insert(likes).values([
      { userId: u2.id, videoId: v1.id },
      { userId: u3.id, videoId: v1.id },
      { userId: u1.id, videoId: v2.id },
      { userId: u3.id, videoId: v2.id },
    ]);

    await db.insert(follows).values([
      { followerId: u2.id, followeeId: u1.id },
      { followerId: u3.id, followeeId: u1.id },
    ]);

    console.log('PostgreSQL database seeded successfully with real relational records!');
  } catch (err) {
    console.error('Error seeding database:', err);
  }
}
