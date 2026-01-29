import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { usePartnerOrders } from "../hooks/usePartnerOrders.jsx";

const RecentOrders = () => {
  const { orders } = usePartnerOrders();
  const recentOrders = orders.slice(0, 5);
  const navigate = useNavigate();

  const statusStyles = {
    pending: "bg-yellow-100 text-yellow-800",
    accepted: "bg-blue-100 text-blue-800",
    printing: "bg-purple-100 text-purple-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-300 p-4 sm:p-6 mb-4 sm:mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
          Recent Orders
        </h2>
        <Link
          to="/partner/orders"
          className="px-3 sm:px-4 py-1 sm:py-1.5 border border-gray-300 rounded-lg text-gray-700 text-xs sm:text-sm hover:bg-gray-50"
        >
          <span className="text-xs">View All</span>
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-separate border-spacing-y-2 sm:border-spacing-y-3">
          <thead>
            <tr className="text-gray-600 text-xs sm:text-sm">
              <th className="px-2 sm:px-4 py-2">Order ID</th>
              <th className="px-2 sm:px-4 py-2 hidden sm:table-cell">
                Customer
              </th>
              <th className="px-2 sm:px-4 py-2 hidden md:table-cell">Date</th>
              <th className="px-2 sm:px-4 py-2 hidden lg:table-cell">
                College
              </th>
              <th className="px-2 sm:px-4 py-2">Name</th>
              <th className="px-2 sm:px-4 py-2">Total</th>
              <th className="px-2 sm:px-4 py-2">Status</th>
              <th className="px-2 sm:px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                  No orders found
                </td>
              </tr>
            ) : (
              recentOrders.map((order, idx) => (
                <tr key={order.id} className="bg-white rounded-lg shadow-sm">
                  <td className="px-2 sm:px-4 py-2 sm:py-3 font-medium text-blue-800 text-xs sm:text-sm">
                    {order.orderNumber}
                  </td>
                  <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">
                    <span className="sm:hidden">
                      Student
                    </span>
                    <span className="hidden sm:inline">Student Customer</span>
                  </td>
                  <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm hidden md:table-cell">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm hidden lg:table-cell">
                    {order.college}
                  </td>
                  <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium">
                    {order.fileName}
                  </td>
                  <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium">
                    ₹{order.totalCost}
                  </td>
                  <td className="px-2 sm:px-4 py-2 sm:py-3">
                    <span
                      className={`px-2 sm:px-3 py-1 text-xs rounded-full font-medium ${
                        statusStyles[order.status]
                      }`}
                    >
                      {order.statusText}
                    </span>
                  </td>
                  <td className="px-2 sm:px-4 py-2 sm:py-3">
                    <button
                      onClick={() => navigate(`/partner/orders/${order.id}`)}
                      className="px-2 sm:px-3 py-1 text-xs rounded-lg border border-gray-300 hover:border-blue-500 hover:text-blue-600 transition"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentOrders;
