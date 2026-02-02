import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { useAuth } from "./useAuth.jsx";
import { orderService } from "../services/order.service";
import { notificationService } from "../services/notification.service";
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

  // Helper to get status text
  const getStatusText = (status) => {
    const statusMap = {
      PENDING: "Pending",
      ACCEPTED: "Accepted",
      PRINTING: "Printing",
      READY: "Ready",
      COMPLETED: "Completed",
      CANCELLED: "Cancelled",
    };
    return statusMap[(status || "").toUpperCase()] || status || "Pending";
  };

  // Helper to map API order to component-friendly format
  const mapOrderFromAPI = (order) => ({
    ...order,
    id: order.id,
    orderNumber: order.orderNumber,
    fileName: order.file?.name || order.fileName || "Document",
    shopName: order.shop?.businessName || order.shopName || "Print Shop",
    shopId: order.shopId,
    status: (order.status || "PENDING").toLowerCase(),
    statusText: getStatusText(order.status),
    pages: order.file?.pages || order.pages || 1,
    color: order.printConfig?.color || order.color || false,
    doubleSided: order.printConfig?.sides === "double" || order.doubleSided || false,
    copies: order.printConfig?.copies || order.copies || 1,
    binding: order.printConfig?.binding ? "Bound" : "No Binding",
    totalCost: parseFloat(order.totalCost) || 0,
    paymentMethod: order.paymentMethod || "cod",
    createdAt: new Date(order.createdAt),
    updatedAt: new Date(order.updatedAt),
    file: order.file,
    shop: order.shop,
    printConfig: order.printConfig,
  });

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

        // Map each order to component-friendly format
        const parsedOrders = Array.isArray(ordersData) ? ordersData.map(mapOrderFromAPI) : [];

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

      // Real API call - include paymentMethod
      // Ensure file data is properly structured
      const fileData = orderData.file || {};
      if (!fileData.url) {
        throw new Error('File URL is required. Please upload a file first.');
      }
      
      const response = await orderService.createOrder({
        shopId: orderData.shopId,
        file: {
          url: fileData.url,
          name: fileData.name || 'Document.pdf',
          pages: fileData.pages || 1,
          fileId: fileData.fileId, // Include file ID for database tracking
        },
        printConfig: {
          pages: 'all',
          color: orderData.printConfig?.color || false,
          copies: orderData.printConfig?.copies || 1,
          binding: orderData.printConfig?.binding === true || (orderData.printConfig?.binding !== 'No Binding' && orderData.printConfig?.binding !== false),
          sides: orderData.printConfig?.sides || (orderData.printConfig?.doubleSided ? 'double' : 'single'),
        },
        totalCost: orderData.totalCost, // Include total cost with fees
        paymentMethod: orderData.paymentMethod || 'cod',
      });

      const newOrder = response.order || response;
      const mappedOrder = mapOrderFromAPI(newOrder);

      // Add to local state
      setOrders((prevOrders) => [mappedOrder, ...prevOrders]);

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

      return mappedOrder;
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
    if (USE_MOCK) {
      localStorage.setItem(`orders_${user.id}`, JSON.stringify(updatedOrders));
    }

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

    // Only persist to localStorage in mock mode
    if (USE_MOCK && user) {
      localStorage.setItem(
        `notifications_${user.id}`,
        JSON.stringify(updatedNotifications)
      );
    }
  };

  const markNotificationRead = async (notificationId) => {
    try {
      if (!USE_MOCK) {
        await notificationService.markAsRead(notificationId);
      }
      const updatedNotifications = notifications.map((notif) =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      );
      setNotifications(updatedNotifications);
      if (USE_MOCK && user) {
        localStorage.setItem(
          `notifications_${user.id}`,
          JSON.stringify(updatedNotifications)
        );
      }
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      // Update local state first for immediate UI feedback
      const updatedNotifications = notifications.map((notif) => ({
        ...notif,
        read: true,
      }));
      setNotifications(updatedNotifications);
      
      if (USE_MOCK && user) {
        localStorage.setItem(
          `notifications_${user.id}`,
          JSON.stringify(updatedNotifications)
        );
      }
      
      // Then try to sync with backend (don't wait or fail silently)
      if (!USE_MOCK) {
        notificationService.markAllAsRead().catch(err => {
          console.warn("Failed to sync mark all as read with backend:", err);
        });
      }
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  const clearAllNotifications = async () => {
    try {
      if (!USE_MOCK) {
        await notificationService.clearAllNotifications();
      }
      setNotifications([]);
      if (USE_MOCK && user) {
        localStorage.removeItem(`notifications_${user.id}`);
      }
    } catch (err) {
      console.error("Failed to clear notifications:", err);
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
      // Note: WebSocket connection is handled by useAuth, we just subscribe to events here
      if (!USE_MOCK) {
        // Listen for order status changes
        const handleStatusChange = (data) => {
          console.log('[WS] Student: Order status changed:', data);
          const normalizedStatus = (data.newStatus || data.status || "").toUpperCase();
          setOrders((prevOrders) =>
            prevOrders.map((order) =>
              order.id === data.orderId
                ? { ...order, status: normalizedStatus, updatedAt: new Date(data.updatedAt || Date.now()) }
                : order
            )
          );

          // Add notification for status change
          const statusLabels = {
            PENDING: 'Pending',
            ACCEPTED: 'Accepted',
            PRINTING: 'Printing',
            READY: 'Ready for Pickup',
            COMPLETED: 'Completed',
            CANCELLED: 'Cancelled'
          };
          
          const notification = {
            id: `notif_${Date.now()}`,
            type: 'order_updated',
            title: 'Order Status Update',
            message: `Your order is now ${statusLabels[normalizedStatus] || normalizedStatus}`,
            timestamp: new Date(),
            read: false,
            orderId: data.orderId
          };
          setNotifications((prev) => [notification, ...prev]);
        };

        // Listen for new notifications from backend
        const handleNewNotification = (data) => {
          setNotifications((prevNotifications) => [
            {
              ...data,
              timestamp: new Date(data.createdAt || data.timestamp || Date.now()),
            },
            ...prevNotifications,
          ]);
        };

        const unsubStatus = wsService.subscribe(WS_EVENTS.ORDER_STATUS_CHANGED, handleStatusChange);
        const unsubNotif = wsService.subscribe(WS_EVENTS.NOTIFICATION_NEW, handleNewNotification);

        // Cleanup on unmount
        return () => {
          unsubStatus();
          unsubNotif();
        };
      }
    } else {
      setOrders([]);
      setNotifications([]);
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;
    
    try {
      if (USE_MOCK) {
        // Load from localStorage in mock mode
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
      } else {
        // Real API call
        const response = await notificationService.getNotifications();
        const notificationsData = response.notifications || response.data || response;
        const parsedNotifications = Array.isArray(notificationsData) 
          ? notificationsData.map((notif) => ({
              ...notif,
              timestamp: new Date(notif.createdAt),
            }))
          : [];
        setNotifications(parsedNotifications);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
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
    clearAllNotifications,
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
