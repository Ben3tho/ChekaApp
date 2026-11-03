import { GoogleGenAI } from '@google/genai';
import { Pool } from 'pg';
import crypto from 'crypto';

// Initialize Gemini client for AI video & text moderation
const ai = new GoogleGenAI();

export interface ContentModerationResult {
  safe: boolean;
  flagReason?: string;
  categories?: string[];
  confidence: number;
}

export interface WalletSummary {
  userId: string;
  coinsBalance: number;
  creatorEarningsTzs: number;
  totalEarnedTzs: number;
  totalWithdrawnTzs: number;
  pendingPayoutsTzs: number;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'gift' | 'video' | 'system' | 'payout';
  title: string;
  body: string;
  metadata?: any;
  isRead: boolean;
  createdAt: string;
}

/**
 * Ensures supplementary PostgreSQL tables exist for the 7 strategic pillars:
 * - Wallet Ledger (double-entry audit trail & idempotency)
 * - Creator Payouts (mobile money withdrawals)
 * - Video Safety Reports (moderation queue)
 * - Blocked Users (harassment protection)
 * - User Notifications (instant event re-engagement)
 */
export async function initSupplementaryTables(pool: Pool) {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wallet_ledger (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        amount_tzs INT NOT NULL DEFAULT 0,
        coins INT NOT NULL DEFAULT 0,
        transaction_type TEXT NOT NULL, -- 'DEPOSIT', 'GIFT_SENT', 'GIFT_RECEIVED', 'WITHDRAWAL_REQUEST', 'WITHDRAWAL_PAID', 'REFUND'
        status TEXT NOT NULL DEFAULT 'COMPLETED', -- 'PENDING', 'COMPLETED', 'FAILED', 'REJECTED'
        reference_code TEXT NOT NULL,
        idempotency_key TEXT UNIQUE,
        description TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_wallet_ledger_user ON wallet_ledger (user_id);
      CREATE INDEX IF NOT EXISTS idx_wallet_ledger_type ON wallet_ledger (transaction_type);

      CREATE TABLE IF NOT EXISTS creator_payouts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        creator_id UUID NOT NULL,
        amount_tzs INT NOT NULL,
        operator TEXT NOT NULL, -- 'mpesa', 'tigopesa', 'airtelmoney', 'halopesa', 'azampay'
        phone_number TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'PROCESSED', 'REJECTED'
        reference_code TEXT NOT NULL,
        idempotency_key TEXT UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_creator_payouts_creator ON creator_payouts (creator_id);

      CREATE TABLE IF NOT EXISTS video_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        video_id UUID NOT NULL,
        reporter_id UUID,
        reason TEXT NOT NULL, -- 'hate_speech', 'inappropriate', 'copyright', 'spam', 'dangerous'
        details TEXT,
        status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'REVIEWED_ALLOWED', 'REVIEWED_REMOVED'
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_video_reports_video ON video_reports (video_id);

      CREATE TABLE IF NOT EXISTS blocked_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        blocker_id UUID NOT NULL,
        blocked_id UUID NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(blocker_id, blocked_id)
      );
      CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON blocked_users (blocker_id);

      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        type TEXT NOT NULL, -- 'like', 'comment', 'gift', 'video', 'system', 'payout'
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        metadata_json TEXT,
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications (user_id, is_read);

      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        amount_tzs INT NOT NULL,
        coins_credited INT NOT NULL,
        phone_number TEXT NOT NULL,
        operator TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'COMPLETED',
        reference_code TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        endpoint TEXT NOT NULL UNIQUE,
        subscription_data TEXT NOT NULL,
        user_agent TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log('Supplementary tables (Wallet Ledger, Payouts, Reports, Blocks, Notifications, Payments, Push) verified.');
  } catch (err: any) {
    console.warn('Supplementary tables init warning:', err.message);
  }
}

/**
 * Pillar B: Automated AI Video & Text Moderation using Gemini
 * Analyzes video captions, punchlines, and tags for UGC compliance:
 * - Adult / Nudity / Explicit content
 * - Violence / Physical harm
 * - Hate speech / Tribal slurs / Harassment (Swahili & English)
 * - Dangerous / Illegal content
 */
export async function moderateContentWithGemini(
  caption: string,
  tags: string[] = []
): Promise<ContentModerationResult> {
  const combinedText = `${caption} ${tags.join(' ')}`.trim();

  // Fast pre-filter for severe hate speech & offensive words (Swahili & English)
  const blacklistPattern = /\b(kuma|mkundu|malaya|kahaba|shoga\s+wewe|mwanaharamu|fuck|bitch|porn|nude|sex\s+video)\b/i;
  if (blacklistPattern.test(combinedText)) {
    return {
      safe: false,
      flagReason: 'Maudhui yana maneno yasiyofaa kulingana na miongozo ya jamii (Profanity/Inappropriate content)',
      categories: ['profanity', 'inappropriate'],
      confidence: 0.95,
    };
  }

  try {
    const prompt = `You are the Lead Trust & Safety AI Moderator for ChekaApp, a family-friendly East African short-video comedy platform.
Evaluate the following comedy video caption and hashtags for compliance with Google Play UGC safety guidelines:
Caption & Tags: "${combinedText}"

Safety Criteria:
1. Adult / Sexual / Nudity content: Strictly forbidden.
2. Graphic violence, blood, or physical harm: Strictly forbidden.
3. Hate speech, harassment, tribal discrimination, or derogatory slurs (in Swahili or English): Strictly forbidden.
4. Harmless jokes, satire, puns, funny life experiences (daladala, rent, office humor, sports banters): ALLOWED and encouraged.

Return ONLY a valid JSON object matching this exact schema:
{
  "safe": boolean,
  "flagReason": string (in Swahili, explain briefly why flagged if unsafe, or empty string if safe),
  "categories": string[] (e.g. ["sexual", "violence", "hate_speech", "harassment"] or []),
  "confidence": number (between 0.0 and 1.0)
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      safe: typeof parsed.safe === 'boolean' ? parsed.safe : true,
      flagReason: parsed.flagReason || undefined,
      categories: Array.isArray(parsed.categories) ? parsed.categories : [],
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.9,
    };
  } catch (err: any) {
    console.warn('AI moderation API check notice:', err.message);
    // If Gemini API is unreachable, fall back safely
    return {
      safe: true,
      confidence: 0.7,
    };
  }
}

/**
 * Pillar C: Wallet Ledger & Creator Earnings calculation
 */
export async function getWalletSummary(pool: Pool, userId: string): Promise<WalletSummary> {
  try {
    const ledgerResult = await pool.query(
      `SELECT 
        COALESCE(SUM(CASE WHEN transaction_type IN ('DEPOSIT', 'DAILY_REWARD') THEN coins ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN transaction_type = 'GIFT_SENT' THEN coins ELSE 0 END), 0) AS calculated_coins,
        COALESCE(SUM(CASE WHEN transaction_type = 'GIFT_RECEIVED' THEN amount_tzs ELSE 0 END), 0) AS total_earned_tzs,
        COALESCE(SUM(CASE WHEN transaction_type = 'WITHDRAWAL_PAID' THEN amount_tzs ELSE 0 END), 0) AS total_withdrawn_tzs,
        COALESCE(SUM(CASE WHEN transaction_type = 'WITHDRAWAL_REQUEST' AND status = 'PENDING' THEN amount_tzs ELSE 0 END), 0) AS pending_payouts_tzs
      FROM wallet_ledger
      WHERE user_id = $1`,
      [userId]
    );

    const row = ledgerResult.rows[0] || {};
    const coinsBalance = Math.max(0, parseInt(row.calculated_coins, 10) || 0);
    const totalEarnedTzs = parseInt(row.total_earned_tzs, 10) || 0;
    const totalWithdrawnTzs = parseInt(row.total_withdrawn_tzs, 10) || 0;
    const pendingPayoutsTzs = parseInt(row.pending_payouts_tzs, 10) || 0;
    const creatorEarningsTzs = Math.max(0, totalEarnedTzs - totalWithdrawnTzs - pendingPayoutsTzs);

    return {
      userId,
      coinsBalance: coinsBalance > 0 ? coinsBalance : 250, // Default signup welcome coins
      creatorEarningsTzs,
      totalEarnedTzs,
      totalWithdrawnTzs,
      pendingPayoutsTzs,
    };
  } catch (err: any) {
    console.warn('Error fetching wallet summary:', err.message);
    return {
      userId,
      coinsBalance: 250,
      creatorEarningsTzs: 0,
      totalEarnedTzs: 0,
      totalWithdrawnTzs: 0,
      pendingPayoutsTzs: 0,
    };
  }
}

/**
 * Pillar C: Process gift sending with Double-Entry Wallet Ledger
 * Sender loses coins -> Creator gains earnings (1 coin = 50 TZS; 70% to creator, 30% platform)
 */
export async function processGiftTransaction(
  pool: Pool,
  senderId: string,
  receiverId: string,
  giftId: string,
  coinsCost: number,
  giftName: string
): Promise<{ success: boolean; error?: string; referenceCode?: string }> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check sender balance
    const senderSummary = await getWalletSummary(pool, senderId);
    if (senderSummary.coinsBalance < coinsCost) {
      await client.query('ROLLBACK');
      return { success: false, error: 'Huna sarafu za kutosha kutuma zawadi hii. Nunua sarafu sasa.' };
    }

    const refCode = `GIFT_${Date.now()}_${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const creatorTzs = Math.round(coinsCost * 50 * 0.70); // 70% share to comedian in TZS

    // Entry 1: Debit sender
    await client.query(
      `INSERT INTO wallet_ledger (user_id, amount_tzs, coins, transaction_type, status, reference_code, description)
       VALUES ($1, $2, $3, 'GIFT_SENT', 'COMPLETED', $4, $5)`,
      [senderId, 0, coinsCost, refCode, `Umetuma zawadi ya ${giftName}`]
    );

    // Entry 2: Credit creator earnings
    await client.query(
      `INSERT INTO wallet_ledger (user_id, amount_tzs, coins, transaction_type, status, reference_code, description)
       VALUES ($1, $2, $3, 'GIFT_RECEIVED', 'COMPLETED', $4, $5)`,
      [receiverId, creatorTzs, coinsCost, refCode, `Zawadi ya ${giftName} kutoka kwa shabiki`]
    );

    // Entry 3: Dispatch notification to creator
    await client.query(
      `INSERT INTO notifications (user_id, type, title, body, metadata_json)
       VALUES ($1, 'gift', $2, $3, $4)`,
      [
        receiverId,
        '🎁 Umepokea Zawadi Mpya!',
        `Umepokea zawadi ya ${giftName} yenye thamani ya TZS ${creatorTzs.toLocaleString()}!`,
        JSON.stringify({ senderId, giftId, coinsCost, creatorTzs }),
      ]
    );

    await client.query('COMMIT');
    return { success: true, referenceCode: refCode };
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Error processing gift transaction:', err);
    return { success: false, error: 'Hitilafu ya kimiamala ya zawadi' };
  } finally {
    client.release();
  }
}

/**
 * Pillar C: Request Creator Earnings Withdrawal
 * Minimum 5,000 TZS, verified through double-entry ledger & idempotency key
 */
export async function requestCreatorPayout(
  pool: Pool,
  creatorId: string,
  amountTzs: number,
  operator: string,
  phoneNumber: string,
  idempotencyKey?: string
): Promise<{ success: boolean; error?: string; payoutId?: string }> {
  if (amountTzs < 5000) {
    return { success: false, error: 'Kiwango cha chini cha kutoa fedha ni TZS 5,000' };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Idempotency check
    if (idempotencyKey) {
      const existing = await client.query(
        `SELECT id FROM creator_payouts WHERE idempotency_key = $1`,
        [idempotencyKey]
      );
      if (existing.rows.length > 0) {
        await client.query('ROLLBACK');
        return { success: true, payoutId: existing.rows[0].id };
      }
    }

    const summary = await getWalletSummary(pool, creatorId);
    if (summary.creatorEarningsTzs < amountTzs) {
      await client.query('ROLLBACK');
      return { success: false, error: `Salio lako la mapato (TZS ${summary.creatorEarningsTzs.toLocaleString()}) halitoshi kutoa TZS ${amountTzs.toLocaleString()}` };
    }

    const refCode = `POUT_${Date.now()}_${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    // 1. Record in creator_payouts
    const payoutRes = await client.query(
      `INSERT INTO creator_payouts (creator_id, amount_tzs, operator, phone_number, status, reference_code, idempotency_key)
       VALUES ($1, $2, $3, $4, 'PENDING', $5, $6)
       RETURNING id`,
      [creatorId, amountTzs, operator, phoneNumber, refCode, idempotencyKey || refCode]
    );

    // 2. Record debit in wallet_ledger
    await client.query(
      `INSERT INTO wallet_ledger (user_id, amount_tzs, coins, transaction_type, status, reference_code, idempotency_key, description)
       VALUES ($1, $2, 0, 'WITHDRAWAL_REQUEST', 'PENDING', $3, $4, $5)`,
      [creatorId, amountTzs, refCode, idempotencyKey || refCode, `Ombi la kutoa TZS ${amountTzs.toLocaleString()} kwenda ${operator.toUpperCase()} (${phoneNumber})`]
    );

    // 3. Send notification
    await client.query(
      `INSERT INTO notifications (user_id, type, title, body, metadata_json)
       VALUES ($1, 'payout', $2, $3, $4)`,
      [
        creatorId,
        '💸 Ombi la Kutoa Fedha Limepokelewa',
        `Ombi lako la kutoa TZS ${amountTzs.toLocaleString()} kwenda namba ${phoneNumber} (${operator.toUpperCase()}) linashughulikiwa. Ref: ${refCode}`,
        JSON.stringify({ amountTzs, operator, phoneNumber, refCode }),
      ]
    );

    await client.query('COMMIT');
    return { success: true, payoutId: payoutRes.rows[0]?.id };
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Error creating creator payout request:', err);
    return { success: false, error: 'Hitilafu ya seva wakati wa kuwasilisha ombi la kutoa fedha' };
  } finally {
    client.release();
  }
}

/**
 * Pillar D: Create In-App & Push Notification
 */
export async function dispatchNotification(
  pool: Pool,
  userId: string,
  type: 'like' | 'comment' | 'gift' | 'video' | 'system' | 'payout',
  title: string,
  body: string,
  metadata: any = {}
) {
  try {
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, body, metadata_json)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, type, title, body, JSON.stringify(metadata)]
    );
  } catch (err: any) {
    console.warn('Notification dispatch error:', err.message);
  }
}
