/**
 * Analytics Service
 * Handles API calls for shop analytics
 */

import apiClient from './api';

export const analyticsService = {
    /**
     * Get analytics summary for shop dashboard
     */
    async getSummary() {
        return apiClient.get('/analytics/summary');
    },

    /**
     * Get revenue trends for charts
     */
    async getRevenueTrends() {
        return apiClient.get('/analytics/trends');
    },

    /**
     * Get popular services data
     */
    async getPopularServices() {
        return apiClient.get('/analytics/services');
    },
};

export default analyticsService;
