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
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printOrder, setPrintOrder] = useState(null);

  const navigate = useNavigate();

  const statusOptions = [
    "All",
    "pending",
    "processing", // Combined accepted + printing
    "ready",
    "completed",
    "cancelled",
  ];

  const statusStyles = {
    pending: "bg-amber-50 text-amber-700 border border-amber-200",
    accepted: "bg-blue-50 text-blue-700 border border-blue-200", // Keep for display
    printing: "bg-violet-50 text-violet-700 border border-violet-200", // Keep for display
    processing: "bg-blue-50 text-blue-700 border border-blue-200", // Combined status
    ready: "bg-teal-50 text-teal-700 border border-teal-200",
    completed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    cancelled: "bg-red-50 text-red-700 border border-red-200",
  };

  const statusLabels = {
    pending: "Pending",
    accepted: "Processing", // Show as Processing
    printing: "Processing", // Show as Processing
    processing: "Processing", // Combined status
    ready: "Ready",
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
    // Handle 'processing' filter matching both 'accepted' and 'printing'
    let matchesStatus = selectedStatus === "All";
    if (!matchesStatus) {
      if (selectedStatus === "processing") {
        matchesStatus = order.status === "accepted" || order.status === "printing";
      } else {
        matchesStatus = order.status === selectedStatus;
      }
    }
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
    // Convert to uppercase for backend API
    setNewStatus((order.status || 'pending').toUpperCase());
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

  const handlePrintDocument = (order) => {
    setPrintOrder(order);
    setShowPrintModal(true);
  };

  const executePrint = async () => {
    try {
      console.log('[Print] Starting print for order:', printOrder?.orderNumber);
      console.log('[Print] File data:', printOrder?.file);

      const fileId = printOrder?.file?.fileId;
      const directUrl = printOrder?.file?.url || printOrder?.fileUrl;
      let printUrl = null;

      // Always try to get signed URL from backend if we have fileId
      if (fileId) {
        console.log('[Print] Fetching signed URL for fileId:', fileId);
        const token = localStorage.getItem('accessToken');
        const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

        try {
          const response = await fetch(`${apiUrl}/api/files/${fileId}/download`, {
            headers: {
              'Authorization': token ? `Bearer ${token}` : '',
            },
          });

          if (response.ok) {
            const data = await response.json();
            printUrl = data.downloadUrl || data.url;
            console.log('[Print] Got signed URL:', printUrl);
          } else {
            console.warn('[Print] Backend returned error:', response.status);
          }
        } catch (fetchError) {
          console.error('[Print] Failed to fetch signed URL:', fetchError);
        }
      }

      // Fallback to direct URL if backend call failed or no fileId
      if (!printUrl && directUrl) {
        console.log('[Print] Using direct URL:', directUrl);
        // If it's an S3 key (starts with uploads/), we need the full S3 URL
        if (directUrl.startsWith('uploads/') || directUrl.startsWith('s3://')) {
          // Construct S3 URL - this is a fallback
          const bucketName = 'quickprint-uploads';
          const region = 'ap-south-1';
          const key = directUrl.replace('s3://', '').replace(`${bucketName}/`, '');
          printUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
        } else if (directUrl.startsWith('http')) {
          printUrl = directUrl;
        }
      }

      if (printUrl) {
        console.log('[Print] Opening document:', printUrl);
        // Open the document in a new window for printing
        const printWindow = window.open(printUrl, '_blank');
        if (printWindow) {
          // For PDFs, just open - user can print from browser
          setShowPrintModal(false);
        } else {
          alert('Popup blocked. Please allow popups to print documents.');
        }
      } else {
        console.error('[Print] No URL available. File data:', printOrder?.file);
        alert('Document URL not available. Please check if the file was uploaded correctly.');
      }
    } catch (error) {
      console.error('[Print] Error printing document:', error);
      alert('Failed to load document for printing: ' + error.message);
    }
  };

  const exportOrders = () => {
    // Create CSV content
    const headers = ['Order ID', 'Customer', 'Date', 'College', 'File', 'Copies', 'Total', 'Payment Method', 'Payment Status', 'Status'];

    const csvRows = filteredOrders.map(order => [
      order.orderNumber,
      order.customer?.name || 'N/A',
      formatDate(order.createdAt),
      order.college || 'N/A',
      order.fileName || 'N/A',
      order.copies || 1,
      order.totalCost,
      order.paymentMethod || 'N/A',
      order.paymentStatus || 'N/A',
      statusLabels[order.status] || order.status
    ]);

    const csvContent = [
      headers.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

              <button
                onClick={exportOrders}
                className="px-6 py-3 flex items-center gap-2 border border-gray-200 rounded-xl text-gray-700 text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 lg:w-auto justify-center bg-white shadow-sm"
              >
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
                        onClick={() => navigate(`/partner/orders/${order.id}`)}
                        className="hover:bg-blue-50/30 transition-all duration-200 group cursor-pointer"
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
                          {order.paymentStatus === 'paid' ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-1.5"></div>
                              Paid
                            </span>
                          ) : order.paymentMethod === 'cod' ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                              <div className="w-1.5 h-1.5 bg-amber-400 rounded-full mr-1.5"></div>
                              COD
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
                              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-1.5"></div>
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${statusStyles[order.status]
                              }`}
                          >
                            <div
                              className={`w-1.5 h-1.5 rounded-full mr-2 ${order.status === "pending"
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
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/partner/orders/${order.id}`);
                              }}
                              className="p-2 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-all duration-200 group-hover:shadow-sm"
                              title="View details"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusUpdate(order);
                              }}
                              className="p-2 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 text-gray-600 hover:text-emerald-600 transition-all duration-200 group-hover:shadow-sm"
                              title="Update status"
                            >
                              <CheckCircle size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePrintDocument(order);
                              }}
                              className="p-2 rounded-lg border border-gray-200 hover:border-violet-300 hover:bg-violet-50 text-gray-600 hover:text-violet-600 transition-all duration-200 group-hover:shadow-sm hidden sm:block"
                              title="Print document"
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
              <div className="space-y-2">
                {[
                  { value: 'PENDING', label: 'Pending', color: 'bg-amber-100 text-amber-700 border-amber-200' },
                  { value: 'PRINTING', label: 'Processing', color: 'bg-blue-100 text-blue-700 border-blue-200' }, // Accept + Print combined
                  { value: 'READY', label: 'Ready', color: 'bg-teal-100 text-teal-700 border-teal-200' },
                  { value: 'COMPLETED', label: 'Completed', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
                  { value: 'CANCELLED', label: 'Cancelled', color: 'bg-red-100 text-red-700 border-red-200' },
                ].map((status) => (
                  <label
                    key={status.value}
                    className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all duration-200 ${newStatus === status.value
                        ? `${status.color} border-2`
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                  >
                    <input
                      type="radio"
                      name="orderStatus"
                      value={status.value}
                      checked={newStatus === status.value}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className={`ml-3 text-sm font-medium px-2 py-0.5 rounded-full ${status.color}`}>
                      {status.label}
                    </span>
                  </label>
                ))}
              </div>

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

      {/* Print Document Modal */}
      {showPrintModal && printOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full transform transition-all duration-300 scale-100">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-violet-50 to-purple-50">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Print Document
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Review print settings before printing
                </p>
              </div>
              <button
                onClick={() => setShowPrintModal(false)}
                className="p-2 hover:bg-white/50 rounded-xl transition-colors duration-200"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="px-6 py-4 bg-violet-50/30 border-b border-violet-100">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase">Order ID</span>
                  <p className="text-sm font-semibold text-violet-700">{printOrder.orderNumber}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase">Customer</span>
                  <p className="text-sm font-medium text-gray-900">{printOrder.customer?.name || "Student"}</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Printer size={16} className="text-violet-600" />
                Print Configuration
              </h4>

              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Document</span>
                  <span className="text-sm font-medium text-gray-900 max-w-[250px] truncate">
                    {printOrder.file?.name || printOrder.fileName || "Document.pdf"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Pages</span>
                  <span className="text-sm font-medium text-gray-900">
                    {printOrder.file?.pages || printOrder.pages || 1}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Print Type</span>
                  <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${printOrder.printConfig?.color || printOrder.color
                      ? "bg-violet-100 text-violet-700"
                      : "bg-gray-200 text-gray-700"
                    }`}>
                    {printOrder.printConfig?.color || printOrder.color ? "Color" : "Black & White"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Copies</span>
                  <span className="text-sm font-semibold text-violet-700 bg-violet-50 px-3 py-1 rounded-full">
                    {printOrder.printConfig?.copies || printOrder.copies || 1}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600">Sides</span>
                  <span className="text-sm font-medium text-gray-900">
                    {printOrder.printConfig?.sides === "double" || printOrder.doubleSided
                      ? "Double-Sided"
                      : "Single-Sided"}
                  </span>
                </div>
              </div>

              {/* Document Preview Section */}
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Eye size={16} className="text-violet-600" />
                  Document Preview
                </h4>
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {/* Document preview with file icon card */}
                  <div className="p-4 bg-gradient-to-br from-violet-50 to-purple-50">
                    <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm border border-violet-100">
                      <div className="w-12 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-md">
                        <span className="text-white text-xs font-bold">PDF</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {printOrder.file?.name || printOrder.fileName || "Document.pdf"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {printOrder.file?.pages || printOrder.pages || 1} page(s) • Ready to print
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-xs text-amber-800 flex items-center gap-2">
                  <AlertCircle size={14} />
                  <span>Remember to set your printer to match the configuration above</span>
                </p>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-100 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={executePrint}
                className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-medium hover:from-violet-700 hover:to-purple-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
              >
                <Printer size={16} />
                Print Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllOrders;