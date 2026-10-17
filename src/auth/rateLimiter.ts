import { Request, Response, NextFunction } from 'express';

interface AttemptRecord {
  count: number;
  firstAttemptTime: number;
  lastAttemptTime: number;
}

const loginAttempts = new Map<string, AttemptRecord>();

const WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;

// Cleanup stale entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of loginAttempts.entries()) {
    if (now - record.lastAttemptTime > WINDOW_MS) {
      loginAttempts.delete(ip);
    }
  }
}, 10 * 60 * 1000);

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
}

export const loginRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const ip = getClientIp(req);
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (record) {
    // If window expired, reset
    if (now - record.firstAttemptTime > WINDOW_MS) {
      loginAttempts.delete(ip);
      return next();
    }

    if (record.count >= MAX_ATTEMPTS) {
      const waitSeconds = Math.ceil((record.firstAttemptTime + WINDOW_MS - now) / 1000);
      res.setHeader('Retry-After', waitSeconds.toString());
      return res.status(429).json({
        error: `Too many failed login attempts (${record.count}/${MAX_ATTEMPTS}). Please wait ${waitSeconds}s before trying again.`,
        retryAfterSec: waitSeconds,
      });
    }
  }

  next();
};

export const recordFailedLoginAttempt = (req: Request) => {
  const ip = getClientIp(req);
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record || now - record.firstAttemptTime > WINDOW_MS) {
    loginAttempts.set(ip, {
      count: 1,
      firstAttemptTime: now,
      lastAttemptTime: now,
    });
  } else {
    record.count += 1;
    record.lastAttemptTime = now;
  }
};

export const clearLoginAttempts = (req: Request) => {
  const ip = getClientIp(req);
  loginAttempts.delete(ip);
};
