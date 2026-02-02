import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Printer,
  Package,
  MapPin,
  Phone,
  FileText,
  Calendar,
  AlertCircle,
  RefreshCw,
  Loader2,
  Palette,
  Copy,
  BookOpen,
  IndianRupee,
  CreditCard,
  Star,
  X,
} from "lucide-react";
import { useOrders } from "../../hooks/useOrders.jsx";
import { orderService } from "../../services/order.service";
import { wsService, WS_EVENTS } from "../../services/websocket.service";
import apiClient from "../../services/api";

// Merged ACCEPTED + PRINTING into "Processing" - when partner accepts, printing starts
const STATUS_STEPS = [
  { key: "PENDING", label: "Order Placed", icon: Clock, color: "yellow", description: "Waiting for shop to accept" },
  { key: "PROCESSING", label: "Processing", icon: Printer, color: "blue", description: "Your document is being printed", matchStatuses: ["ACCEPTED", "PRINTING"] },
  { key: "READY", label: "Ready for Pickup", icon: Package, color: "green", description: "Collect from the shop" },
  { key: "COMPLETED", label: "Completed", icon: CheckCircle, color: "green", description: "Order delivered" },
];

const OrderTracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { orders, loadOrders } = useOrders();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Rating modal state - must be before any conditional returns
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);
  const [hasRated, setHasRated] = useState(false);

  // Fetch order from local state or API
  useEffect(() => {
    const fetchOrder = async () => {
      // First check local orders
      const found = orders?.find((o) => o.id === orderId);
      if (found) {
        setOrder(found);
        setLoading(false);
        return;
      }

      // If not found locally, fetch from API
      try {
        setLoading(true);
        const response = await orderService.getOrderById(orderId);
        const orderData = response.order || response;
        setOrder({
          ...orderData,
          createdAt: new Date(orderData.createdAt),
          updatedAt: new Date(orderData.updatedAt),
        });
      } catch (err) {
        console.error("Failed to fetch order:", err);
        setError("Order not found");
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orders, orderId]);

  // Listen for real-time status updates via WebSocket
  useEffect(() => {
    if (!orderId) return;

    const token = localStorage.getItem("accessToken");
    if (token) {
      wsService.connect(token);

      const handleStatusChange = (data) => {
        if (data.orderId === orderId || data.id === orderId) {
          setOrder((prev) => ({
            ...prev,
            status: data.newStatus || data.status,
            updatedAt: new Date(data.updatedAt || Date.now()),
          }));
        }
      };

      wsService.subscribe(WS_EVENTS.ORDER_STATUS_CHANGED, handleStatusChange);

      return () => {
        wsService.unsubscribe(WS_EVENTS.ORDER_STATUS_CHANGED, handleStatusChange);
      };
    }
  }, [orderId]);

  // Update local order when orders array changes (via WebSocket)
  useEffect(() => {
    if (orders && orderId) {
      const found = orders.find((o) => o.id === orderId);
      if (found && found.status !== order?.status) {
        setOrder(found);
      }
    }
  }, [orders, orderId]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await loadOrders?.();
      const response = await orderService.getOrderById(orderId);
      const orderData = response.order || response;
      setOrder({
        ...orderData,
        createdAt: new Date(orderData.createdAt),
        updatedAt: new Date(orderData.updatedAt),
      });
    } catch (err) {
      console.error("Failed to refresh:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">{error || "Order not found"}</p>
          <Link to="/student" className="text-indigo-600 hover:underline">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const currentStatus = order?.status?.toUpperCase() || order?.status;
  // Find step index - check matchStatuses for merged steps like PROCESSING
  const currentStepIndex = STATUS_STEPS.findIndex((s) => 
    s.key === currentStatus || s.matchStatuses?.includes(currentStatus)
  );
  const isCancelled = currentStatus === "CANCELLED";
  const isCompleted = currentStatus === "COMPLETED";
  
  // Show rating modal for completed/cancelled orders that haven't been rated
  useEffect(() => {
    if ((isCompleted || isCancelled) && !hasRated && order?.shop?.id) {
      // Small delay before showing modal
      const timer = setTimeout(() => setShowRatingModal(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [isCompleted, isCancelled, hasRated, order?.shop?.id]);
  
  // Update hasRated when order loads
  useEffect(() => {
    if (order?.hasRated) {
      setHasRated(true);
    }
  }, [order?.hasRated]);
  
  const submitRating = async () => {
    if (rating === 0) return;
    
    try {
      setSubmittingRating(true);
      await apiClient.post('/reviews', {
        shopId: order.shop?.id,
        rating,
        comment: ratingComment,
      });
      setHasRated(true);
      setShowRatingModal(false);
    } catch (error) {
      console.error("Failed to submit rating:", error);
    } finally {
      setSubmittingRating(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const pages = order.file?.pages || order.pages || 1;
  const copies = order.printConfig?.copies || order.copies || 1;
  const isColor = order.printConfig?.color || order.color || false;
  const isDoubleSided = order.printConfig?.sides === "double" || order.doubleSided || false;
  const totalCost = parseFloat(order.totalCost) || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate("/student")}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </button>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
          <h1 className="text-2xl font-bold">Order Tracking</h1>
          <p className="text-white/80 mt-1 text-lg">#{order.orderNumber}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Current Status Badge */}
        <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Current Status</p>
            <p className="text-xl font-bold text-gray-900">
              {isCancelled ? "Cancelled" : STATUS_STEPS[currentStepIndex]?.label || currentStatus}
            </p>
          </div>
          <div className={`px-4 py-2 rounded-full font-semibold ${
            isCancelled 
              ? "bg-red-100 text-red-700" 
              : currentStepIndex >= 3 
                ? "bg-green-100 text-green-700" 
                : "bg-indigo-100 text-indigo-700"
          }`}>
            {isCancelled ? "Cancelled" : currentStepIndex >= 3 ? "Ready!" : "In Progress"}
          </div>
        </div>

        {/* Status Timeline */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Progress</h2>
          
          {isCancelled ? (
            <div className="flex items-center gap-3 bg-red-50 p-4 rounded-xl">
              <AlertCircle className="w-8 h-8 text-red-500" />
              <div>
                <p className="font-semibold text-red-700">Order Cancelled</p>
                <p className="text-sm text-red-600">This order has been cancelled</p>
              </div>
            </div>
          ) : (
            <div className="relative">
              {/* Progress Line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              <div
                className="absolute left-6 top-0 w-0.5 bg-indigo-500 transition-all duration-700 ease-out"
                style={{ height: `${Math.max(0, (currentStepIndex / (STATUS_STEPS.length - 1)) * 100)}%` }}
              ></div>

              {/* Steps */}
              <div className="space-y-6">
                {STATUS_STEPS.map((step, index) => {
                  const isCompleted = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  const Icon = step.icon;

                  return (
                    <div key={step.key} className="flex items-start gap-4 relative">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center z-10 transition-all duration-300 ${
                          isCompleted
                            ? "bg-indigo-500 text-white shadow-lg"
                            : "bg-gray-100 text-gray-400"
                        } ${isCurrent ? "ring-4 ring-indigo-200 scale-110" : ""}`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 pt-2">
                        <p className={`font-semibold ${isCompleted ? "text-gray-900" : "text-gray-400"}`}>
                          {step.label}
                        </p>
                        <p className={`text-sm ${isCompleted ? "text-gray-600" : "text-gray-400"}`}>
                          {step.description}
                        </p>
                        {isCurrent && (
                          <p className="text-sm text-indigo-600 font-medium mt-1 animate-pulse">
                            ● Current Status
                          </p>
                        )}
                      </div>
                      {isCompleted && !isCurrent && (
                        <CheckCircle className="w-5 h-5 text-green-500 mt-2" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h2>
          
          <div className="space-y-4">
            {/* File Info */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="bg-indigo-100 p-2 rounded-lg">
                <FileText className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 break-all">
                  {order.file?.name || order.fileName || "Document"}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    <FileText className="w-3 h-3" />
                    {pages} pages
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                    <Copy className="w-3 h-3" />
                    {copies} copies
                  </span>
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                    isColor ? "bg-orange-100 text-orange-700" : "bg-gray-200 text-gray-700"
                  }`}>
                    <Palette className="w-3 h-3" />
                    {isColor ? "Color" : "B&W"}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    <BookOpen className="w-3 h-3" />
                    {isDoubleSided ? "Double-sided" : "Single-sided"}
                  </span>
                </div>
              </div>
            </div>

            {/* Date */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="bg-green-100 p-2 rounded-lg">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Placed on</p>
                <p className="font-medium text-gray-900">{formatDate(order.createdAt)}</p>
              </div>
            </div>

            {/* Payment */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="bg-purple-100 p-2 rounded-lg">
                <CreditCard className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment Method</p>
                <p className="font-medium text-gray-900">
                  {order.paymentMethod === "cod" ? "Pay on Delivery" : order.paymentMethod?.toUpperCase() || "Online"}
                </p>
              </div>
            </div>

            {/* Total */}
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 flex items-center gap-2">
                  <IndianRupee className="w-5 h-5" />
                  Total Amount
                </span>
                <span className="text-2xl font-bold text-indigo-600">
                  ₹{totalCost.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Shop Info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Print Shop</h2>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <span className="font-medium text-gray-700">
                {order.shop?.businessName || order.shopName || "Print Shop"}
              </span>
            </div>
            {(order.shop?.phone || order.shop?.contact || order.shop?.owner?.phone) && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Phone className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Contact Shop</p>
                    <p className="font-medium text-gray-900">
                      {order.shop.phone || order.shop.contact || order.shop.owner?.phone}
                    </p>
                  </div>
                </div>
                <a
                  href={`tel:${order.shop.phone || order.shop.contact || order.shop.owner?.phone}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  Call Shop
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
          <h3 className="font-semibold text-blue-800 mb-2">Need Help?</h3>
          <p className="text-sm text-blue-700">
            If you have any questions about your order, contact the shop directly or reach out to our support team.
          </p>
        </div>
      </div>
      
      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Rate Your Experience</h3>
                <p className="text-sm text-gray-500 mt-1">How was your experience with {order.shop?.businessName || order.shop?.name || 'this shop'}?</p>
              </div>
              <button 
                onClick={() => setShowRatingModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            {/* Star Rating */}
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 ${
                      star <= (hoverRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            
            {/* Rating Label */}
            <div className="text-center mb-4">
              <span className={`text-lg font-semibold ${rating > 0 ? "text-gray-900" : "text-gray-400"}`}>
                {rating === 0 && "Tap a star to rate"}
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Very Good"}
                {rating === 5 && "Excellent!"}
              </span>
            </div>
            
            {/* Comment */}
            <textarea
              placeholder="Share your experience (optional)"
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent mb-4"
              rows={3}
            />
            
            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowRatingModal(false)}
                className="flex-1 py-3 px-4 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Skip
              </button>
              <button
                onClick={submitRating}
                disabled={rating === 0 || submittingRating}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
                  rating === 0 || submittingRating
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                }`}
              >
                {submittingRating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Rating"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTracking;
