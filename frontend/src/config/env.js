/**
 * QuickPrint Frontend Configuration
 * Centralized environment configuration
 */

export const config = {
  // API Configuration
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',

  // Environment
  APP_ENV: import.meta.env.VITE_APP_ENV || 'development',
  DEBUG: import.meta.env.VITE_DEBUG === 'true',

  // Mock mode - set to true to use localStorage instead of real API
  USE_MOCK: import.meta.env.VITE_USE_MOCK === 'true',

  // Feature Flags
  ENABLE_UPI_PAYMENTS: import.meta.env.VITE_ENABLE_UPI_PAYMENTS !== 'false',
  ENABLE_COD_PAYMENTS: import.meta.env.VITE_ENABLE_COD_PAYMENTS !== 'false',
  ENABLE_GOOGLE_AUTH: import.meta.env.VITE_ENABLE_GOOGLE_AUTH !== 'false',
  ENABLE_PHONE_AUTH: import.meta.env.VITE_ENABLE_PHONE_AUTH !== 'false',

  // Map Configuration
  DEFAULT_MAP_CENTER_LAT: parseFloat(import.meta.env.VITE_DEFAULT_MAP_CENTER_LAT) || 17.4401,
  DEFAULT_MAP_CENTER_LNG: parseFloat(import.meta.env.VITE_DEFAULT_MAP_CENTER_LNG) || 78.3489,
  DEFAULT_SEARCH_RADIUS: parseInt(import.meta.env.VITE_DEFAULT_SEARCH_RADIUS) || 5000,

  // Google OAuth (if enabled)
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',

  // Razorpay (for payment integration)
  RAZORPAY_KEY_ID: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
};

// Log config in debug mode
if (config.DEBUG) {
  console.log('QuickPrint Config:', {
    ...config,
    // Don't log sensitive keys
    GOOGLE_CLIENT_ID: config.GOOGLE_CLIENT_ID ? '[SET]' : '[NOT SET]',
    RAZORPAY_KEY_ID: config.RAZORPAY_KEY_ID ? '[SET]' : '[NOT SET]',
  });
}

export default config;
