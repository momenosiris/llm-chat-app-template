import { z } from 'zod';

export const userAdminSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['admin', 'user']),
  status: z.enum(['active', 'disabled']).optional().default('active'),
  clientId: z.string().optional().nullable(),
  password: z.string().min(8).optional()
});

export const clientSchema = z.object({
  name: z.string().min(1),
  status: z.enum(['active', 'disabled']).optional().default('active'),
  hmacSecret: z.string().min(8)
});

export const clientWebhookSchema = z.object({
  clientId: z.string(),
  channel: z.enum(['email', 'whatsapp']),
  name: z.string().min(1),
  url: z.string().url(),
  isDefault: z.boolean().optional().default(false)
});

export const systemConfigSchema = z.object({
  callbackWebhookIn: z.string().url(),
  defaultHmacSecret: z.string().min(8),
  rateLimits: z.record(z.any()),
  csvDefaultMapping: z.record(z.any())
});
