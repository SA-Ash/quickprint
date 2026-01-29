import React from "react";
import { User, ShoppingCart, Printer, DollarSign, Clock } from "lucide-react";

const RecentActivity = () => {
  const activities = [
    {
      id: 1,
      user: "Raj Kumar",
      action: "placed a new order",
      target: "#QP-1248",
      time: "2 minutes ago",
      icon: ShoppingCart,
    },
    {
      id: 2,
      user: "Campus Print Center",
      action: "received payment",
      target: "₹2,450",
      time: "15 minutes ago",
      icon: DollarSign,
    },
    {
      id: 3,
      user: "System",
      action: "completed print job",
      target: "#QP-1247",
      time: "25 minutes ago",
      icon: Printer,
    },
    {
      id: 4,
      user: "Priya Singh",
      action: "registered new account",
      target: "Business School",
      time: "1 hour ago",
      icon: User,
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Recent Activity
          </h3>
          <p className="text-gray-600 text-sm">
            Latest system and user activities
          </p>
        </div>
        <button className="text-gray-600 text-sm font-medium hover:text-gray-900">
          View All
        </button>
      </div>

      <div className="space-y-3">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="p-2 rounded-lg bg-gray-100 text-gray-600">
              <activity.icon className="w-4 h-4" />
            </div>

            <div className="flex-1 min-w-0">
              <div>
                <p className="text-sm text-gray-900">
                  <span className="font-medium">{activity.user}</span>{" "}
                  {activity.action}{" "}
                  <span className="font-semibold">{activity.target}</span>
                </p>
                <div className="flex items-center mt-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3 mr-1" />
                  {activity.time}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentActivity;
