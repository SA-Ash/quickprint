import React from "react";
import { usePartnerOrders } from "../hooks/usePartnerOrders.jsx";

const TodaySchedule = () => {
  const { orders } = usePartnerOrders();

  // Filter orders for today
  const today = new Date();
  const todayOrders = orders.filter(order => {
    const orderDate = new Date(order.createdAt);
    return orderDate.toDateString() === today.toDateString();
  });

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const statusStyles = {
    pending: "bg-amber-100 text-amber-800",
    accepted: "bg-blue-100 text-blue-800",
    printing: "bg-violet-100 text-violet-800",
    ready: "bg-teal-100 text-teal-800",
    completed: "bg-emerald-100 text-emerald-800",
    cancelled: "bg-red-100 text-red-800",
  };

  const statusLabels = {
    pending: "Pending",
    accepted: "Processing",  // Show as Processing
    printing: "Processing",  // Show as Processing
    ready: "Ready",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  return (
    <div className="bg-white rounded-lg border border-gray-300 p-4 sm:p-6 mt-6">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-8">
        Today's Schedule
      </h2>
      
      {todayOrders.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">No orders for today yet</p>
          <p className="text-xs text-gray-400 mt-1">
            New orders will appear here as they come in
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-gray-600 text-xs sm:text-sm">
                <th className="pb-2 sm:pb-3 font-medium px-2 sm:px-0">Date</th>
                <th className="pb-2 sm:pb-3 font-medium px-2 sm:px-0">
                  Order ID
                </th>
                <th className="pb-2 sm:pb-3 font-medium px-2 sm:px-0 hidden sm:table-cell">
                  Customer
                </th>
                <th className="pb-2 sm:pb-3 font-medium px-2 sm:px-0">Payment</th>
                <th className="pb-2 sm:pb-3 font-medium px-2 sm:px-0">Status</th>
              </tr>
            </thead>
            <tbody>
              {todayOrders.map((order) => (
                <tr key={order.id} className="border-t">
                  <td className="py-3 sm:py-4 font-semibold text-gray-800 text-xs sm:text-sm px-2 sm:px-0">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="py-3 sm:py-4 text-blue-700 text-xs sm:text-sm font-medium px-2 sm:px-0">
                    {order.orderNumber}
                  </td>
                  <td className="py-3 sm:py-4 text-gray-700 text-xs sm:text-sm px-2 sm:px-0 hidden sm:table-cell">
                    {order.customer?.name || 'Student'}
                  </td>
                  <td className="py-3 sm:py-4 text-gray-700 text-xs sm:text-sm px-2 sm:px-0">
                    {order.paymentStatus === 'paid' ? 'Paid' : order.paymentMethod === 'cod' ? 'COD' : 'Pending'}
                  </td>
                  <td className="py-3 sm:py-4 px-2 sm:px-0">
                    <span
                      className={`${statusStyles[order.status] || 'bg-gray-100 text-gray-800'} px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium`}
                    >
                      {statusLabels[order.status] || order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TodaySchedule;
