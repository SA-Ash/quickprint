/**
 * WebSocket Service
 * Real-time communication with backend using Socket.io
 * Features: Heartbeat, Auto-reconnect, Token refresh
 */

import { io } from 'socket.io-client';

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
    maxReconnectAttempts = 10;
    heartbeatInterval = null;
    healthCheckInterval = null;
    currentToken = null;
    getToken = null; // Function to get fresh token

    /**
     * Connect to WebSocket server
     * @param {string} token - JWT access token
     * @param {function} getTokenFn - Function to get fresh token (for reconnect)
     */
    connect(token, getTokenFn = null) {
        if (this.socket?.connected) {
            console.log('[WS] Already connected');
            return;
        }

        this.currentToken = token;
        if (getTokenFn) {
            this.getToken = getTokenFn;
        }

        this.socket = io(WS_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: this.maxReconnectAttempts,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 10000,
            timeout: 20000,
            forceNew: true,
        });

        this.socket.on('connect', () => {
            console.log('[WS] Connected to server');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.startHeartbeat();
            this.startHealthCheck();
        });

        this.socket.on('disconnect', (reason) => {
            console.log('[WS] Disconnected:', reason);
            this.isConnected = false;
            this.stopHeartbeat();
            this.stopHealthCheck();

            // Handle specific disconnect reasons
            if (reason === 'io server disconnect' || reason === 'transport error') {
                // Server disconnected us, try to reconnect with fresh token
                this.reconnectWithFreshToken();
            }
        });

        this.socket.on('connect_error', async (error) => {
            console.error('[WS] Connection error:', error.message);
            this.reconnectAttempts++;

            // If auth error, try with fresh token
            if (error.message.includes('Authentication') || error.message.includes('token')) {
                await this.reconnectWithFreshToken();
            }
        });

        // Heartbeat response from server
        this.socket.on('pong', () => {
            // Server is alive
        });

        // Re-attach all listeners
        this.listeners.forEach((callbacks, event) => {
            callbacks.forEach((callback) => {
                this.socket.on(event, callback);
            });
        });
    }

    /**
     * Start heartbeat to keep connection alive
     */
    startHeartbeat() {
        this.stopHeartbeat();
        this.heartbeatInterval = setInterval(() => {
            if (this.socket?.connected) {
                this.socket.emit('ping');
            }
        }, 25000); // Send ping every 25 seconds
    }

    /**
     * Stop heartbeat
     */
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    /**
     * Start health check to detect stale connections
     */
    startHealthCheck() {
        this.stopHealthCheck();
        this.healthCheckInterval = setInterval(() => {
            if (!this.socket?.connected && this.currentToken) {
                console.log('[WS] Health check: reconnecting...');
                this.reconnect();
            }
        }, 30000); // Check every 30 seconds
    }

    /**
     * Stop health check
     */
    stopHealthCheck() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
    }

    /**
     * Reconnect with fresh token
     */
    async reconnectWithFreshToken() {
        if (this.getToken) {
            try {
                const freshToken = await this.getToken();
                if (freshToken && freshToken !== this.currentToken) {
                    console.log('[WS] Reconnecting with fresh token');
                    this.disconnect();
                    setTimeout(() => {
                        this.connect(freshToken, this.getToken);
                    }, 1000);
                }
            } catch (error) {
                console.error('[WS] Failed to get fresh token:', error);
            }
        }
    }

    /**
     * Reconnect with current token
     */
    reconnect() {
        if (this.currentToken && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.disconnect();
            setTimeout(() => {
                this.connect(this.currentToken, this.getToken);
            }, Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000)); // Exponential backoff
            this.reconnectAttempts++;
        }
    }

    /**
     * Update the auth token (called when token is refreshed)
     */
    updateToken(newToken) {
        this.currentToken = newToken;
        if (this.socket?.connected) {
            // Reconnect with new token to update auth
            this.disconnect();
            setTimeout(() => {
                this.connect(newToken, this.getToken);
            }, 500);
        }
    }

    /**
     * Disconnect from WebSocket server
     */
    disconnect() {
        this.stopHeartbeat();
        this.stopHealthCheck();
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

    /**
     * Get socket instance (for advanced usage)
     */
    getSocket() {
        return this.socket;
    }
}

// Export singleton instance
export const wsService = new WebSocketService();
export default wsService;
