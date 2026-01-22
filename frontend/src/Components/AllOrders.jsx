import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  ChevronDown,
  Eye,
  Printer,
  Download,
  Calendar,
  MoreHorizontal,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
} from "lucide-react";
import { usePartnerOrders } from "../hooks/usePartnerOrders.jsx";

const AllOrders = () => {
  const { orders, updateOrderStatus } = usePartnerOrders();
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState("");

  const navigate = useNavigate();

  const statusOptions = [
    "All",
    "pending",
    "accepted",
    "printing",
    "completed",
    "cancelled",
  ];

  const statusStyles = {
    pending: "bg-amber-50 text-amber-700 border border-amber-200",
    accepted: "bg-blue-50 text-blue-700 border border-blue-200",
    printing: "bg-violet-50 text-violet-700 border border-violet-200",
    completed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    cancelled: "bg-red-50 text-red-700 border border-red-200",
  };

  const statusLabels = {
    pending: "Pending",
    accepted: "Accepted",
    printing: "Printing",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      selectedStatus === "All" || order.status === selectedStatus;
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.college.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate =
      dateFilter === "" || formatDate(order.createdAt).includes(dateFilter);

    return matchesStatus && matchesSearch && matchesDate;
  });

  const handleStatusUpdate = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setShowStatusModal(true);
  };

  const confirmStatusUpdate = () => {
    if (selectedOrder && newStatus) {
      updateOrderStatus(selectedOrder.id, newStatus);
      setShowStatusModal(false);
      setSelectedOrder(null);
      setNewStatus("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/30 p-4 sm:p-6">
      <div className="max-w-[85rem] mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-4 sm:mb-0">
                <h2 className="text-2xl font-bold text-gray-900">All Orders</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Manage and track all printing orders
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full font-medium">
                  {filteredOrders.length} orders
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 border-b border-gray-100 bg-white">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Search by order ID, file name, or college..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50 transition-all duration-200"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="relative flex-1 lg:flex-none lg:w-48">
                <div className="relative">
                  <select
                    className="w-full pl-3 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50 cursor-pointer appearance-none transition-all duration-200"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    {statusOptions.map((option) => (
                      <option key={option} value={option}>
                        {option === "All"
                          ? "All Status"
                          : option.charAt(0).toUpperCase() + option.slice(1)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>
              </div>

              <div className="relative flex-1 lg:flex-none lg:w-48">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Filter by date..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50 transition-all duration-200"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                  />
                  <Calendar
                    size={18}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  />
                </div>
              </div>

              <button className="px-6 py-3 flex items-center gap-2 border border-gray-200 rounded-xl text-gray-700 text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 lg:w-auto justify-center bg-white shadow-sm">
                <Download size={16} />
                <span>Export</span>
              </button>
            </div>
          </div>

          <div className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/80 backdrop-blur-sm">
                  <tr className="text-gray-600 text-sm font-semibold border-b border-gray-100">
                    <th className="px-6 py-4 text-left font-semibold text-gray-700">
                      Order ID
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700 hidden sm:table-cell">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700 hidden md:table-cell">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700 hidden lg:table-cell">
                      College
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700 hidden md:table-cell">
                      Copies
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700">
                      Total
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700 hidden lg:table-cell">
                      Payment
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                            <Search size={24} />
                          </div>
                          <p className="text-lg font-medium text-gray-500 mb-1">
                            No orders found
                          </p>
                          <p className="text-sm text-gray-400">
                            Try adjusting your search or filters
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="hover:bg-blue-50/30 transition-all duration-200 group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-blue-700 text-sm">
                              {order.orderNumber}
                            </span>
                            <span className="text-xs text-gray-500 sm:hidden mt-1">
                              {formatDate(order.createdAt)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div>
                            <div className="font-medium text-gray-900 hidden sm:block">
                              {order.customer?.name || "Student Customer"}
                            </div>
                            <div className="sm:hidden">
                              <div className="font-medium text-gray-900">
                                {order.customer?.name || "Student"}
                              </div>
                              <div className="text-gray-500 text-xs mt-1">
                                {order.college}
                              </div>
                            </div>
                            <div className="text-gray-500 text-xs hidden sm:block mt-1">
                              {order.college}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 hidden md:table-cell">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 hidden lg:table-cell">
                          {order.college}
                        </td>
                        <td className="px-6 py-4 text-sm text-center text-gray-600 hidden md:table-cell">
                          <span className="bg-gray-100 px-2 py-1 rounded-lg font-medium">
                            {order.copies}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-gray-900 text-sm">
                            ₹{order.totalCost}
                          </span>
                        </td>
                        <td className="px-6 py-4 hidden lg:table-cell">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-1.5"></div>
                            Paid
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${
                              statusStyles[order.status]
                            }`}
                          >
                            <div
                              className={`w-1.5 h-1.5 rounded-full mr-2 ${
                                order.status === "pending"
                                  ? "bg-amber-500"
                                  : order.status === "accepted"
                                  ? "bg-blue-500"
                                  : order.status === "printing"
                                  ? "bg-violet-500"
                                  : order.status === "completed"
                                  ? "bg-emerald-500"
                                  : "bg-red-500"
                              }`}
                            ></div>
                            {statusLabels[order.status]}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() =>
                                navigate(`/partner/orders/${order.id}`)
                              }
                              className="p-2 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-all duration-200 group-hover:shadow-sm"
                              title="View details"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(order)}
                              className="p-2 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 text-gray-600 hover:text-emerald-600 transition-all duration-200 group-hover:shadow-sm"
                              title="Update status"
                            >
                              <CheckCircle size={16} />
                            </button>
                            <button
                              className="p-2 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600 hover:text-gray-700 transition-all duration-200 group-hover:shadow-sm hidden sm:block"
                              title="Print receipt"
                            >
                              <Printer size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-100 bg-white">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                Showing{" "}
                <span className="font-semibold text-gray-900">
                  {filteredOrders.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-900">
                  {orders.length}
                </span>{" "}
                orders
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                  Previous
                </button>
                <button className="px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showStatusModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Update Order Status
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Change the current status of this order
                </p>
              </div>
              <button
                onClick={() => setShowStatusModal(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {selectedOrder && (
              <div className="px-6 py-4 bg-blue-50/50 border-b border-blue-100">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">
                      Order ID:
                    </span>
                    <span className="text-sm font-semibold text-blue-700">
                      {selectedOrder.orderNumber}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">
                      File Name:
                    </span>
                    <span className="text-sm text-gray-900 truncate max-w-[200px]">
                      {selectedOrder.fileName}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">
                      College:
                    </span>
                    <span className="text-sm text-gray-900">
                      {selectedOrder.college}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="p-6">
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Select New Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50 transition-all duration-200"
              >
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="printing">Printing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmStatusUpdate}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Update Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllOrders;
