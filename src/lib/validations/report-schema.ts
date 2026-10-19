// src/lib/validations/report-schema.ts
import { z } from 'zod';

export const resolveReportSchema = z.object({
  action: z.enum(['resolve', 'dismiss']),
  adminNotes: z
    .string()
    .min(3, 'Notes must be at least 3 characters')
    .max(1000, 'Notes cannot exceed 1000 characters'),
  suspendUser: z.boolean(),
});

export type ResolveReportFormData = z.infer<typeof resolveReportSchema>;
