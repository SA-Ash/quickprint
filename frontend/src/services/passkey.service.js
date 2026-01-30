/**
 * Passkey Service
 * Frontend WebAuthn integration using @simplewebauthn/browser
 */

import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import apiClient from './api';

export const passkeyService = {
    /**
     * Check if WebAuthn is supported
     */
    isSupported() {
        return !!(navigator.credentials && window.PublicKeyCredential);
    },

    /**
     * Register a new passkey (requires user to be logged in)
     */
    async register() {
        // 1. Get registration options from server
        const options = await apiClient.post('/auth/passkey/register/options', {});

        // 2. Create credential with browser
        const credential = await startRegistration({ optionsJSON: options });

        // 3. Verify with server
        const result = await apiClient.post('/auth/passkey/register/verify', credential);

        return result;
    },

    /**
     * Login with passkey
     * @param {string} phone - Optional phone number to narrow down credentials
     */
    async login(phone) {
        // 1. Get authentication options from server
        const options = await apiClient.post('/auth/passkey/login/options', { phone }, { auth: false });

        // 2. Authenticate with browser
        const credential = await startAuthentication({ optionsJSON: options });

        // 3. Verify with server and get tokens
        const result = await apiClient.post(
            '/auth/passkey/login/verify',
            { response: credential, userId: options.userId },
            { auth: false }
        );

        // 4. Store tokens
        if (result.accessToken) {
            apiClient.setTokens(result.accessToken, result.refreshToken);
            localStorage.setItem('user', JSON.stringify(result.user));
        }

        return result;
    },

    /**
     * List all passkeys for current user
     */
    async list() {
        const result = await apiClient.get('/auth/passkey/list');
        return result.passkeys;
    },

    /**
     * Delete a passkey
     */
    async delete(passkeyId) {
        return apiClient.delete(`/auth/passkey/${passkeyId}`);
    },
};

export default passkeyService;
