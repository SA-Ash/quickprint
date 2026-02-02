import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Printer,
  User,
  ShoppingBag,
  Phone,
  Calendar,
  CheckCircle,
  X,
  FileText,
  Loader2,
  CreditCard,
  IndianRupee,
  Clock,
  Building,
  Mail,
  MapPin,
  Download,
  Palette,
  Copy,
  BookOpen,
} from "lucide-react";
import { usePartnerOrders } from "../../hooks/usePartnerOrders.jsx";
import { orderService } from "../../services/order.service";

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { orders, updateOrderStatus, loadOrders } = usePartnerOrders();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [showContactModal, setShowContactModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const invoiceRef = useRef(null);

  // Fetch order from API if not in local state
  useEffect(() => {
    const fetchOrder = async () => {
      // First check local orders
      const foundOrder = orders.find((o) => o.id === id);
      if (foundOrder) {
        setOrder(foundOrder);
        setLoading(false);
        return;
      }

      // If not found locally, fetch from API
      try {
        setLoading(true);
        const response = await orderService.getOrderById(id);
        const orderData = response.order || response;
        setOrder({
          ...orderData,
          createdAt: new Date(orderData.createdAt),
          updatedAt: new Date(orderData.updatedAt),
        });
      } catch (err) {
        console.error("Failed to fetch order:", err);
        // Navigate back if order not found
        navigate("/partner/orders");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrder();
    }
  }, [orders, id, navigate]);

  const handleStatusUpdate = () => {
    setNewStatus(order.status?.toUpperCase() || order.status);
    setShowStatusModal(true);
  };

  const confirmStatusUpdate = async () => {
    if (newStatus && newStatus !== order.status) {
      try {
        setUpdating(true);
        await updateOrderStatus(order.id, newStatus);
        setOrder((prev) => ({ ...prev, status: newStatus, updatedAt: new Date() }));
        setShowStatusModal(false);
      } catch (err) {
        console.error("Failed to update status:", err);
      } finally {
        setUpdating(false);
      }
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatShortDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusInfo = (status) => {
    const s = status?.toUpperCase() || status;
    switch (s) {
      case "PENDING":
        return { color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Clock };
      case "ACCEPTED":
      case "PRINTING":
        return { color: "bg-blue-100 text-blue-800 border-blue-200", icon: Printer }; // Combined as Processing
      case "READY":
        return { color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle };
      case "COMPLETED":
        return { color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle };
      case "CANCELLED":
        return { color: "bg-red-100 text-red-800 border-red-200", icon: X };
      default:
        return { color: "bg-slate-100 text-slate-800 border-slate-200", icon: Clock };
    }
  };

  const statusLabels = {
    PENDING: "Pending",
    ACCEPTED: "Processing", // Combined
    PRINTING: "Processing", // Combined
    READY: "Ready",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  };

  const printInvoice = () => {
    const printContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Invoice - ${order.orderNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; background: white; }
    .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 120px; color: rgba(99, 102, 241, 0.08); font-weight: bold; pointer-events: none; z-index: -1; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #6366f1; }
    .logo { font-size: 28px; font-weight: bold; color: #6366f1; }
    .logo span { color: #1e293b; }
    .invoice-info { text-align: right; }
    .invoice-title { font-size: 24px; font-weight: bold; color: #1e293b; }
    .invoice-number { color: #6366f1; font-weight: 600; margin-top: 5px; }
    .invoice-date { color: #64748b; font-size: 14px; margin-top: 5px; }
    .parties { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .party { width: 45%; }
    .party-title { font-size: 12px; text-transform: uppercase; color: #64748b; margin-bottom: 8px; font-weight: 600; }
    .party-name { font-size: 18px; font-weight: 600; color: #1e293b; margin-bottom: 5px; }
    .party-detail { color: #64748b; font-size: 14px; line-height: 1.6; }
    .order-details { background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 30px; }
    .order-details-title { font-size: 14px; font-weight: 600; color: #1e293b; margin-bottom: 15px; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #64748b; }
    .detail-value { font-weight: 500; color: #1e293b; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th { background: #6366f1; color: white; padding: 12px 15px; text-align: left; font-size: 14px; }
    td { padding: 15px; border-bottom: 1px solid #e2e8f0; }
    .totals { margin-left: auto; width: 300px; }
    .total-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
    .grand-total { background: #6366f1; color: white; padding: 15px; border-radius: 8px; margin-top: 10px; font-size: 18px; font-weight: bold; }
    .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 12px; }
    .status-badge { display: inline-block; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-completed { background: #d1fae5; color: #065f46; }
    .status-printing { background: #ede9fe; color: #5b21b6; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="watermark">QuickPrint</div>
  
  <div class="header">
    <div class="logo">Quick<span>Print</span></div>
    <div class="invoice-info">
      <div class="invoice-title">INVOICE</div>
      <div class="invoice-number">${order.orderNumber}</div>
      <div class="invoice-date">${formatShortDate(order.createdAt)}</div>
    </div>
  </div>

  <div class="parties">
    <div class="party">
      <div class="party-title">Bill To</div>
      <div class="party-name">${order.user?.name || order.customer?.name || "Customer"}</div>
      <div class="party-detail">
        ${order.user?.phone || order.customer?.phone || ""}<br>
        ${order.college || order.user?.college || ""}
      </div>
    </div>
    <div class="party" style="text-align: right;">
      <div class="party-title">From</div>
      <div class="party-name">${order.shop?.businessName || "QuickPrint Shop"}</div>
      <div class="party-detail">
        Print Service Provider<br>
        QuickPrint Platform
      </div>
    </div>
  </div>

  <div class="order-details">
    <div class="order-details-title">Order Details</div>
    <div class="detail-row">
      <span class="detail-label">Document</span>
      <span class="detail-value">${order.file?.name || order.fileName || "Document"}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Pages</span>
      <span class="detail-value">${order.file?.pages || order.pages || 1}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Print Type</span>
      <span class="detail-value">${order.printConfig?.color || order.color ? "Color" : "Black & White"}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Copies</span>
      <span class="detail-value">${order.printConfig?.copies || order.copies || 1}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Sides</span>
      <span class="detail-value">${order.printConfig?.sides === "double" || order.doubleSided ? "Double-Sided" : "Single-Sided"}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Payment Method</span>
      <span class="detail-value">${order.paymentMethod === "cod" ? "Pay on Delivery" : order.paymentMethod?.toUpperCase() || "Online"}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Status</span>
      <span class="detail-value status-badge status-${(order.status || "").toLowerCase()}">${statusLabels[order.status?.toUpperCase()] || order.status || "Pending"}</span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th style="text-align: center;">Qty</th>
        <th style="text-align: right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <strong>Print Service</strong><br>
          <small style="color: #64748b;">${order.printConfig?.color || order.color ? "Color" : "B&W"}, ${order.printConfig?.sides === "double" || order.doubleSided ? "Double" : "Single"}-Sided, ${order.file?.pages || order.pages || 1} pages</small>
        </td>
        <td style="text-align: center;">${order.printConfig?.copies || order.copies || 1}</td>
        <td style="text-align: right; font-weight: 600;">₹${parseFloat(order.totalCost || 0).toFixed(2)}</td>
      </tr>
    </tbody>
  </table>

  <div class="totals">
    <div class="total-row">
      <span>Subtotal</span>
      <span>₹${(parseFloat(order.totalCost || 0) - 2).toFixed(2)}</span>
    </div>
    <div class="total-row">
      <span>Platform Fee</span>
      <span>₹2.00</span>
    </div>
    <div class="grand-total">
      <div style="display: flex; justify-content: space-between;">
        <span>Total</span>
        <span>₹${parseFloat(order.totalCost || 0).toFixed(2)}</span>
      </div>
    </div>
  </div>

  <div class="footer">
    <p><strong>QuickPrint</strong> - India's Smart Print Platform</p>
    <p style="margin-top: 5px;">Thank you for your business!</p>
    <p style="margin-top: 10px; font-size: 10px;">This is a computer-generated invoice and does not require a signature.</p>
  </div>
</body>
</html>
    `;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-blue-600 mx-auto animate-spin mb-4" />
          <p className="text-slate-600 font-medium">Loading Order Details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <X className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Order not found</p>
          <Link to="/partner/orders" className="text-blue-600 hover:underline mt-2 inline-block">
            ← Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status);
  const pages = order.file?.pages || order.pages || 1;
  const copies = order.printConfig?.copies || order.copies || 1;
  const isColor = order.printConfig?.color || order.color || false;
  const isDoubleSided = order.printConfig?.sides === "double" || order.doubleSided || false;
  const totalCost = parseFloat(order.totalCost) || 0;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <Link
            to="/partner/orders"
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold text-sm bg-white px-4 py-2.5 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to All Orders
          </Link>
          <button
            onClick={printInvoice}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow-md transition-all"
          >
            <Printer size={16} />
            Print Invoice
          </button>
        </header>

        <main className="space-y-6">
          {/* Order Header Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-800">
                  Order <span className="text-blue-600">#{order.orderNumber}</span>
                </h1>
                <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Placed on {formatDate(order.createdAt)}
                </p>
              </div>
              <div className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 border ${statusInfo.color}`}>
                <statusInfo.icon className="w-4 h-4" />
                {statusLabels[order.status?.toUpperCase()] || order.status}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="mt-6 border-t border-slate-200 pt-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <CreditCard className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Payment</p>
                  <p className="font-semibold text-slate-700">
                    {order.paymentMethod === "cod" ? "Pay on Delivery" : order.paymentMethod?.toUpperCase() || "Online"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-full">
                  <IndianRupee className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Total Amount</p>
                  <p className="font-semibold text-slate-700">₹{totalCost.toFixed(2)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Phone className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Contact</p>
                  <p className="font-semibold text-slate-700">
                    {order.user?.phone || order.customer?.phone || "Not Available"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Customer & File Details */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Customer & Document Details
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-3 bg-slate-50 rounded-lg">
                  <User className="w-5 h-5 text-slate-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-700">{order.user?.name || order.customer?.name || "Student Customer"}</p>
                    <p className="text-sm text-slate-500">Customer Name</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-3 bg-slate-50 rounded-lg">
                  <Building className="w-5 h-5 text-slate-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-700">{order.college || order.user?.college || "N/A"}</p>
                    <p className="text-sm text-slate-500">College</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-3 bg-slate-50 rounded-lg">
                  <FileText className="w-5 h-5 text-slate-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-700 break-all">{order.file?.name || order.fileName || "Document"}</p>
                    <p className="text-sm text-slate-500">File Name</p>
                  </div>
                </div>

                {/* Print Config Details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                  <div className="p-3 bg-blue-50 rounded-lg text-center">
                    <FileText className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                    <p className="text-lg font-bold text-slate-800">{pages}</p>
                    <p className="text-xs text-slate-500">Pages</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg text-center">
                    <Copy className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                    <p className="text-lg font-bold text-slate-800">{copies}</p>
                    <p className="text-xs text-slate-500">Copies</p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg text-center">
                    <Palette className="w-5 h-5 text-orange-600 mx-auto mb-1" />
                    <p className="text-lg font-bold text-slate-800">{isColor ? "Color" : "B&W"}</p>
                    <p className="text-xs text-slate-500">Print Type</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg text-center">
                    <BookOpen className="w-5 h-5 text-green-600 mx-auto mb-1" />
                    <p className="text-lg font-bold text-slate-800">{isDoubleSided ? "Double" : "Single"}</p>
                    <p className="text-xs text-slate-500">Sides</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Order Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={handleStatusUpdate}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-all hover:shadow-md"
                >
                  <CheckCircle className="w-4 h-4" />
                  Update Status
                </button>
                <button
                  onClick={() => setShowContactModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold rounded-lg shadow-sm transition-all hover:shadow-md"
                >
                  <Phone className="w-4 h-4" />
                  Contact Customer
                </button>
                <button
                  onClick={printInvoice}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold rounded-lg shadow-sm transition-all hover:shadow-md"
                >
                  <Download className="w-4 h-4" />
                  Download Invoice
                </button>
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to cancel this order?")) {
                      updateOrderStatus(order.id, "CANCELLED");
                      setOrder((prev) => ({ ...prev, status: "CANCELLED" }));
                    }
                  }}
                  disabled={order.status?.toUpperCase() === "CANCELLED" || order.status?.toUpperCase() === "COMPLETED"}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-red-300 text-red-600 hover:bg-red-50 font-semibold rounded-lg shadow-sm transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="w-4 h-4" />
                  Cancel Order
                </button>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-blue-600" />
                Order Summary
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 font-semibold text-left">Print Details</th>
                    <th className="px-6 py-3 font-semibold text-center">Pages</th>
                    <th className="px-6 py-3 font-semibold text-center">Copies</th>
                    <th className="px-6 py-3 font-semibold text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  <tr>
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {isColor ? "Color" : "B&W"}, {isDoubleSided ? "Double" : "Single"}-Sided
                    </td>
                    <td className="px-6 py-4 text-center text-slate-600">{pages}</td>
                    <td className="px-6 py-4 text-center text-slate-600">{copies}</td>
                    <td className="px-6 py-4 text-right font-semibold text-slate-800">₹{totalCost.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="p-6 bg-slate-50/70 rounded-b-xl flex justify-end">
              <div className="w-full max-w-xs space-y-3 text-sm">
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-300">
                  <span className="text-slate-800">Grand Total</span>
                  <span className="text-blue-600">₹{totalCost.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Update Order Status</h3>
                <p className="text-sm text-slate-500">Change the current status of this order</p>
              </div>
              <button onClick={() => setShowStatusModal(false)} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4 space-y-1">
                <p className="text-sm"><span className="text-slate-500">Order ID:</span> <span className="font-semibold text-blue-600">{order.orderNumber}</span></p>
                <p className="text-sm"><span className="text-slate-500">File Name:</span> <span className="font-medium">{order.file?.name || order.fileName}</span></p>
                <p className="text-sm"><span className="text-slate-500">College:</span> <span className="font-medium">{order.college || "N/A"}</span></p>
              </div>

              <p className="text-sm font-medium text-slate-700 mb-3">Select New Status</p>
              <div className="space-y-2">
                {Object.keys(statusLabels).map((statusKey) => (
                  <label
                    key={statusKey}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      newStatus === statusKey ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      value={statusKey}
                      checked={newStatus === statusKey}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="h-4 w-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                    />
                    <span className={`px-3 py-1 text-sm rounded-full font-semibold ${getStatusInfo(statusKey).color}`}>
                      {statusLabels[statusKey]}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="p-4 bg-slate-50/70 rounded-b-xl flex justify-end gap-3">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 text-slate-700 font-semibold rounded-lg border border-slate-300 hover:bg-slate-100 transition text-sm shadow-sm bg-white"
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusUpdate}
                disabled={updating}
                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition flex items-center gap-2 text-sm shadow-sm disabled:opacity-50"
              >
                {updating && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Contact Customer</h3>
                <p className="text-sm text-slate-500">Order #{order.orderNumber}</p>
              </div>
              <button onClick={() => setShowContactModal(false)} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <User className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="font-semibold text-slate-700">{order.user?.name || order.customer?.name || "Student Customer"}</p>
                    <p className="text-sm text-slate-500">Customer Name</p>
                  </div>
                </div>

                {(order.user?.phone || order.customer?.phone) && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-slate-700">Phone Number</span>
                      </div>
                      <span className="font-semibold text-blue-600">{order.user?.phone || order.customer?.phone}</span>
                    </div>
                    <a
                      href={`tel:${order.user?.phone || order.customer?.phone}`}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                      Call Customer
                    </a>
                  </div>
                )}

                {(order.user?.email || order.customer?.email) && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-slate-700">Email</span>
                      </div>
                      <span className="font-semibold text-green-600 text-sm break-all">{order.user?.email || order.customer?.email}</span>
                    </div>
                    <a
                      href={`mailto:${order.user?.email || order.customer?.email}`}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      Send Email
                    </a>
                  </div>
                )}

                {!order.user?.phone && !order.customer?.phone && !order.user?.email && !order.customer?.email && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800 text-center">Customer contact information not available</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50/70 rounded-b-xl flex justify-end">
              <button
                onClick={() => setShowContactModal(false)}
                className="px-4 py-2 text-slate-700 font-semibold rounded-lg border border-slate-300 hover:bg-slate-100 transition text-sm shadow-sm bg-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetails;
