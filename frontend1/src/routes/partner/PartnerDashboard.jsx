import React from "react";
import {
  Printer,
  Clock,
  CheckCircle,
  Package,
  ChevronRight,
} from "lucide-react";
import RecentOrders from "../../Components/RecentOrders";
import TodaySchedule from "../../Components/TodaySchedule";
import StudentInteractions from "../../Components/StudentInteractions";
import { usePartnerOrders } from "../../hooks/usePartnerOrders.jsx";

const PartnerDashboard = () => {
  const { orders } = usePartnerOrders();

  const newOrders = orders.filter(order => order.status === 'pending').length;
  const inProgress = orders.filter(order => order.status === 'accepted' || order.status === 'printing').length;
  const readyForPickup = orders.filter(order => order.status === 'completed').length;
  const completedToday = orders.filter(order => {
    const today = new Date();
    const orderDate = new Date(order.updatedAt);
    return order.status === 'completed' &&
           orderDate.toDateString() === today.toDateString();
  }).length;

  const stats = [
    {
      number: newOrders,
      label: "New Orders",
      icon: Package,
      color: "bg-blue-50 border-blue-200",
      iconColor: "text-blue-600",
      countColor: "bg-blue-100 text-blue-800",
    },
    {
      number: inProgress,
      label: "In Progress",
      icon: Printer,
      color: "bg-amber-50 border-amber-200",
      iconColor: "text-amber-600",
      countColor: "bg-amber-100 text-amber-800",
    },
    {
      number: readyForPickup,
      label: "Ready for Pickup",
      icon: Clock,
      color: "bg-green-50 border-green-200",
      iconColor: "text-green-600",
      countColor: "bg-green-100 text-green-800",
    },
    {
      number: completedToday,
      label: "Completed Today",
      icon: CheckCircle,
      color: "bg-purple-50 border-purple-200",
      iconColor: "text-purple-600",
      countColor: "bg-purple-100 text-purple-800",
    },
  ];

  return (
    <div className="min-h-screen max-w-[85rem] mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 bg-gray-50">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          Dashboard
        </h1>
        <p className="text-gray-600 mt-1 text-xs sm:text-sm">
          Welcome back! Here's what's happening with your print shop today.
        </p>
      </div>

      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className={`p-3 sm:p-4 rounded-lg bg-white border transition-all hover:shadow-md`}
          >
            <div className="flex justify-between items-start mb-2 sm:mb-3">
              <div
                className={`p-1.5 sm:p-2 rounded-md ${stat.color} border border-gray-200 shadow-sm`}
              >
                <stat.icon
                  className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.iconColor}`}
                />
              </div>
              <span
                className={`text-xs sm:text-sm font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ${stat.countColor}`}
              >
                {stat.number}
              </span>
            </div>
            <h3 className="font-medium text-gray-800 mb-1 sm:mb-2 text-xs sm:text-sm">
              {stat.label}
            </h3>
            {}
            {}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <RecentOrders />
        </div>
        <div>
          <StudentInteractions />
        </div>
      </div>

      <TodaySchedule />
    </div>
  );
};

export default PartnerDashboard;
