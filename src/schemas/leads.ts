import { z } from 'zod';

export const leadSchema = z.object({
  email: z.string().email().optional().nullable(),
  whatsappNumber: z
    .string()
    .regex(/^\+?[1-9]\d{7,14}$/)
    .optional()
    .nullable(),
  firstName: z.string().min(1).optional().nullable(),
  lastName: z.string().min(1).optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  optedIn: z.boolean().optional().default(true),
  customFields: z.record(z.any()).optional().default({})
});

export const bulkTagSchema = z.object({
  leadIds: z.array(z.string()),
  tags: z.array(z.string()),
  action: z.enum(['add', 'remove'])
});
