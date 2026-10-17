import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/index.ts';
import { users, refreshTokens } from '../db/schema.ts';
import { eq, and, isNull, gt } from 'drizzle-orm';
import { signupSchema, loginSchema } from './validation.ts';
import {
  generateAccessToken,
  generateRefreshTokenString,
  hashToken,
} from './tokens.ts';
import {
  loginRateLimiter,
  recordFailedLoginAttempt,
  clearLoginAttempts,
} from './rateLimiter.ts';
import { authenticate, AuthenticatedRequest } from '../middleware/authenticate.ts';

const router = Router();

const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  path: '/',
};

// 1. POST /api/auth/signup {username, email, password} -> 201
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const parseResult = signupSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issueMessages = parseResult.error.issues.map((i) => i.message);
      return res.status(400).json({
        error: 'Validation failed',
        details: issueMessages,
      });
    }

    const { username, email, password } = parseResult.data;

    // Check if username or email already exists in PostgreSQL
    const existingUser = await db
      .select({ id: users.id, username: users.username, email: users.email })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(409).json({ error: 'Username already taken. Please choose another.' });
    }

    const existingEmail = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingEmail.length > 0) {
      return res.status(409).json({ error: 'Email already registered. Please log in.' });
    }

    // Hash password with bcrypt cost factor 12 (strictly required)
    const BCRYPT_SALT_ROUNDS = 12;
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // Insert user into PostgreSQL
    const [newUser] = await db
      .insert(users)
      .values({
        username,
        email,
        passwordHash,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
      })
      .returning({
        id: users.id,
        username: users.username,
        email: users.email,
        avatarUrl: users.avatarUrl,
        createdAt: users.createdAt,
      });

    // Generate 64-char refresh token
    const refreshToken = generateRefreshTokenString();
    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Save refresh token to PostgreSQL
    await db.insert(refreshTokens).values({
      userId: newUser.id,
      tokenHash,
      expiresAt,
    });

    // Generate 15-minute access token
    const accessToken = generateAccessToken(newUser);

    // Set httpOnly cookie
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);

    return res.status(201).json({
      message: 'Account created successfully',
      accessToken,
      refreshToken, // returned as fallback for clients with restrictive cookie settings
      user: newUser,
    });
  } catch (err: any) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// 2. POST /api/auth/login {email, password} -> sets refresh cookie, returns 15m access token
// Uses loginRateLimiter (max 5 failed attempts / 5 min / IP)
router.post('/login', loginRateLimiter, async (req: Request, res: Response) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.issues.map((i) => i.message),
      });
    }

    const { email, password } = parseResult.data;

    // Query user by email
    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        passwordHash: users.passwordHash,
        avatarUrl: users.avatarUrl,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      recordFailedLoginAttempt(req);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify bcrypt password hash
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      recordFailedLoginAttempt(req);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Login succeeded: clear rate-limit failure counter for this IP
    clearLoginAttempts(req);

    // Generate 64-char refresh token
    const refreshToken = generateRefreshTokenString();
    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Save refresh token to PostgreSQL
    await db.insert(refreshTokens).values({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    // Generate 15-minute access token
    const userPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
    };
    const accessToken = generateAccessToken(userPayload);

    // Set httpOnly cookie
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);

    const safeUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    };

    return res.status(200).json({
      message: 'Login successful',
      accessToken,
      refreshToken, // returned as fallback for client storage
      user: safeUser,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error during login' });
  }
});

// 3. POST /api/auth/refresh -> rotates refresh token (token ya zamani irevokewe)
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const incomingToken =
      req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;

    if (!incomingToken || typeof incomingToken !== 'string') {
      return res.status(401).json({
        error: 'Unauthorized: Missing refresh token in cookie or request body',
      });
    }

    const tokenHash = hashToken(incomingToken);

    // Query active unrevoked unexpired token from PostgreSQL
    const [storedToken] = await db
      .select({
        id: refreshTokens.id,
        userId: refreshTokens.userId,
        expiresAt: refreshTokens.expiresAt,
        revokedAt: refreshTokens.revokedAt,
      })
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.tokenHash, tokenHash),
          isNull(refreshTokens.revokedAt),
          gt(refreshTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!storedToken) {
      // Clear cookie if present
      res.clearCookie(REFRESH_COOKIE_NAME, REFRESH_COOKIE_OPTIONS);
      return res.status(401).json({
        error: 'Unauthorized: Refresh token is invalid, expired, or already revoked',
        code: 'REFRESH_REVOKED',
      });
    }

    // ROTATION: Immediately revoke the used refresh token
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.id, storedToken.id));

    // Fetch user details
    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        avatarUrl: users.avatarUrl,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, storedToken.userId))
      .limit(1);

    if (!user) {
      return res.status(401).json({ error: 'User associated with refresh token not found' });
    }

    // Generate NEW 64-char refresh token
    const newRefreshToken = generateRefreshTokenString();
    const newTokenHash = hashToken(newRefreshToken);
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Save new refresh token in PostgreSQL
    await db.insert(refreshTokens).values({
      userId: user.id,
      tokenHash: newTokenHash,
      expiresAt: newExpiresAt,
    });

    // Generate NEW 15-minute access token
    const newAccessToken = generateAccessToken({
      id: user.id,
      username: user.username,
      email: user.email,
    });

    // Set new httpOnly cookie
    res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, REFRESH_COOKIE_OPTIONS);

    return res.status(200).json({
      message: 'Token rotated successfully',
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user,
    });
  } catch (err: any) {
    console.error('Refresh token rotation error:', err);
    return res.status(500).json({ error: 'Failed to rotate refresh token' });
  }
});

// 4. POST /api/auth/logout -> revoke refresh token
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const incomingToken =
      req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;

    if (incomingToken && typeof incomingToken === 'string') {
      const tokenHash = hashToken(incomingToken);
      // Revoke in PostgreSQL
      await db
        .update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(eq(refreshTokens.tokenHash, tokenHash));
    }

    res.clearCookie(REFRESH_COOKIE_NAME, REFRESH_COOKIE_OPTIONS);
    return res.status(200).json({ message: 'Successfully logged out and revoked session' });
  } catch (err: any) {
    console.error('Logout error:', err);
    return res.status(500).json({ error: 'Failed to logout' });
  }
});

// 5. GET /api/auth/me -> Returns authenticated user profile using middleware
router.get('/me', authenticate, (req: AuthenticatedRequest, res: Response) => {
  return res.status(200).json({ user: req.user });
});

export default router;
