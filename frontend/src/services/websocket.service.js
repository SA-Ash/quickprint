/**
 * WebSocket Service
 * Real-time communication with backend using Socket.io
 */

import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Event types matching backend
export const WS_EVENTS = {
    // Order events
    ORDER_CREATED: 'order:created',
    ORDER_UPDATED: 'order:updated',
    ORDER_STATUS_CHANGED: 'order:statusChanged',

    // Notification events
    NOTIFICATION_NEW: 'notification:new',

    // Shop events
    SHOP_STATUS_CHANGED: 'shop:statusChanged',

    // Payment events
    PAYMENT_COMPLETED: 'payment:completed',
    PAYMENT_FAILED: 'payment:failed',
};

class WebSocketService {
    socket = null;
    listeners = new Map();
    isConnected = false;
    reconnectAttempts = 0;
    maxReconnectAttempts = 5;

    /**
     * Connect to WebSocket server
     * @param {string} token - JWT access token
     */
    connect(token) {
        if (this.socket?.connected) {
            console.log('[WS] Already connected');
            return;
        }

        this.socket = io(WS_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: this.maxReconnectAttempts,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        });

        this.socket.on('connect', () => {
            console.log('[WS] Connected to server');
            this.isConnected = true;
            this.reconnectAttempts = 0;
        });

        this.socket.on('disconnect', (reason) => {
            console.log('[WS] Disconnected:', reason);
            this.isConnected = false;
        });

        this.socket.on('connect_error', (error) => {
            console.error('[WS] Connection error:', error.message);
            this.reconnectAttempts++;
        });

        // Re-attach all listeners
        this.listeners.forEach((callbacks, event) => {
            callbacks.forEach((callback) => {
                this.socket.on(event, callback);
            });
        });
    }

    /**
     * Disconnect from WebSocket server
     */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
        }
    }

    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {function} callback - Event handler
     */
    subscribe(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);

        // If already connected, attach listener immediately
        if (this.socket) {
            this.socket.on(event, callback);
        }

        // Return unsubscribe function
        return () => this.unsubscribe(event, callback);
    }

    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {function} callback - Event handler to remove
     */
    unsubscribe(event, callback) {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.delete(callback);
            if (callbacks.size === 0) {
                this.listeners.delete(event);
            }
        }

        if (this.socket) {
            this.socket.off(event, callback);
        }
    }

    /**
     * Emit an event to the server
     * @param {string} event - Event name
     * @param {any} data - Data to send
     */
    emit(event, data) {
        if (this.socket?.connected) {
            this.socket.emit(event, data);
        } else {
            console.warn('[WS] Cannot emit, not connected');
        }
    }

    /**
     * Check if connected
     */
    getConnectionStatus() {
        return this.isConnected;
    }
}

// Export singleton instance
export const wsService = new WebSocketService();
export default wsService;
