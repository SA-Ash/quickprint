/**
 * Shop Service
 * Handles all shop-related API calls
 */

import apiClient from './api';

export const shopService = {
    /**
     * Get nearby shops based on location
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @param {number} radius - Search radius in meters (default: 5000)
     */
    async getNearbyShops(lat, lng, radius = 5000) {
        return apiClient.get(`/shops/nearby?lat=${lat}&lng=${lng}&radius=${radius}`, { auth: false });
    },

    /**
     * Get all active shops
     */
    async getAllShops() {
        return apiClient.get('/shops/all', { auth: false });
    },

    /**
     * Get shop by ID
     * @param {string} shopId - Shop ID
     */
    async getShopById(shopId) {
        return apiClient.get(`/shops/${shopId}`, { auth: false });
    },

    /**
     * Get current partner's shop
     */
    async getMyShop() {
        return apiClient.get('/shops/me');
    },

    /**
     * Update shop details
     * @param {string} shopId - Shop ID
     * @param {object} data - Shop update data
     */
    async updateShop(shopId, data) {
        return apiClient.put(`/shops/${shopId}`, data);
    },

    /**
     * Update shop pricing
     * @param {string} shopId - Shop ID
     * @param {object} pricing - Pricing data
     */
    async updatePricing(shopId, pricing) {
        return apiClient.put(`/shops/${shopId}/pricing`, { pricing });
    },

    /**
     * Toggle shop active status
     * @param {string} shopId - Shop ID
     * @param {boolean} isActive - Active status
     */
    async toggleActive(shopId, isActive) {
        return apiClient.patch(`/shops/${shopId}/status`, { isActive });
    },
};

export default shopService;
