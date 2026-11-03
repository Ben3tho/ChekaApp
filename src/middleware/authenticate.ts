import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, type TokenUserPayload } from '../auth/tokens.ts';
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
  let token: string | null = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split('Bearer ')[1].trim();
  }

  // 1. If valid Bearer token provided, verify and load corresponding DB user
  if (token) {
    try {
      const payload: TokenUserPayload = verifyAccessToken(token);
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

      if (dbUser) {
        req.user = dbUser;
        return next();
      }
    } catch {
      // Token expired or invalid signature
    }
  }

  // Reject unauthenticated requests with a 401 response
  return res.status(401).json({
    error: 'Unauthorized: Tafadhali ingia kwenye akaunti yako kwanza (Authentication required)',
  });
};
