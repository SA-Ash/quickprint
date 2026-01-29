import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

const OrderAnalytics = ({ timeRange, detailed = false }) => {
  const orderTrends = [
    { hour: "8AM", orders: 45 },
    { hour: "10AM", orders: 89 },
    { hour: "12PM", orders: 124 },
    { hour: "2PM", orders: 76 },
    { hour: "4PM", orders: 98 },
    { hour: "6PM", orders: 145 },
    { hour: "8PM", orders: 67 },
  ];

  const performanceMetrics = [
    { metric: "Total Orders", value: "3,248", change: "+12%" },
    { metric: "Success Rate", value: "98.2%", change: "+2%" },
    { metric: "Avg. Response", value: "28s", change: "-5s" },
    { metric: "Revenue", value: "₹1.2L", change: "+18%" },
  ];

  const recentOrders = [
    {
      id: "#QP-1248",
      user: "Raj Kumar",
      partner: "Campus Print",
      amount: "₹85",
      time: "2 min ago",
      status: "Completed",
    },
    {
      id: "#QP-1247",
      user: "Priya Singh",
      partner: "Tech Prints",
      amount: "₹120",
      time: "15 min ago",
      status: "Processing",
    },
    {
      id: "#QP-1246",
      user: "Amit Sharma",
      partner: "Quick Copy",
      amount: "₹65",
      time: "25 min ago",
      status: "Ready",
    },
    {
      id: "#QP-1245",
      user: "Neha Patel",
      partner: "Student Print",
      amount: "₹95",
      time: "40 min ago",
      status: "Processing",
    },
  ];

  if (!detailed) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Order Analytics
          </h3>
          <div className="text-sm text-gray-600">
            Total:{" "}
            <span className="font-semibold text-gray-900">3,248 orders</span>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={orderTrends}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="hour" />
              <YAxis />
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
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Order Management</h3>
          <p className="text-gray-600 mt-1">
            Comprehensive order performance overview
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 bg-white">
            <option>All Orders</option>
            <option>Today</option>
            <option>This Week</option>
            <option>This Month</option>
          </select>
          <button className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
            Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        {performanceMetrics.map((item, index) => (
          <div
            key={index}
            className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
          >
            <div className="text-sm text-gray-600 mb-2">{item.metric}</div>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold text-gray-900">
                {item.value}
              </div>
              <div
                className={`text-sm font-medium ${
                  item.change.startsWith("+")
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {item.change}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
        <div className="xl:col-span-2 bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-6">
            Order Volume Trends
          </h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={orderTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="hour" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Bar dataKey="orders" fill="#141d2f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-6">
            Performance Metrics
          </h4>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700">Processing Time</span>
                <span className="font-semibold text-gray-900">28 min</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gray-700 h-2 rounded-full"
                  style={{ width: "85%" }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700">Order Accuracy</span>
                <span className="font-semibold text-gray-900">99.1%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gray-700 h-2 rounded-full"
                  style={{ width: "99%" }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700">Customer Satisfaction</span>
                <span className="font-semibold text-gray-900">4.8/5</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gray-700 h-2 rounded-full"
                  style={{ width: "96%" }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700">Repeat Rate</span>
                <span className="font-semibold text-gray-900">67.8%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gray-700 h-2 rounded-full"
                  style={{ width: "68%" }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900">Recent Orders</h4>
          <p className="text-gray-600 text-sm mt-1">
            Latest order activities and status
          </p>
        </div>
        <div className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Order Details
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Partner
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentOrders.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">
                        {order.id}
                      </div>
                      <div className="text-sm text-gray-600">{order.user}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {order.partner}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-gray-900">
                      {order.amount}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        order.status === "Completed"
                          ? "bg-gray-100 text-gray-800"
                          : order.status === "Processing"
                          ? "bg-gray-100 text-gray-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {order.time}
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

export default OrderAnalytics;
