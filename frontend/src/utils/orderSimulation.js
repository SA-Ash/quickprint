

export const simulateOrderStatusUpdates = (updateOrderStatus) => {

  const statusSequence = ['pending', 'accepted', 'printing', 'completed'];

  const simulateStatusChange = () => {

    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    if (orders.length === 0) return;

    const pendingOrders = orders.filter(order =>
      order.status !== 'completed' && order.status !== 'cancelled'
    );

    if (pendingOrders.length === 0) return;

    const randomOrder = pendingOrders[Math.floor(Math.random() * pendingOrders.length)];
    const currentStatusIndex = statusSequence.indexOf(randomOrder.status);

    if (currentStatusIndex < statusSequence.length - 1) {
      const nextStatus = statusSequence[currentStatusIndex + 1];
      updateOrderStatus(randomOrder.id, nextStatus);
    }
  };

  const interval = setInterval(simulateStatusChange, 30000);

  return () => clearInterval(interval);
};

export const createMockOrderStatusUpdate = (orderId, newStatus) => {
  const statusMessages = {
    'pending': 'Your order has been received and is being reviewed',
    'accepted': 'Your order has been accepted and is being prepared',
    'printing': 'Your order is currently being printed',
    'completed': 'Your order is ready for pickup!',
    'cancelled': 'Your order has been cancelled'
  };

  return {
    id: `notif_${Date.now()}`,
    type: 'status_update',
    title: `Order Status Updated`,
    message: statusMessages[newStatus] || 'Your order status has been updated',
    timestamp: new Date(),
    read: false,
    orderId: orderId
  };
};
