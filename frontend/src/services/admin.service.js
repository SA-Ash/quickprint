/**
 * Admin Analytics Service
 * Fetches platform-wide analytics data for admin dashboard
 */
import apiClient from './api';

const adminService = {
    /**
     * Get dashboard summary metrics (Total Revenue, Orders, Partners, Users, etc.)
     */
    async getDashboardSummary() {
        const response = await apiClient.get('/admin/dashboard');
        return response;
    },

    /**
     * Get revenue trends for chart (last 6 months)
     */
    async getRevenueTrends() {
        const response = await apiClient.get('/admin/revenue-trends');
        return response;
    },

    /**
     * Get order analytics by status
     */
    async getOrderAnalytics() {
        const response = await apiClient.get('/admin/order-analytics');
        return response;
    },

    /**
     * Get recent platform activity
     */
    async getRecentActivity() {
        const response = await apiClient.get('/admin/recent-activity');
        return response;
    },

    /**
     * Get partner statistics
     */
    async getPartnerStats() {
        const response = await apiClient.get('/admin/partner-stats');
        return response;
    },
};

export default adminService;
