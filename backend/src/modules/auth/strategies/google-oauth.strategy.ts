import { env } from '../../../config/env.js';

interface GoogleUserPayload {
  sub: string;       
  email: string;
  email_verified: boolean;
  name: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
}

interface GoogleAuthResult {
  success: boolean;
  payload?: GoogleUserPayload;
  error?: string;
}

export const googleOAuthStrategy = {
  async verifyIdToken(idToken: string): Promise<GoogleAuthResult> {
    if (env.NODE_ENV === 'development' && env.USE_MOCK_OTP) {
      return this.mockVerify(idToken);
    }
    return this.verifyWithGoogle(idToken);
  },

  async mockVerify(idToken: string): Promise<GoogleAuthResult> {
    console.log(`[MOCK GOOGLE] Verifying token: ${idToken.substring(0, 20)}...`);
    
    return {
      success: true,
      payload: {
        sub: 'google_mock_' + Date.now(),
        email: 'mockuser@gmail.com',
        email_verified: true,
        name: 'Mock Google User',
        given_name: 'Mock',
        family_name: 'User',
      },
    };
  },

  async verifyWithGoogle(idToken: string): Promise<GoogleAuthResult> {
    try {
      const response = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
      );

      if (!response.ok) {
        return {
          success: false,
          error: 'Invalid Google ID token',
        };
      }

      const payload = await response.json() as GoogleUserPayload;

     

      if (!payload.email_verified) {
        return {
          success: false,
          error: 'Email not verified with Google',
        };
      }

      console.log(`[GOOGLE] Verified user: ${payload.email}`);

      return {
        success: true,
        payload,
      };
    } catch (error) {
      console.error('[GOOGLE] Token verification failed:', error);
      return {
        success: false,
        error: 'Failed to verify Google token',
      };
    }
  },

 
};
