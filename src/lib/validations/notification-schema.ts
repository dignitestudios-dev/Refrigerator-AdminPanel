// src/lib/validations/notification-schema.ts
import { z } from 'zod';

export const notificationSchema = z
  .object({
    createMode: z.enum(['now', 'schedule', 'draft']),
    title: z
      .string()
      .min(1, 'Title is required')
      .max(100, 'Title cannot exceed 100 characters'),
    description: z
      .string()
      .min(1, 'Description is required')
      .max(500, 'Description cannot exceed 500 characters'),
    targetAudience: z.enum(['active_users', 'custom']).optional(),
    scheduledDateTime: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.createMode !== 'draft' && !data.targetAudience) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['targetAudience'],
        message: 'Target audience is required when not saving as draft',
      });
    }

    if (data.createMode === 'schedule') {
      if (!data.scheduledDateTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['scheduledDateTime'],
          message: 'Scheduled date and time is required',
        });
      } else {
        const time = new Date(data.scheduledDateTime).getTime();
        if (isNaN(time) || time <= Date.now()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['scheduledDateTime'],
            message: 'Scheduled time must be in the future',
          });
        }
      }
    }
  });

export type NotificationFormData = z.infer<typeof notificationSchema>;
