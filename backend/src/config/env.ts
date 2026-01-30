import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),

  // Database
  DATABASE_URL: z.string().url(),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),

  // Twilio
  TWILIO_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),

  // Mock OTP for development
  USE_MOCK_OTP: z.coerce.boolean().default(true),

  // Redis (optional for now)
  REDIS_URL: z.string().optional(),

  // RabbitMQ (optional for now)
  RABBITMQ_URL: z.string().optional(),

  // Paytm
  PAYTM_MID: z.string().optional(),
  PAYTM_MKEY: z.string().optional(),
  PAYTM_WEBSITE: z.string().default('DEFAULT'),
  API_BASE_URL: z.string().default('http://localhost:3000'),

  // AWS S3 / MinIO
  S3_ENDPOINT: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  S3_BUCKET: z.string().optional(),

  // Frontend URL (for magic links)
  FRONTEND_URL: z.string().default('http://localhost:5173'),

  // WebAuthn (Passkey) Relying Party config
  RP_ID: z.string().default('localhost'),
  RP_NAME: z.string().default('QuickPrint'),
  RP_ORIGIN: z.string().default('http://localhost:5173'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
