import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Printer,
  User,
  ShoppingBag,
  MessageSquare,
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
} from "lucide-react";
import { usePartnerOrders } from "../../hooks/usePartnerOrders.jsx";

const OrderDetails = () => {
  const { id } = useParams();
  const { orders, updateOrderStatus } = usePartnerOrders();
  const [order, setOrder] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [showContactModal, setShowContactModal] = useState(false);

  useEffect(() => {
    const foundOrder = orders.find((o) => o.id === id);
    if (foundOrder) {
      setOrder(foundOrder);
    }
  }, [orders, id]);

  const handleStatusUpdate = () => {
    setNewStatus(order.status);
    setShowStatusModal(true);
  };

  const confirmStatusUpdate = () => {
    if (newStatus && newStatus !== order.status) {
      updateOrderStatus(order.id, newStatus);
      setShowStatusModal(false);
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

  const getStatusInfo = (status) => {
    switch (status) {
      case "pending":
        return {
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
          icon: Clock,
        };
      case "accepted":
        return {
          color: "bg-blue-100 text-blue-800 border-blue-200",
          icon: CheckCircle,
        };
      case "printing":
        return {
          color: "bg-purple-100 text-purple-800 border-purple-200",
          icon: Printer,
        };
      case "completed":
        return {
          color: "bg-green-100 text-green-800 border-green-200",
          icon: CheckCircle,
        };
      case "cancelled":
        return { color: "bg-red-100 text-red-800 border-red-200", icon: X };
      default:
        return {
          color: "bg-slate-100 text-slate-800 border-slate-200",
          icon: MessageSquare,
        };
    }
  };

  const statusLabels = {
    pending: "Pending",
    accepted: "Accepted",
    printing: "Printing",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  const printItems = [
    {
      id: 1,
      name: `${order?.color ? "Color" : "B&W"}, ${
        order?.doubleSided ? "Double" : "Single"
      }-Sided`,
      qty: order?.copies,
      price: order?.totalCost / order?.copies,
    },
  ];

  const subtotal = order?.totalCost * 0.9;
  const tax = order?.totalCost * 0.1;
  const grandTotal = order?.totalCost;

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-blue-600 mx-auto animate-spin mb-4" />
          <p className="text-slate-600 font-medium">Loading Order Details...</p>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status);

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <Link
            to="/partner/orders"
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold text-sm bg-white px-4 py-2.5 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to All Orders
          </Link>
          <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg shadow-sm hover:bg-slate-50 transition-all hover:shadow-md">
            <Printer size={16} />
            Print Invoice
          </button>
        </header>

        <main className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-800">
                  Order{" "}
                  <span className="text-blue-600">#{order.orderNumber}</span>
                </h1>
                <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Placed on {formatDate(order.createdAt)}
                </p>
              </div>
              <div
                className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 border ${statusInfo.color}`}
              >
                <statusInfo.icon className="w-4 h-4" />
                {statusLabels[order.status]}
              </div>
            </div>
            <div className="mt-6 border-t border-slate-200 pt-6 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <CreditCard className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Payment</p>
                  <p className="font-semibold text-slate-700">Paid via UPI</p>
                </div>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-3">
                <div className="p-2 bg-indigo-100 rounded-full">
                  <IndianRupee className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Total Amount</p>
                  <p className="font-semibold text-slate-700">
                    ₹{grandTotal?.toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Phone className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Contact</p>
                  <p className="font-semibold text-slate-700">
                    {order.customer?.phone || "Not Available"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Customer & File Details
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-3 bg-slate-50 rounded-lg">
                  <User className="w-5 h-5 text-slate-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-700">
                      {order.customer?.name || "Student Customer"}
                    </p>
                    <p className="text-sm text-slate-500">Customer Name</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-3 bg-slate-50 rounded-lg">
                  <Building className="w-5 h-5 text-slate-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-700">
                      {order.college}
                    </p>
                    <p className="text-sm text-slate-500">College</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-3 bg-slate-50 rounded-lg">
                  <FileText className="w-5 h-5 text-slate-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-700 break-all">
                      {order.fileName}
                    </p>
                    <p className="text-sm text-slate-500">File Name</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-3 bg-slate-50 rounded-lg">
                  <MapPin className="w-5 h-5 text-slate-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-700">
                      College Campus
                    </p>
                    <p className="text-sm text-slate-500">Pickup Location</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">
                Order Actions
              </h3>
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
                  onClick={() => {
                    if (
                      confirm("Are you sure you want to cancel this order?")
                    ) {
                      updateOrderStatus(order.id, "cancelled");
                    }
                  }}
                  disabled={
                    order.status === "cancelled" || order.status === "completed"
                  }
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-red-300 text-red-600 hover:bg-red-50 font-semibold rounded-lg shadow-sm transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="w-4 h-4" />
                  Cancel Order
                </button>
              </div>
            </div>
          </div>

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
                    <th className="px-6 py-3 font-semibold text-left">
                      Print Details
                    </th>
                    <th className="px-6 py-3 font-semibold text-center">
                      Quantity
                    </th>
                    <th className="px-6 py-3 font-semibold text-right">
                      Price per Copy
                    </th>
                    <th className="px-6 py-3 font-semibold text-right">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {printItems.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 font-medium text-slate-800">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 text-center text-slate-600">
                        {item.qty}
                      </td>
                      <td className="px-6 py-4 text-right text-slate-600">
                        ₹{item.price?.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-slate-800">
                        ₹{(item.qty * item.price)?.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-6 bg-slate-50/70 rounded-b-xl flex justify-end">
              <div className="w-full max-w-xs space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-medium text-slate-800">
                    ₹{subtotal?.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Tax (10%)</span>
                  <span className="font-medium text-slate-800">
                    ₹{tax?.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-300">
                  <span className="text-slate-800">Grand Total</span>
                  <span className="text-blue-600">
                    ₹{grandTotal?.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {showStatusModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Update Order Status
                </h3>
                <p className="text-sm text-slate-500">
                  Order ID: {order.orderNumber}
                </p>
              </div>
              <button
                onClick={() => setShowStatusModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-2">
                {Object.keys(statusLabels).map((statusKey) => (
                  <label
                    key={statusKey}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      newStatus === statusKey
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      value={statusKey}
                      checked={newStatus === statusKey}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="h-4 w-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                    />
                    <span
                      className={`px-3 py-1 text-sm rounded-full font-semibold ${
                        getStatusInfo(statusKey).color
                      }`}
                    >
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
                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition flex items-center text-sm shadow-sm"
              >
                Confirm Update
              </button>
            </div>
          </div>
        </div>
      )}

      {showContactModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Contact Customer
                </h3>
                <p className="text-sm text-slate-500">
                  Order #{order.orderNumber}
                </p>
              </div>
              <button
                onClick={() => setShowContactModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <User className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="font-semibold text-slate-700">
                      {order.customer?.name || "Student Customer"}
                    </p>
                    <p className="text-sm text-slate-500">Customer Name</p>
                  </div>
                </div>

                {order.customer?.phone && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-slate-700">
                          Phone Number
                        </span>
                      </div>
                      <span className="font-semibold text-blue-600">
                        {order.customer.phone}
                      </span>
                    </div>

                    <a
                      href={`tel:${order.customer.phone}`}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                      Call Customer
                    </a>
                  </div>
                )}

                {order.customer?.email && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-slate-700">Email</span>
                      </div>
                      <span className="font-semibold text-green-600 text-sm break-all">
                        {order.customer.email}
                      </span>
                    </div>

                    <a
                      href={`mailto:${order.customer.email}`}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      Send Email
                    </a>
                  </div>
                )}

                {!order.customer?.phone && !order.customer?.email && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800 text-center">
                      Customer contact information not available
                    </p>
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
