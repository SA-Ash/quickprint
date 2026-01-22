// Application constants
export const APP_NAME = 'QuickPrint';

// OTP Configuration
export const OTP_LENGTH = 4;
export const OTP_EXPIRY_MINUTES = 5;

// Token Configuration
export const TOKEN_TYPES = {
  ACCESS: 'access',
  REFRESH: 'refresh',
} as const;

// User Roles
export const USER_ROLES = {
  STUDENT: 'STUDENT',
  SHOP: 'SHOP',
  ADMIN: 'ADMIN',
} as const;

// Order Statuses
export const ORDER_STATUSES = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  PRINTING: 'PRINTING',
  READY: 'READY',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

// API Versioning
export const API_PREFIX = '/api';
