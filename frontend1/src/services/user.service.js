/**
 * User Service
 * Handles all user-related API calls
 */

import apiClient from './api';

export const userService = {
    /**
     * Get current user profile
     */
    async getProfile() {
        return apiClient.get('/users/me');
    },

    /**
     * Update current user profile
     * @param {object} data - Profile update data
     */
    async updateProfile(data) {
        return apiClient.put('/users/me', data);
    },
};

export default userService;
