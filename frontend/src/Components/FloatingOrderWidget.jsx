import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Printer, X, ChevronUp, Clock, CheckCircle, Package } from "lucide-react";
import { useOrders } from "../hooks/useOrders.jsx";

const STATUS_INFO = {
  PENDING: { label: "Pending", color: "yellow", icon: Clock },
  ACCEPTED: { label: "Accepted", color: "blue", icon: CheckCircle },
  PRINTING: { label: "Printing", color: "purple", icon: Printer },
  READY: { label: "Ready", color: "green", icon: Package },
  COMPLETED: { label: "Completed", color: "green", icon: CheckCircle },
  CANCELLED: { label: "Cancelled", color: "red", icon: X },
};

const FloatingOrderWidget = () => {
  const navigate = useNavigate();
  const { orders } = useOrders();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Get the most recent active order
  const activeOrder = orders?.find(
    (o) => !["COMPLETED", "CANCELLED"].includes(o.status)
  );

  if (!activeOrder || isDismissed) return null;

  const statusInfo = STATUS_INFO[activeOrder.status] || STATUS_INFO.PENDING;
  const StatusIcon = statusInfo.icon;

  const getStatusColor = () => {
    switch (statusInfo.color) {
      case "yellow": return "bg-yellow-500";
      case "blue": return "bg-blue-500";
      case "purple": return "bg-purple-500";
      case "green": return "bg-green-500";
      case "red": return "bg-red-500";
      default: return "bg-indigo-500";
    }
  };

  const getBgColor = () => {
    switch (statusInfo.color) {
      case "yellow": return "bg-yellow-50 border-yellow-200";
      case "blue": return "bg-blue-50 border-blue-200";
      case "purple": return "bg-purple-50 border-purple-200";
      case "green": return "bg-green-50 border-green-200";
      case "red": return "bg-red-50 border-red-200";
      default: return "bg-indigo-50 border-indigo-200";
    }
  };

  const handleClick = () => {
    if (isExpanded) {
      navigate(`/order/${activeOrder.id}`);
    } else {
      setIsExpanded(true);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Expanded View */}
      {isExpanded ? (
        <div
          className={`${getBgColor()} border-2 rounded-2xl p-4 shadow-xl cursor-pointer transform transition-all duration-300 hover:scale-105 max-w-xs`}
          onClick={handleClick}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={`${getStatusColor()} p-1.5 rounded-lg`}>
                <StatusIcon className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {statusInfo.label}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(false);
              }}
              className="p-1 hover:bg-black/10 rounded-full transition-colors"
            >
              <ChevronUp className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <p className="text-xs text-gray-600 truncate">
            {activeOrder.file?.name || activeOrder.fileName || "Your order"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            #{activeOrder.orderNumber}
          </p>
          <p className="text-xs text-indigo-600 mt-2 font-medium">
            Tap to view details →
          </p>
        </div>
      ) : (
        /* Collapsed Icon View */
        <div className="relative">
          <button
            onClick={handleClick}
            className={`${getStatusColor()} p-4 rounded-full shadow-xl hover:scale-110 transition-transform relative`}
          >
            <Printer className="w-6 h-6 text-white" />
            {/* Pulse animation */}
            <span className={`absolute inset-0 ${getStatusColor()} rounded-full animate-ping opacity-30`}></span>
          </button>
          {/* Dismiss button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsDismissed(true);
            }}
            className="absolute -top-1 -right-1 bg-gray-800 text-white p-1 rounded-full hover:bg-gray-700 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};

export default FloatingOrderWidget;
