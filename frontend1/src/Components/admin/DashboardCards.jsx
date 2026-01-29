import React from "react";
import {
  Users,
  ShoppingCart,
  Printer,
  DollarSign,
  Star,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

const DashboardCards = ({ timeRange }) => {
  const metrics = [
    {
      title: "Total Revenue",
      value: "₹1,24,856",
      change: "+12.5%",
      trend: "up",
      icon: DollarSign,
      description: `This ${timeRange}`,
    },
    {
      title: "Total Orders",
      value: "1,248",
      change: "+8.2%",
      trend: "up",
      icon: ShoppingCart,
      description: `This ${timeRange}`,
    },
    {
      title: "Active Partners",
      value: "42",
      change: "+2",
      trend: "up",
      icon: Printer,
      description: "Print shops",
    },
    {
      title: "Active Users",
      value: "8,742",
      change: "+15.3%",
      trend: "up",
      icon: Users,
      description: "Students",
    },
    {
      title: "Avg Order Value",
      value: "₹99.80",
      change: "+5.1%",
      trend: "up",
      icon: DollarSign,
      description: "Per order",
    },
    {
      title: "Satisfaction Rate",
      value: "4.7/5",
      change: "+0.2",
      trend: "up",
      icon: Star,
      description: "Based on 1.2k reviews",
    },
  ];

  const MetricCard = ({
    title,
    value,
    change,
    trend,
    icon: Icon,
    description,
  }) => {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 rounded-lg bg-gray-100 text-gray-600">
            <Icon className="w-4 h-4" />
          </div>
          <div
            className={`flex items-center text-sm font-medium ${
              trend === "up" ? "text-green-600" : "text-red-600"
            }`}
          >
            {trend === "up" ? (
              <TrendingUp className="w-4 h-4 mr-1" />
            ) : (
              <TrendingDown className="w-4 h-4 mr-1" />
            )}
            {change}
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
          <p className="text-sm font-medium text-gray-900">{title}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {metrics.map((metric) => (
        <MetricCard key={metric.title} {...metric} />
      ))}
    </div>
  );
};

export default DashboardCards;
