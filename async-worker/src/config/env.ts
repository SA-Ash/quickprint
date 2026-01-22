/**
 * Async Worker - Environment Configuration
 */

import 'dotenv/config';

export const workerEnv = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL!,
  RABBITMQ_URL: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
  
  // Twilio SMS
  TWILIO_SID: process.env.TWILIO_SID || '',
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || '',
  USE_MOCK_SMS: process.env.USE_MOCK_OTP === 'true' || process.env.NODE_ENV === 'development',
  
  // SendGrid Email
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || '',
  SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL || 'noreply@quickprint.com',
  USE_MOCK_EMAIL: process.env.NODE_ENV === 'development',
  
  // Firebase FCM
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || '',
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY || '',
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || '',
  USE_MOCK_PUSH: process.env.NODE_ENV === 'development',
};

export function validateWorkerEnv(): void {
  if (!workerEnv.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }
  console.log('[Worker] Environment loaded:', {
    NODE_ENV: workerEnv.NODE_ENV,
    USE_MOCK_SMS: workerEnv.USE_MOCK_SMS,
    USE_MOCK_EMAIL: workerEnv.USE_MOCK_EMAIL,
  });
}
