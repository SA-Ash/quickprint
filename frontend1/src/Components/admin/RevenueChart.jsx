import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  LineChart,
  Line,
} from "recharts";

const RevenueChart = ({ timeRange, detailed = false }) => {
  const revenueData = [
    { name: "Jan", revenue: 45000, orders: 320, profit: 12000 },
    { name: "Feb", revenue: 52000, orders: 380, profit: 15600 },
    { name: "Mar", revenue: 48000, orders: 350, profit: 14400 },
    { name: "Apr", revenue: 61000, orders: 420, profit: 18300 },
    { name: "May", revenue: 58000, orders: 390, profit: 17400 },
    { name: "Jun", revenue: 72000, orders: 480, profit: 21600 },
  ];

  const revenueByCollege = [
    { name: "Engineering", value: 45, revenue: 324000 },
    { name: "Business", value: 25, revenue: 180000 },
    { name: "Arts", value: 15, revenue: 108000 },
    { name: "Medical", value: 10, revenue: 72000 },
    { name: "Others", value: 5, revenue: 36000 },
  ];

  const paymentMethods = [
    { method: "UPI", value: 55, amount: 396000 },
    { method: "Card", value: 25, amount: 180000 },
    { method: "Cash", value: 15, amount: 108000 },
    { method: "Wallet", value: 5, amount: 36000 },
  ];

  const COLORS = ["#141d2f", "#2d3748", "#4a5568", "#718096", "#a0aec0"];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}:{" "}
              {entry.name.includes("revenue") ||
              entry.name.includes("profit") ||
              entry.name.includes("amount")
                ? `₹${entry.value.toLocaleString()}`
                : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (!detailed) {
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
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">
            Revenue Analytics
          </h3>
          <p className="text-gray-600 mt-1">
            Comprehensive revenue analysis and insights
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#141d2f] focus:border-[#141d2f]">
            <option>Last 6 Months</option>
            <option>Last Year</option>
            <option>All Time</option>
          </select>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="text-sm text-gray-600 mb-2">Total Revenue</div>
          <div className="text-2xl font-bold text-[#141d2f]">₹7.2L</div>
          <div className="text-sm text-green-600 mt-1">+18.2% growth</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="text-sm text-gray-600 mb-2">Total Profit</div>
          <div className="text-2xl font-bold text-[#141d2f]">₹2.16L</div>
          <div className="text-sm text-green-600 mt-1">30% margin</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="text-sm text-gray-600 mb-2">Avg Order Value</div>
          <div className="text-2xl font-bold text-[#141d2f]">₹99.80</div>
          <div className="text-sm text-green-600 mt-1">+5.1% increase</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="text-sm text-gray-600 mb-2">Orders Completed</div>
          <div className="text-2xl font-bold text-[#141d2f]">3,248</div>
          <div className="text-sm text-green-600 mt-1">98.2% success rate</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-6">
            Revenue & Profit Trend
          </h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                <YAxis
                  stroke="#6b7280"
                  fontSize={12}
                  tickFormatter={(value) => `₹${value / 1000}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  fill="#141d2f"
                  stroke="#141d2f"
                  fillOpacity={0.1}
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  fill="#4a5568"
                  stroke="#4a5568"
                  fillOpacity={0.1}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-6">
            Revenue Distribution by College
          </h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={revenueByCollege}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} (${(percent * 100).toFixed(0)}%)`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {revenueByCollege.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => {
                    if (name === "value") return [`${value}%`, "Revenue Share"];
                    return [`₹${value.toLocaleString()}`, "Revenue Amount"];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-6">
            Payment Methods Distribution
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentMethods}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="method" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip />
                <Bar dataKey="value" fill="#141d2f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-6">
            Monthly Growth Rate
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#141d2f"
                  strokeWidth={2}
                  dot={{ fill: "#141d2f", strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900">
            College Revenue Breakdown
          </h4>
          <p className="text-gray-600 text-sm mt-1">
            Detailed revenue distribution across colleges
          </p>
        </div>
        <div className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  College
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Revenue Share
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Revenue Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Avg Order Value
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Growth
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {revenueByCollege.map((college, index) => (
                <tr
                  key={college.name}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {college.name}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-3">
                        <div
                          className="bg-[#141d2f] h-2 rounded-full"
                          style={{ width: `${college.value}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">
                        {college.value}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-900">
                    ₹{college.revenue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {college.name === "Engineering"
                      ? "₹104.50"
                      : college.name === "Business"
                      ? "₹105.20"
                      : college.name === "Arts"
                      ? "₹84.30"
                      : college.name === "Medical"
                      ? "₹92.80"
                      : "₹88.50"}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-green-600 font-medium">
                      {college.name === "Engineering"
                        ? "+15.2%"
                        : college.name === "Business"
                        ? "+12.8%"
                        : college.name === "Arts"
                        ? "+8.5%"
                        : college.name === "Medical"
                        ? "+18.3%"
                        : "+6.7%"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RevenueChart;
