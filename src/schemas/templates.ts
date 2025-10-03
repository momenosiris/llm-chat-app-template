import { z } from 'zod';

export const templateSchema = z.object({
  name: z.string().min(1),
  channel: z.enum(['email', 'whatsapp']),
  htmlBody: z.string().optional().nullable(),
  whatsappBody: z.string().optional().nullable(),
  placeholders: z.array(z.string()).optional().default([])
});
