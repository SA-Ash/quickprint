import { useState, useEffect, createContext, useContext } from "react";
import { useAuth } from "./useAuth.jsx";
import { orderService } from "../services/order.service";
import { wsService, WS_EVENTS } from "../services/websocket.service";

const PartnerOrdersContext = createContext();

// Check if we should use mock mode (for development without backend)
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export const PartnerOrdersProvider = ({ children }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadOrders = async () => {
    if (!user || user.role !== "SHOP") return;

    try {
      setLoading(true);
      setError(null);

      if (USE_MOCK) {
        const partnerOrders = getMockPartnerOrders(user);
        setOrders(partnerOrders);

        const storedNotifications = localStorage.getItem(`partner_notifications_${user.email || user.id}`);
        if (storedNotifications) {
          setNotifications(JSON.parse(storedNotifications).map(n => ({ 
            ...n, 
            timestamp: new Date(n.timestamp) 
          })));
        }
      } else {
        // Real API call - get shop orders
        const response = await orderService.getShopOrders();
        const ordersData = response.orders || response.data || response;
        
        const parsedOrders = Array.isArray(ordersData) ? ordersData.map((order) => ({
          ...order,
          createdAt: new Date(order.createdAt),
          updatedAt: new Date(order.updatedAt),
        })) : [];
        
        setOrders(parsedOrders);
      }
    } catch (err) {
      console.error("Failed to load partner orders:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
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

      const notification = {
        id: `notif_${Date.now()}`,
        type: "order_updated",
        title: `Order Updated`,
        message: `Order status updated to ${statusMap[newStatus]}`,
        timestamp: new Date(),
        read: false,
        orderId: orderId,
      };

      const updatedNotifications = [notification, ...notifications];
      setNotifications(updatedNotifications);
      localStorage.setItem(
        `partner_notifications_${user.email || user.id}`, 
        JSON.stringify(updatedNotifications)
      );
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
    localStorage.setItem(`partner_orders_${user.email || user.id}`, JSON.stringify(updatedOrders));

    const notification = {
      id: `notif_${Date.now()}`,
      type: "order_updated",
      title: `Order Updated`,
      message: `You updated order status to ${statusMap[newStatus]}`,
      timestamp: new Date(),
      read: false,
      orderId: orderId,
    };

    const updatedNotifications = [notification, ...notifications];
    setNotifications(updatedNotifications);
    localStorage.setItem(
      `partner_notifications_${user.email || user.id}`, 
      JSON.stringify(updatedNotifications)
    );
  };

  const markNotificationRead = (notificationId) => {
    const updatedNotifications = notifications.map((notif) =>
      notif.id === notificationId ? { ...notif, read: true } : notif
    );
    setNotifications(updatedNotifications);
    localStorage.setItem(
      `partner_notifications_${user.email || user.id}`,
      JSON.stringify(updatedNotifications)
    );
  };

  const markAllNotificationsRead = () => {
    const updatedNotifications = notifications.map((notif) => ({
      ...notif,
      read: true,
    }));
    setNotifications(updatedNotifications);
    localStorage.setItem(
      `partner_notifications_${user.email || user.id}`,
      JSON.stringify(updatedNotifications)
    );
  };

  const getUnreadCount = () => {
    return notifications.filter((notif) => !notif.read).length;
  };

  useEffect(() => {
    if (user && user.role === "SHOP") {
      loadOrders();

      // Subscribe to real-time WebSocket events (only when not in mock mode)
      if (!USE_MOCK) {
        const token = localStorage.getItem('accessToken');
        if (token) {
          wsService.connect(token);

          // Listen for new orders
          const handleNewOrder = (data) => {
            // Refresh orders when a new order comes in
            loadOrders();

            // Add notification for new order
            const notification = {
              id: `notif_${Date.now()}`,
              type: "order_created",
              title: "New Order Received!",
              message: `Order ${data.orderNumber} - ₹${data.totalCost}`,
              timestamp: new Date(),
              read: false,
              orderId: data.orderId,
            };

            setNotifications((prev) => [notification, ...prev]);
            localStorage.setItem(
              `partner_notifications_${user.email || user.id}`,
              JSON.stringify([notification, ...notifications])
            );
          };

          wsService.subscribe(WS_EVENTS.ORDER_CREATED, handleNewOrder);

          // Cleanup on unmount
          return () => {
            wsService.unsubscribe(WS_EVENTS.ORDER_CREATED, handleNewOrder);
          };
        }
      }
    } else {
      setOrders([]);
      setNotifications([]);
    }
  }, [user]);

  const value = {
    orders,
    notifications,
    loading,
    error,
    updateOrderStatus,
    loadOrders,
    markNotificationRead,
    markAllNotificationsRead,
    getUnreadCount,
  };

  return (
    <PartnerOrdersContext.Provider value={value}>
      {children}
    </PartnerOrdersContext.Provider>
  );
};

// Helper function for mock partner orders
function getMockPartnerOrders(user) {
  const stored = localStorage.getItem(`partner_orders_${user.email || user.id}`);
  if (stored) {
    return JSON.parse(stored).map(order => ({
      ...order,
      createdAt: new Date(order.createdAt),
      updatedAt: new Date(order.updatedAt),
    }));
  }

  return [
    {
      id: "partner_order_1",
      orderNumber: "QP-2024-P01",
      fileName: "Student_Assignment.pdf",
      shopName: "My Shop",
      status: "PENDING",
      pages: 10,
      color: false,
      doubleSided: false,
      copies: 2,
      binding: "No Binding",
      totalCost: 30,
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 30 * 60 * 1000),
      college: "CBIT",
      fileUrl: "",
      customer: { name: "Student User", phone: "9876543210", email: "student@cbit.ac.in" }
    },
    {
      id: "partner_order_2",
      orderNumber: "QP-2024-P02",
      fileName: "Project_Report.pdf",
      shopName: "My Shop",
      status: "ACCEPTED",
      pages: 45,
      color: true,
      doubleSided: true,
      copies: 1,
      binding: "Spiral Bound",
      totalCost: 180,
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      college: "CBIT",
      fileUrl: "",
      customer: { name: "Another Student", phone: "9876543211", email: "another@cbit.ac.in" }
    }
  ];
}

export const usePartnerOrders = () => {
  const context = useContext(PartnerOrdersContext);
  if (!context) {
    throw new Error(
      "usePartnerOrders must be used within a PartnerOrdersProvider"
    );
  }
  return context;
};
