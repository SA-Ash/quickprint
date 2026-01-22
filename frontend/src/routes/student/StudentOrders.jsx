import React, { useState } from "react";
import {
  Download,
  Search,
  Calendar,
  FileText,
  Printer,
  Clock,
  CheckCircle,
  Package,
  IndianRupee,
  Loader,
  Inbox,
} from "lucide-react";
import { useOrders } from "../../hooks/useOrders.jsx";

const StudentOrders = () => {
  const { orders, loading } = useOrders();
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeFilter === "all") return matchesSearch;
    return matchesSearch && order.status === activeFilter;
  });

  const statusStyles = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    accepted: "bg-blue-100 text-blue-800 border-blue-200",
    printing: "bg-purple-100 text-purple-800 border-purple-200",
    completed: "bg-green-100 text-green-800 border-green-200",
    cancelled: "bg-red-100 text-red-800 border-red-200",
  };

  const statusIcons = {
    pending: <Clock className="w-3 h-3" />,
    accepted: <CheckCircle className="w-3 h-3" />,
    printing: <Printer className="w-3 h-3" />,
    completed: <CheckCircle className="w-3 h-3" />,
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatPages = (order) => {
    const colorText = order.color ? "Color" : "B&W";
    const sideText = order.doubleSided ? "Double-Sided" : "Single-Sided";
    return `${order.pages} pages • ${colorText}, ${sideText}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            My Orders
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1">
            Track your printing orders and manage your history.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {["all", "pending", "accepted", "printing", "completed"].map(
                (filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-3 py-1.5 text-sm font-semibold transition-colors rounded-full whitespace-nowrap ${
                      activeFilter === filter
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                )
              )}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search by file or order ID..."
                className="pl-9 pr-4 py-2 w-full md:w-64 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-16">
              <Loader className="h-8 w-8 text-blue-600 mx-auto animate-spin mb-4" />
              <p className="text-slate-600 font-medium">
                Loading your orders...
              </p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
              <Inbox className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                No Orders Found
              </h3>
              <p className="text-slate-500">
                {orders.length === 0
                  ? "You haven't placed any orders yet. Let's get printing!"
                  : "No orders match your current filters."}
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 transition-all hover:shadow-md hover:-translate-y-1"
              >
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 gap-2">
                  <div>
                    <p className="font-semibold text-slate-800 text-lg">
                      {order.fileName}
                    </p>
                    <p className="text-xs text-slate-500 font-mono">
                      ID: {order.orderNumber}
                    </p>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border ${
                      statusStyles[order.status]
                    }`}
                  >
                    {statusIcons[order.status]}
                    {order.statusText}
                  </div>
                </div>

                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-start gap-3">
                    <Printer className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-slate-700">
                        {order.shopName}
                      </p>
                      <p className="text-slate-500 text-xs">Print Shop</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FileText className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-slate-700">
                        {formatPages(order)}
                      </p>
                      <p className="text-slate-500 text-xs">
                        {order.binding} • {order.copies} cop
                        {order.copies > 1 ? "ies" : "y"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-slate-700">
                        {formatDate(order.createdAt)}
                      </p>
                      <p className="text-slate-500 text-xs">Date Placed</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50/70 rounded-b-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="font-bold text-slate-900 text-xl">
                    ₹{order.totalCost.toFixed(2)}
                  </div>
                  <button className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg shadow-sm hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                    <Download className="h-4 w-4" />
                    Download Receipt
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-8">
          <h3 className="text-xl font-bold text-slate-900 mb-4">Summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: Package,
                label: "Total Orders",
                value: orders.length,
                color: "blue",
              },
              {
                icon: IndianRupee,
                label: "Total Spent",
                value: `₹${orders
                  .reduce((sum, order) => sum + order.totalCost, 0)
                  .toFixed(2)}`,
                color: "green",
              },
              {
                icon: CheckCircle,
                label: "Completed",
                value: orders.filter((o) => o.status === "completed").length,
                color: "emerald",
              },
              {
                icon: Clock,
                label: "In Progress",
                value: orders.filter((o) =>
                  ["pending", "accepted", "printing"].includes(o.status)
                ).length,
                color: "amber",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4"
              >
                <div className={`p-3 rounded-full bg-${item.color}-100`}>
                  <item.icon className={`h-6 w-6 text-${item.color}-600`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {item.value}
                  </p>
                  <p className="text-sm text-slate-500">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentOrders;
