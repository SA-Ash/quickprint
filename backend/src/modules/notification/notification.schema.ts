import { z } from 'zod';

export const createNotificationSchema = z.object({
  type: z.string(),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  orderId: z.string().optional(),
});

export const notificationIdParamSchema = z.object({
  id: z.string(),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
