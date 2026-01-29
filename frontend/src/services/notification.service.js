/**
 * Notification Service
 * Handles all notification-related API calls
 */

import apiClient from './api';

export const notificationService = {
    /**
     * Get all notifications for current user
     */
    async getNotifications() {
        return apiClient.get('/notifications');
    },

    /**
     * Mark a notification as read
     * @param {string} notificationId - Notification ID
     */
    async markAsRead(notificationId) {
        return apiClient.patch(`/notifications/${notificationId}/read`);
    },

    /**
     * Mark all notifications as read
     */
    async markAllAsRead() {
        return apiClient.patch('/notifications/read-all');
    },

    /**
     * Delete a notification
     * @param {string} notificationId - Notification ID
     */
    async deleteNotification(notificationId) {
        return apiClient.delete(`/notifications/${notificationId}`);
    },

    /**
     * Clear all notifications
     */
    async clearAllNotifications() {
        return apiClient.delete('/notifications');
    },
};

export default notificationService;
