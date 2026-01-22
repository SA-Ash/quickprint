/**
 * Payment Service
 * Handles all payment-related API calls
 */

import apiClient from './api';

export const paymentService = {
    /**
     * Initiate a payment for an order
     * @param {string} orderId - Order ID
     * @param {string} provider - Payment provider (razorpay, cashfree)
     */
    async initiatePayment(orderId, provider = 'razorpay') {
        return apiClient.post('/payments/initiate', { orderId, provider });
    },

    /**
     * Get payment status
     * @param {string} paymentId - Payment ID
     */
    async getPaymentStatus(paymentId) {
        return apiClient.get(`/payments/${paymentId}/status`);
    },

    /**
     * Verify payment (after gateway callback)
     * @param {object} paymentData - Payment verification data
     */
    async verifyPayment(paymentData) {
        return apiClient.post('/payments/verify', paymentData);
    },
};

export default paymentService;
