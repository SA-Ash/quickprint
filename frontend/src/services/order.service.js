/**
 * Order Service
 * Handles all order-related API calls
 */

import apiClient from './api';

export const orderService = {
    /**
     * Create a new order
     * @param {object} orderData - Order creation data
     */
    async createOrder(orderData) {
        return apiClient.post('/orders', orderData);
    },

    /**
     * Get all orders for current user (student)
     */
    async getUserOrders() {
        return apiClient.get('/orders');
    },

    /**
     * Get all orders for current shop (partner)
     */
    async getShopOrders() {
        return apiClient.get('/orders/shop');
    },

    /**
     * Get order by ID
     * @param {string} orderId - Order ID
     */
    async getOrderById(orderId) {
        return apiClient.get(`/orders/${orderId}`);
    },

    /**
     * Update order status
     * @param {string} orderId - Order ID
     * @param {string} status - New status (PENDING, ACCEPTED, PRINTING, READY, COMPLETED, CANCELLED)
     */
    async updateOrderStatus(orderId, status) {
        return apiClient.patch(`/orders/${orderId}/status`, { status });
    },

    /**
     * Upload file for order
     * @param {File} file - File to upload
     */
    async uploadFile(file) {
        return apiClient.uploadFile('/orders/upload', file);
    },
};

export default orderService;
