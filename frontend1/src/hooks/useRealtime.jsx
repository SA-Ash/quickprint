import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';
import { wsService, WS_EVENTS } from '../services/websocket.service';

/**
 * Hook for managing real-time WebSocket connection and events
 * Auto-connects when user is authenticated, disconnects on logout
 */
export const useRealtime = () => {
  const { user, isAuthenticated } = useAuth();
  const subscriptionsRef = useRef([]);

  // Connect/disconnect based on auth state
  useEffect(() => {
    if (isAuthenticated) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        wsService.connect(token);
      }
    } else {
      wsService.disconnect();
    }

    return () => {
      // Cleanup subscriptions on unmount
      subscriptionsRef.current.forEach((unsub) => unsub());
      subscriptionsRef.current = [];
    };
  }, [isAuthenticated]);

  /**
   * Subscribe to order-related events
   */
  const subscribeToOrders = useCallback((callbacks) => {
    const unsubs = [];

    if (callbacks.onOrderCreated) {
      unsubs.push(wsService.subscribe(WS_EVENTS.ORDER_CREATED, callbacks.onOrderCreated));
    }
    if (callbacks.onOrderStatusChanged) {
      unsubs.push(wsService.subscribe(WS_EVENTS.ORDER_STATUS_CHANGED, callbacks.onOrderStatusChanged));
    }
    if (callbacks.onOrderUpdated) {
      unsubs.push(wsService.subscribe(WS_EVENTS.ORDER_UPDATED, callbacks.onOrderUpdated));
    }

    subscriptionsRef.current.push(...unsubs);

    return () => unsubs.forEach((unsub) => unsub());
  }, []);

  /**
   * Subscribe to notification events
   */
  const subscribeToNotifications = useCallback((callback) => {
    const unsub = wsService.subscribe(WS_EVENTS.NOTIFICATION_NEW, callback);
    subscriptionsRef.current.push(unsub);
    return unsub;
  }, []);

  /**
   * Subscribe to payment events
   */
  const subscribeToPayments = useCallback((callbacks) => {
    const unsubs = [];

    if (callbacks.onPaymentCompleted) {
      unsubs.push(wsService.subscribe(WS_EVENTS.PAYMENT_COMPLETED, callbacks.onPaymentCompleted));
    }
    if (callbacks.onPaymentFailed) {
      unsubs.push(wsService.subscribe(WS_EVENTS.PAYMENT_FAILED, callbacks.onPaymentFailed));
    }

    subscriptionsRef.current.push(...unsubs);

    return () => unsubs.forEach((unsub) => unsub());
  }, []);

  return {
    isConnected: wsService.getConnectionStatus(),
    subscribeToOrders,
    subscribeToNotifications,
    subscribeToPayments,
  };
};

export default useRealtime;
