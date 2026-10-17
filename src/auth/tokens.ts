import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'cheka_super_secret_jwt_key_2026_production';

export interface TokenUserPayload {
  id: string;
  username: string;
  email: string;
}

// Access token expires in 15 minutes as strictly required
export function generateAccessToken(user: TokenUserPayload): string {
  return jwt.sign(
    {
      sub: user.id,
      username: user.username,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
}

// 64-character cryptographically secure random string
export function generateRefreshTokenString(): string {
  return crypto.randomBytes(32).toString('hex'); // 32 bytes = 64 hex characters
}

// SHA-256 hash for secure storage of refresh tokens in DB
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function verifyAccessToken(token: string): TokenUserPayload {
  const decoded = jwt.verify(token, JWT_SECRET) as any;
  return {
    id: decoded.sub,
    username: decoded.username,
    email: decoded.email,
  };
}
