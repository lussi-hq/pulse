import * as crypto from 'crypto';

const SECRET = process.env.JWT_SECRET || 'pulse-fallback-secret-key-12345';

export function signToken(username: string): string {
  const payload = JSON.stringify({
    username,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days expiration
  });
  const signature = crypto
    .createHmac('sha256', SECRET)
    .update(payload)
    .digest('hex');
  
  return Buffer.from(payload).toString('base64url') + '.' + signature;
}

export function verifyToken(token: string): { username: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    
    const [payloadB64, signature] = parts;
    const payloadStr = Buffer.from(payloadB64, 'base64url').toString('utf8');
    
    const expectedSignature = crypto
      .createHmac('sha256', SECRET)
      .update(payloadStr)
      .digest('hex');
    
    if (signature !== expectedSignature) return null;
    
    const payload = JSON.parse(payloadStr);
    if (payload.exp < Date.now()) return null;
    
    return { username: payload.username };
  } catch {
    return null;
  }
}
