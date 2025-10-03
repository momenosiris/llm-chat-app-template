import crypto from 'crypto';

export function signPayload(payload: string, secret: string) {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

export function verifySignature(signature: string | null | undefined, payload: string, secret: string) {
  if (!signature) return false;
  const expected = signPayload(payload, secret);
  const sig = signature.replace(/^sha256=/, '');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
}
