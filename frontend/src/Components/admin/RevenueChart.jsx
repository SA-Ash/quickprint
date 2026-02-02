import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import adminService from "../../services/admin.service";

const RevenueChart = ({ timeRange, detailed = false }) => {
  const [revenueData, setRevenueData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await adminService.getRevenueTrends();
        // Transform API data for chart format
        const chartData = (data.trends || []).map((item) => ({
          name: item.month,
          revenue: item.revenue,
          orders: item.orders,
        }));
        setRevenueData(chartData);
      } catch (err) {
        console.error("Failed to fetch revenue trends:", err);
        // Fallback to empty data
        setRevenueData([
          { name: "Jan", revenue: 0, orders: 0 },
          { name: "Feb", revenue: 0, orders: 0 },
          { name: "Mar", revenue: 0, orders: 0 },
          { name: "Apr", revenue: 0, orders: 0 },
          { name: "May", revenue: 0, orders: 0 },
          { name: "Jun", revenue: 0, orders: 0 },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}:{" "}
              {entry.name === "revenue"
                ? `₹${entry.value.toLocaleString()}`
                : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Revenue Overview
            </h3>
            <p className="text-gray-600 text-sm">Monthly revenue trends</p>
          </div>
        </div>
        <div className="h-80 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Loading chart...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Revenue Overview
          </h3>
          <p className="text-gray-600 text-sm">Monthly revenue trends</p>
        </div>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-[#141d2f] rounded-full mr-2"></div>
            <span>Revenue</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-[#e2e8f0] rounded-full mr-2 border border-gray-300"></div>
            <span>Orders</span>
          </div>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
            <YAxis
              yAxisId="left"
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => `₹${value / 1000}k`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#6b7280"
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              yAxisId="left"
              dataKey="revenue"
              fill="#141d2f"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              yAxisId="right"
              dataKey="orders"
              fill="#e2e8f0"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueChart;
