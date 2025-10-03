import { z } from 'zod';

export const sendJobSchema = z.object({
  channel: z.enum(['email', 'whatsapp']),
  templateId: z.string(),
  segmentTags: z.array(z.string()).optional().default([]),
  filters: z.record(z.any()).optional().default({}),
  webhookFlowId: z.string().optional().nullable(),
  logic: z.enum(['and', 'or']).optional().default('or')
});
