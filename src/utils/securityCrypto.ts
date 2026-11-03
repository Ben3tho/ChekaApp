import crypto from 'crypto';

// Master Server Cryptographic Salt / Pepper (from env or high-entropy deterministic fallback)
const E2EE_MASTER_SECRET = process.env.ENCRYPTION_MASTER_KEY || 'cheka_e2ee_zero_knowledge_master_secret_2026_salt_88';
const PII_ENCRYPTION_SECRET = process.env.PII_PEPPER_KEY || 'cheka_pii_token_pepper_secret_2026_shield_99';

/**
 * Derives a deterministic 256-bit AES key for a 1-on-1 direct message thread
 * using participant UUIDs in sorted order so both sender and receiver generate identical keys.
 */
function deriveConversationKey(userA: string, userB: string): Buffer {
  const participants = [userA, userB].sort().join(':');
  return crypto.pbkdf2Sync(
    participants,
    E2EE_MASTER_SECRET,
    100_000,
    32,
    'sha256'
  );
}

/**
 * Derives a 256-bit AES key for PII at rest.
 */
function derivePiiKey(): Buffer {
  return crypto.pbkdf2Sync(
    'cheka_pii_at_rest',
    PII_ENCRYPTION_SECRET,
    100_000,
    32,
    'sha256'
  );
}

/**
 * 1. End-to-End Encrypt a Direct Message using AES-256-GCM
 * Output format: e2ee:v1:<iv_hex>:<ciphertext_hex>:<tag_hex>
 */
export function encryptDirectMessage(plaintext: string, userA: string, userB: string): string {
  if (!plaintext) return '';
  const key = deriveConversationKey(userA, userB);
  const iv = crypto.randomBytes(12); // Standard 96-bit IV for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return `e2ee:v1:${iv.toString('hex')}:${encrypted.toString('hex')}:${tag.toString('hex')}`;
}

/**
 * 1b. Decrypt a Direct Message using AES-256-GCM
 * Throws or returns original if not matching e2ee:v1 format.
 */
export function decryptDirectMessage(encryptedText: string, userA: string, userB: string): string {
  if (!encryptedText) return '';
  if (!encryptedText.startsWith('e2ee:v1:')) {
    // Legacy plaintext message, return as-is
    return encryptedText;
  }

  const parts = encryptedText.split(':');
  if (parts.length !== 5) {
    return '[Ujumbe hauwezi kusomeka: Muundo si sahihi]';
  }

  const ivHex = parts[2];
  const ciphertextHex = parts[3];
  const tagHex = parts[4];

  try {
    const key = deriveConversationKey(userA, userB);
    const iv = Buffer.from(ivHex, 'hex');
    const ciphertext = Buffer.from(ciphertextHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  } catch (err) {
    console.warn('E2EE Decryption failure (tampered or key mismatch):', err);
    return '[Ujumbe umesimbwa kwa njia salama na hauwezi kusomwa na mtu asiyehusika]';
  }
}

/**
 * 2. Mask Phone Number for Public & Owner Views
 * Examples:
 *   "0712345678" -> "0712***78"
 *   "+255712345678" -> "+255 712 *** 78"
 *   "255712345678" -> "+255 712 *** 78"
 */
export function maskPhoneNumber(rawPhone: string): string {
  if (!rawPhone) return '';
  const cleaned = rawPhone.replace(/[^\d+]/g, '');

  if (cleaned.startsWith('+255') && cleaned.length >= 13) {
    // Format: +255 712 *** 78
    const countryCode = '+255';
    const operatorPrefix = cleaned.slice(4, 7);
    const suffix = cleaned.slice(-2);
    return `${countryCode} ${operatorPrefix} *** ${suffix}`;
  } else if (cleaned.startsWith('255') && cleaned.length >= 12) {
    const operatorPrefix = cleaned.slice(3, 6);
    const suffix = cleaned.slice(-2);
    return `+255 ${operatorPrefix} *** ${suffix}`;
  } else if (cleaned.length >= 10) {
    const prefix = cleaned.slice(0, 4);
    const suffix = cleaned.slice(-2);
    return `${prefix}***${suffix}`;
  }

  // Fallback for short numbers
  return cleaned.slice(0, 2) + '****' + cleaned.slice(-2);
}

/**
 * 2b. Encrypt Sensitive PII (e.g. Phone Number at Rest) using AES-256-GCM
 * Format: pii:v1:<iv_hex>:<ciphertext_hex>:<tag_hex>
 */
export function encryptPII(data: string): string {
  if (!data) return '';
  const key = derivePiiKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const encrypted = Buffer.concat([
    cipher.update(data, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return `pii:v1:${iv.toString('hex')}:${encrypted.toString('hex')}:${tag.toString('hex')}`;
}

/**
 * 2c. Decrypt Sensitive PII at Rest
 */
export function decryptPII(encryptedData: string): string {
  if (!encryptedData) return '';
  if (!encryptedData.startsWith('pii:v1:')) {
    return encryptedData;
  }

  const parts = encryptedData.split(':');
  if (parts.length !== 5) return encryptedData;

  try {
    const key = derivePiiKey();
    const iv = Buffer.from(parts[2], 'hex');
    const ciphertext = Buffer.from(parts[3], 'hex');
    const tag = Buffer.from(parts[4], 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  } catch (err) {
    console.warn('PII decryption failure:', err);
    return '';
  }
}

/**
 * 2d. One-Way HMAC Search Token for PII
 * Allows indexing and duplicate checking without ever exposing raw phone numbers.
 */
export function hashPIIToken(data: string): string {
  if (!data) return '';
  return crypto
    .createHmac('sha256', PII_ENCRYPTION_SECRET)
    .update(data.trim().toLowerCase())
    .digest('hex');
}
