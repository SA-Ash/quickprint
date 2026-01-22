import React, { useState } from "react";
import {
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  CreditCard,
  MapPin,
  Bell,
  X,
} from "lucide-react";
import { useOrders } from "../hooks/useOrders.jsx";

const Notifications = () => {
  const [showFullView, setShowFullView] = useState(false);
  const { notifications, markNotificationRead, markAllNotificationsRead, getUnreadCount } = useOrders();

  const unreadCount = getUnreadCount();

  const markAsRead = (id) => {
    markNotificationRead(id);
  };

  const markAllAsRead = () => {
    markAllNotificationsRead();
  };

  const clearAllNotifications = () => {

    setShowFullView(false);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order_created':
        return { icon: FileText, color: 'text-blue-500' };
      case 'status_update':
        return { icon: Clock, color: 'text-amber-500' };
      case 'order_completed':
        return { icon: CheckCircle, color: 'text-green-500' };
      case 'payment':
        return { icon: CreditCard, color: 'text-purple-500' };
      default:
        return { icon: Bell, color: 'text-gray-500' };
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  return (
    <>
      <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-lg shadow-xl py-1 z-50 border border-gray-200">
        <div className="p-3 sm:p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
          <div className="flex items-center">
            <Bell size={16} className="sm:w-4 sm:h-4 text-gray-600 mr-2" />
            <h3 className="font-semibold text-gray-800 text-sm sm:text-base">
              Notifications
            </h3>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium px-1.5 sm:px-2 py-1 hover:bg-blue-50 rounded"
              >
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={clearAllNotifications}
                className="text-xs text-gray-500 hover:text-red-600 font-medium px-1.5 sm:px-2 py-1 hover:bg-gray-100 rounded"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        <div className="max-h-64 sm:max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 sm:p-6 text-center">
              <div className="bg-gray-100 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                <Bell size={16} className="sm:w-5 sm:h-5 text-gray-400" />
              </div>
              <h4 className="text-xs sm:text-sm font-medium text-gray-700">
                No notifications
              </h4>
              <p className="text-xs text-gray-500 mt-1">
                You're all caught up! New notifications will appear here.
              </p>
            </div>
          ) : (
            notifications.slice(0, 4).map((notification) => {
              const { icon: IconComponent, color: iconColor } = getNotificationIcon(notification.type);
              return (
                <div
                  key={notification.id}
                  className={`p-3 sm:p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.read ? "bg-blue-50" : ""
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start">
                    <div
                      className={`p-1.5 sm:p-2 rounded-full ${iconColor} bg-opacity-20 mr-2 sm:mr-3 flex-shrink-0`}
                    >
                      <IconComponent size={14} className="sm:w-4 sm:h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="text-xs sm:text-sm font-medium text-gray-900">
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <span className="ml-1 sm:ml-2 flex-shrink-0">
                            <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 bg-blue-500 rounded-full inline-block"></span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1 sm:mt-2">
                        {formatTime(notification.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {notifications.length > 0 && (
          <div className="p-2 sm:p-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            <button
              onClick={() => setShowFullView(true)}
              className="w-full text-center text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium py-1.5 sm:py-2 hover:bg-blue-50 rounded"
            >
              View All Notifications
            </button>
          </div>
        )}
      </div>

      {showFullView && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl sm:max-w-3xl md:max-w-4xl h-full max-h-screen overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
              <div className="flex items-center">
                <Bell
                  size={20}
                  className="sm:w-6 sm:h-6 text-blue-600 mr-2 sm:mr-3"
                />
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Notifications
                </h2>
                {unreadCount > 0 && (
                  <span className="ml-2 sm:ml-3 bg-blue-100 text-blue-800 text-xs sm:text-sm font-medium px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full">
                    {unreadCount} unread
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowFullView(false)}
                className="p-1 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="p-3 sm:p-4 border-b border-gray-200 bg-gray-50 flex justify-end">
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Mark all as read
                  </button>
                )}
                <button
                  onClick={clearAllNotifications}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 text-gray-700 text-xs sm:text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Clear all
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 sm:p-4">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="bg-gray-100 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                    <Bell size={20} className="sm:w-6 sm:h-6 text-gray-400" />
                  </div>
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                    No notifications
                  </h3>
                  <p className="text-sm text-gray-500">
                    You're all caught up! New notifications will appear here.
                  </p>
                </div>
              ) : (
                notifications.map((notification) => {
                  const { icon: IconComponent, color: iconColor } = getNotificationIcon(notification.type);
                  return (
                    <div
                      key={notification.id}
                      className={`p-3 sm:p-4 rounded-lg border border-gray-200 hover:border-blue-200 hover:shadow-sm cursor-pointer transition-all ${
                        !notification.read
                          ? "bg-blue-50 border-blue-100"
                          : "bg-white"
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start">
                        <div
                          className={`p-1.5 sm:p-2 rounded-full ${iconColor} bg-opacity-20 mr-3 sm:mr-4 flex-shrink-0`}
                        >
                          <IconComponent
                            size={16}
                            className="sm:w-5 sm:h-5"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <h4 className="text-sm sm:text-base font-medium text-gray-900">
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <span className="ml-2 flex-shrink-0">
                                <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 bg-blue-500 rounded-full inline-block"></span>
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1 sm:mt-2">
                            {formatTime(notification.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Notifications;
