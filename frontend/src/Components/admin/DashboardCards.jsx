import React, { useState, useEffect } from "react";
import {
  Users,
  ShoppingCart,
  Printer,
  DollarSign,
  Star,
  TrendingUp,
  TrendingDown,
  Loader2,
} from "lucide-react";
import adminService from "../../services/admin.service";

const DashboardCards = ({ timeRange }) => {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Icon mapping for metrics
  const iconMap = {
    "Total Revenue": DollarSign,
    "Total Orders": ShoppingCart,
    "Active Partners": Printer,
    "Active Users": Users,
    "Avg Order Value": DollarSign,
    "Satisfaction Rate": Star,
  };

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const data = await adminService.getDashboardSummary();
        // Add icons to metrics from API response
        const metricsWithIcons = (data.metrics || []).map((metric) => ({
          ...metric,
          icon: iconMap[metric.title] || DollarSign,
        }));
        setMetrics(metricsWithIcons);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch dashboard metrics:", err);
        setError("Failed to load metrics");
        // Fallback to default metrics on error
        setMetrics([
          { title: "Total Revenue", value: "₹0", change: "+0%", trend: "up", icon: DollarSign, description: "This month" },
          { title: "Total Orders", value: "0", change: "+0%", trend: "up", icon: ShoppingCart, description: "This month" },
          { title: "Active Partners", value: "0", change: "+0%", trend: "up", icon: Printer, description: "Print shops" },
          { title: "Active Users", value: "0", change: "+0%", trend: "up", icon: Users, description: "Students" },
          { title: "Avg Order Value", value: "₹0", change: "+0%", trend: "up", icon: DollarSign, description: "Per order" },
          { title: "Satisfaction Rate", value: "0/5", change: "+0", trend: "up", icon: Star, description: "Based on 0 reviews" },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [timeRange]);

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

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 animate-pulse">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 bg-gray-200 rounded-lg" />
              <div className="w-16 h-4 bg-gray-200 rounded" />
            </div>
            <div className="space-y-2">
              <div className="w-24 h-8 bg-gray-200 rounded" />
              <div className="w-20 h-4 bg-gray-200 rounded" />
              <div className="w-16 h-3 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {metrics.map((metric) => (
        <MetricCard key={metric.title} {...metric} />
      ))}
    </div>
  );
};

export default DashboardCards;

