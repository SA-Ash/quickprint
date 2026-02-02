import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import adminService from "../../services/admin.service";

const OrderAnalytics = ({ timeRange, detailed = false }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await adminService.getOrderAnalytics();
        setAnalytics(data);
      } catch (err) {
        console.error("Failed to fetch order analytics:", err);
        setAnalytics({
          total: 0,
          byStatus: {
            PENDING: 0,
            ACCEPTED: 0,
            PRINTING: 0,
            READY: 0,
            COMPLETED: 0,
            CANCELLED: 0,
          },
          completionRate: "0",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  // Generate chart data from status breakdown
  const getChartData = () => {
    if (!analytics) return [];
    const statuses = ["PENDING", "ACCEPTED", "PRINTING", "READY", "COMPLETED", "CANCELLED"];
    return statuses.map((status) => ({
      status: status.charAt(0) + status.slice(1).toLowerCase(),
      orders: analytics.byStatus?.[status] || 0,
    }));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Order Analytics
          </h3>
          <div className="text-sm text-gray-600">Loading...</div>
        </div>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Loading chart...</div>
        </div>
      </div>
    );
  }

  const chartData = getChartData();
  const totalOrders = analytics?.total || 0;
  const completionRate = analytics?.completionRate || "0";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Order Analytics
        </h3>
        <div className="text-sm text-gray-600">
          Total:{" "}
          <span className="font-semibold text-gray-900">{totalOrders.toLocaleString()} orders</span>
        </div>
      </div>

      {/* Status breakdown */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-lg font-bold text-gray-900">
            {analytics?.byStatus?.PENDING || 0}
          </div>
          <div className="text-xs text-yellow-600">Pending</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-lg font-bold text-gray-900">
            {(analytics?.byStatus?.ACCEPTED || 0) + (analytics?.byStatus?.PRINTING || 0)}
          </div>
          <div className="text-xs text-blue-600">Processing</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-lg font-bold text-gray-900">
            {analytics?.byStatus?.COMPLETED || 0}
          </div>
          <div className="text-xs text-green-600">Completed</div>
        </div>
      </div>

      {/* Completion Rate */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">Completion Rate</span>
          <span className="text-sm font-semibold text-gray-900">{completionRate}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-600 h-2 rounded-full transition-all"
            style={{ width: `${Math.min(parseFloat(completionRate), 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="status" fontSize={10} />
            <YAxis fontSize={10} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="orders"
              stroke="#141d2f"
              strokeWidth={2}
              dot={{ fill: "#141d2f", strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default OrderAnalytics;
