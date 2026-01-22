import React, { useState } from "react";
import { Download, TrendingUp } from "lucide-react";

const revenueData = [
  { month: "Jan", revenue: 9800 },
  { month: "Feb", revenue: 10700 },
  { month: "Mar", revenue: 11500 },
  { month: "Apr", revenue: 12500 },
  { month: "May", revenue: 13200 },
  { month: "Jun", revenue: 14200 },
];

const RevenueChart = () => {
  const maxRevenue = Math.max(...revenueData.map((item) => item.revenue));

  return (
    <div className="mt-4 sm:mt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-0">
          Monthly Revenue (in ₹)
        </h3>
        <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500">
          <div className="flex items-center">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full mr-1 sm:mr-2"></div>
            <span>Revenue</span>
          </div>
        </div>
      </div>

      <div className="flex items-end justify-between h-48 sm:h-56 md:h-64 mt-4 sm:mt-6 md:mt-8">
        {revenueData.map((item, index) => (
          <div
            key={index}
            className="flex flex-col items-center w-8 sm:w-10 md:w-12 flex-1"
          >
            <div className="relative flex flex-col items-center group">
              <div
                className="w-6 sm:w-8 md:w-10 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg hover:from-blue-600 hover:to-blue-500 transition-all duration-200 cursor-pointer"
                style={{ height: `${(item.revenue / maxRevenue) * 180}px` }}
              ></div>
              <div className="hidden group-hover:block absolute -top-8 px-2 py-1 bg-gray-800 text-white text-xs rounded-md">
                ₹{item.revenue.toLocaleString()}
              </div>
            </div>
            <span className="text-xs text-gray-500 mt-1 sm:mt-2">
              {item.month}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const RevenueTrends = () => {
  const [timeRange, setTimeRange] = useState("monthly");

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-5 md:mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center mb-3 sm:mb-0">
          <TrendingUp className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
          Revenue Trends
        </h2>

        <div className="flex items-center space-x-2">
          <select
            className="text-xs sm:text-sm border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
          </select>

          <button className="flex items-center text-xs sm:text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 transition-colors">
            <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
            Export
          </button>
        </div>
      </div>

      <RevenueChart />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-6 sm:mt-8 pt-3 sm:pt-4 border-t border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center mb-3 sm:mb-0">
          <div className="flex items-center mr-0 sm:mr-4 mb-2 sm:mb-0">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">
              ₹12,500
            </div>
            <div className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
              +12%
            </div>
          </div>
          <div className="text-xs sm:text-sm text-gray-500">
            vs previous month
          </div>
        </div>

        <div className="text-xs sm:text-sm text-gray-500">
          Last updated: Today, 10:30 AM
        </div>
      </div>
    </div>
  );
};

export default RevenueTrends;

