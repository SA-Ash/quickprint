import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { useAuth } from "./useAuth.jsx";
import { orderService } from "../services/order.service";
import { wsService, WS_EVENTS } from "../services/websocket.service";

const OrdersContext = createContext();

// Check if we should use mock mode (for development without backend)
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export const OrdersProvider = ({ children }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const loadOrders = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      if (USE_MOCK) {
        // Load from localStorage in mock mode
        const storedOrders = localStorage.getItem(`orders_${user.id}`);
        if (storedOrders) {
          const parsedOrders = JSON.parse(storedOrders).map((order) => ({
            ...order,
            createdAt: new Date(order.createdAt),
            updatedAt: new Date(order.updatedAt),
          }));
          setOrders(parsedOrders);
        } else {
          // Mock orders if no stored orders
          const mockOrders = getMockOrders(user);
          setOrders(mockOrders);
          localStorage.setItem(`orders_${user.id}`, JSON.stringify(mockOrders));
        }
      } else {
        // Real API call
        const response = await orderService.getUserOrders();
        const ordersData = response.orders || response.data || response;
        
        const parsedOrders = Array.isArray(ordersData) ? ordersData.map((order) => ({
          ...order,
          createdAt: new Date(order.createdAt),
          updatedAt: new Date(order.updatedAt),
        })) : [];
        
        setOrders(parsedOrders);
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async (orderData) => {
    try {
      setLoading(true);
      setError(null);

      if (USE_MOCK) {
        return createMockOrder(orderData);
      }

      // Real API call
      const response = await orderService.createOrder({
        shopId: orderData.shopId,
        file: {
          url: orderData.fileUrl || '',
          name: orderData.fileName || 'Document.pdf',
          pages: orderData.printConfig?.pages || 1,
        },
        printConfig: {
          pages: orderData.printConfig?.pages || 1,
          color: orderData.printConfig?.color || false,
          copies: orderData.printConfig?.copies || 1,
          binding: orderData.printConfig?.binding || 'NONE',
          sides: orderData.printConfig?.doubleSided ? 'DOUBLE' : 'SINGLE',
        },
        totalCost: orderData.totalCost || 0,
      });

      const newOrder = response.order || response;
      
      // Add to local state
      setOrders((prevOrders) => [
        {
          ...newOrder,
          createdAt: new Date(newOrder.createdAt),
          updatedAt: new Date(newOrder.updatedAt),
        },
        ...prevOrders,
      ]);

      // Add notification
      addNotification({
        id: `notif_${Date.now()}`,
        type: "order_created",
        title: "Order Placed Successfully",
        message: `Your order ${newOrder.orderNumber} has been placed`,
        timestamp: new Date(),
        read: false,
        orderId: newOrder.id,
      });

      return newOrder;
    } catch (err) {
      console.error("Failed to create order:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createMockOrder = async (orderData) => {
    const newOrder = {
      id: `order_${Date.now()}`,
      orderNumber: `QP-2024-${String(orders.length + 1).padStart(3, "0")}`,
      fileName: orderData.fileName || "Document.pdf",
      shopName: orderData.shopName || "Selected Shop",
      shopId: orderData.shopId,
      status: "PENDING",
      pages: orderData.printConfig?.pages || 1,
      color: orderData.printConfig?.color || false,
      doubleSided: orderData.printConfig?.doubleSided || false,
      copies: orderData.printConfig?.copies || 1,
      binding: orderData.printConfig?.binding || "No Binding",
      totalCost: orderData.totalCost || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      college: user.college || "CBIT",
      fileUrl: orderData.fileUrl || "",
      userId: user.id,
    };

    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    localStorage.setItem(`orders_${user.id}`, JSON.stringify(updatedOrders));

    addNotification({
      id: `notif_${Date.now()}`,
      type: "order_created",
      title: "Order Placed Successfully",
      message: `Your order ${newOrder.orderNumber} has been placed at ${newOrder.shopName}`,
      timestamp: new Date(),
      read: false,
      orderId: newOrder.id,
    });

    return newOrder;
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setError(null);

      if (USE_MOCK) {
        updateMockOrderStatus(orderId, newStatus);
        return;
      }

      // Real API call
      await orderService.updateOrderStatus(orderId, newStatus);

      // Update local state
      const updatedOrders = orders.map((order) => {
        if (order.id === orderId) {
          return {
            ...order,
            status: newStatus,
            updatedAt: new Date(),
          };
        }
        return order;
      });

      setOrders(updatedOrders);

      addNotification({
        id: `notif_${Date.now()}`,
        type: "status_update",
        title: `Order Status Updated`,
        message: `Order status has been updated to ${newStatus}`,
        timestamp: new Date(),
        read: false,
        orderId: orderId,
      });
    } catch (err) {
      console.error("Failed to update order status:", err);
      setError(err.message);
      throw err;
    }
  };

  const updateMockOrderStatus = (orderId, newStatus) => {
    const statusMap = {
      PENDING: "Pending",
      ACCEPTED: "Accepted",
      PRINTING: "Printing",
      READY: "Ready",
      COMPLETED: "Completed",
      CANCELLED: "Cancelled",
    };

    const updatedOrders = orders.map((order) => {
      if (order.id === orderId) {
        return {
          ...order,
          status: newStatus,
          statusText: statusMap[newStatus] || newStatus,
          updatedAt: new Date(),
        };
      }
      return order;
    });

    setOrders(updatedOrders);
    localStorage.setItem(`orders_${user.id}`, JSON.stringify(updatedOrders));

    addNotification({
      id: `notif_${Date.now()}`,
      type: "status_update",
      title: `Order Status Updated`,
      message: `Your order status has been updated to ${statusMap[newStatus]}`,
      timestamp: new Date(),
      read: false,
      orderId: orderId,
    });
  };

  const addNotification = (notification) => {
    const updatedNotifications = [notification, ...notifications];
    setNotifications(updatedNotifications);

    if (user) {
      localStorage.setItem(
        `notifications_${user.id}`,
        JSON.stringify(updatedNotifications)
      );
    }
  };

  const markNotificationRead = (notificationId) => {
    const updatedNotifications = notifications.map((notif) =>
      notif.id === notificationId ? { ...notif, read: true } : notif
    );
    setNotifications(updatedNotifications);
    if (user) {
      localStorage.setItem(
        `notifications_${user.id}`,
        JSON.stringify(updatedNotifications)
      );
    }
  };

  const markAllNotificationsRead = () => {
    const updatedNotifications = notifications.map((notif) => ({
      ...notif,
      read: true,
    }));
    setNotifications(updatedNotifications);
    if (user) {
      localStorage.setItem(
        `notifications_${user.id}`,
        JSON.stringify(updatedNotifications)
      );
    }
  };

  const getUnreadCount = () => {
    return notifications.filter((notif) => !notif.read).length;
  };

  useEffect(() => {
    if (user) {
      loadOrders();
      loadNotifications();

      // Subscribe to real-time WebSocket events (only when not in mock mode)
      if (!USE_MOCK) {
        const token = localStorage.getItem('accessToken');
        if (token) {
          wsService.connect(token);

          // Listen for order status changes
          const handleStatusChange = (data) => {
            setOrders((prevOrders) =>
              prevOrders.map((order) =>
                order.id === data.orderId
                  ? { ...order, status: data.newStatus, updatedAt: new Date(data.updatedAt) }
                  : order
              )
            );

            // Add notification for status change
            addNotification({
              id: `notif_${Date.now()}`,
              type: "status_update",
              title: `Order ${data.orderNumber} Updated`,
              message: `Your order status changed to ${data.newStatus}`,
              timestamp: new Date(),
              read: false,
              orderId: data.orderId,
            });
          };

          wsService.subscribe(WS_EVENTS.ORDER_STATUS_CHANGED, handleStatusChange);

          // Cleanup on unmount
          return () => {
            wsService.unsubscribe(WS_EVENTS.ORDER_STATUS_CHANGED, handleStatusChange);
          };
        }
      }
    } else {
      setOrders([]);
      setNotifications([]);
    }
  }, [user]);

  const loadNotifications = () => {
    if (!user) return;
    const storedNotifications = localStorage.getItem(
      `notifications_${user.id}`
    );
    if (storedNotifications) {
      const parsedNotifications = JSON.parse(storedNotifications).map(
        (notif) => ({
          ...notif,
          timestamp: new Date(notif.timestamp),
        })
      );
      setNotifications(parsedNotifications);
    }
  };

  const value = {
    orders,
    notifications,
    loading,
    error,
    createOrder,
    updateOrderStatus,
    loadOrders,
    markNotificationRead,
    markAllNotificationsRead,
    getUnreadCount,
  };

  return (
    <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>
  );
};

// Helper function for mock orders
function getMockOrders(user) {
  return [
    {
      id: "order_1",
      orderNumber: "QP-2024-001",
      fileName: "Assignment_Chapter_3.pdf",
      shopName: "QuickPrint Hub - CBIT",
      status: "PENDING",
      pages: 12,
      color: false,
      doubleSided: false,
      copies: 1,
      binding: "Stapled",
      totalCost: 45,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      college: user.college || "CBIT",
      fileUrl: "",
    },
    {
      id: "order_2",
      orderNumber: "QP-2024-002",
      fileName: "Research_Paper_Final.pdf",
      shopName: "Print Express - JNTU",
      status: "ACCEPTED",
      pages: 25,
      color: true,
      doubleSided: true,
      copies: 1,
      binding: "Spiral Bound",
      totalCost: 120,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      college: user.college || "CBIT",
      fileUrl: "",
    },
  ];
}

export const useOrders = () => {
  const context = useContext(OrdersContext);
  if (!context) {
    throw new Error("useOrders must be used within an OrdersProvider");
  }
  return context;
};
