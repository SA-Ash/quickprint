import React from 'react';
import { Users, Package, Printer, CheckCircle, Clock, XCircle } from 'lucide-react';
import { usePartnerOrders } from '../hooks/usePartnerOrders.jsx';

const StudentInteractions = () => {
  const { orders } = usePartnerOrders();

  // Get recent orders as "interactions"
  const recentOrders = orders.slice(0, 5);

  const getInteractionIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Package className="h-4 w-4 text-amber-600" />;
      case 'accepted':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'printing':
        return <Printer className="h-4 w-4 text-violet-600" />;
      case 'ready':
        return <CheckCircle className="h-4 w-4 text-teal-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-800';
      case 'accepted':
        return 'bg-blue-100 text-blue-800';
      case 'printing':
        return 'bg-violet-100 text-violet-800';
      case 'ready':
        return 'bg-teal-100 text-teal-800';
      case 'completed':
        return 'bg-emerald-100 text-emerald-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case 'pending':
        return 'New order waiting for acceptance';
      case 'accepted':
        return 'Order accepted, preparing to print';
      case 'printing':
        return 'Document is being printed';
      case 'ready':
        return 'Order ready for pickup';
      case 'completed':
        return 'Order completed successfully';
      case 'cancelled':
        return 'Order was cancelled';
      default:
        return 'Order status update';
    }
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const orderDate = new Date(date);
    const diffMs = now - orderDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const statusLabels = {
    pending: 'Pending',
    accepted: 'Processing',  // Show as Processing
    printing: 'Processing',  // Show as Processing
    ready: 'Ready',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-300 p-4 sm:p-6">
      <div className="flex items-center mb-4">
        <Users className="h-5 w-5 text-blue-600 mr-2" />
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
          Recent Order Activity
        </h2>
      </div>

      <p className="text-gray-600 text-sm mb-4">
        Recent orders and their current status
      </p>

      <div className="space-y-3">
        {recentOrders.map((order) => (
          <div
            key={order.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  {getInteractionIcon(order.status)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-sm font-medium text-gray-900">
                      {order.customer?.name || 'Student'}
                    </h3>
                    <span className="text-xs text-gray-500">
                      ({order.college || 'N/A'})
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-2">
                    {getStatusMessage(order.status)}
                  </p>

                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>Order: {order.orderNumber}</span>
                    <span>•</span>
                    <span>{getTimeAgo(order.updatedAt || order.createdAt)}</span>
                    {order.customer?.phone && (
                      <>
                        <span>•</span>
                        <span>{order.customer.phone}</span>
                      </>
                    )}
                  </div>

                  <div className="mt-2 text-xs text-gray-600">
                    <span className="font-medium">Details:</span>{' '}
                    {order.fileName || 'Document'}, {order.copies || 1} copies,
                    Total: ₹{order.totalCost}
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 ml-4">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                  {statusLabels[order.status] || order.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {recentOrders.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-sm">No recent orders yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Orders will appear here when students place them
          </p>
        </div>
      )}
    </div>
  );
};

export default StudentInteractions;
