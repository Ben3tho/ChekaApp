import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenUserPayload } from '../auth/tokens.ts';
import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';
import { eq } from 'drizzle-orm';

export interface AuthenticatedUser {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  createdAt: Date;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized: Missing or malformed Authorization header (format: Bearer <access_token>)',
    });
  }

  const token = authHeader.split('Bearer ')[1].trim();
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Token is empty' });
  }

  let payload: TokenUserPayload;
  try {
    payload = verifyAccessToken(token);
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Unauthorized: Access token has expired (older than 15 minutes)',
        code: 'TOKEN_EXPIRED',
      });
    }
    return res.status(401).json({
      error: 'Unauthorized: Invalid access token signature',
      code: 'INVALID_TOKEN',
    });
  }

  try {
    // Query PostgreSQL database record
    const [dbUser] = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        avatarUrl: users.avatarUrl,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, payload.id))
      .limit(1);

    if (!dbUser) {
      return res.status(401).json({ error: 'Unauthorized: User not found in database' });
    }

    // Attach verified user without password hash
    req.user = dbUser;
    next();
  } catch (dbErr: any) {
    console.error('Authentication DB lookup failed:', dbErr);
    return res.status(500).json({ error: 'Database error during authentication' });
  }
};
