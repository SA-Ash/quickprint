import React, { useState } from "react";
import {
  Users,
  TrendingUp,
  TrendingDown,
  MapPin,
  BookOpen,
  Calendar,
  UserPlus,
  Activity,
  Target,
} from "lucide-react";
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
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";

const UserInsights = ({ timeRange }) => {
  const [activeView, setActiveView] = useState("overview");

  const userMetrics = [
    { metric: "Total Users", value: "8,742", change: "+15.3%", trend: "up" },
    { metric: "Active Today", value: "324", change: "+8.2%", trend: "up" },
    { metric: "New This Month", value: "720", change: "+12.5%", trend: "up" },
    { metric: "Retention Rate", value: "87.2%", change: "+3.1%", trend: "up" },
  ];

  const userGrowth = [
    { month: "Jan", newUsers: 450, activeUsers: 1250, returningUsers: 800 },
    { month: "Feb", newUsers: 520, activeUsers: 1420, returningUsers: 900 },
    { month: "Mar", newUsers: 480, activeUsers: 1560, returningUsers: 1080 },
    { month: "Apr", newUsers: 610, activeUsers: 1780, returningUsers: 1170 },
    { month: "May", newUsers: 580, activeUsers: 1950, returningUsers: 1370 },
    { month: "Jun", newUsers: 720, activeUsers: 2240, returningUsers: 1520 },
  ];

  const collegeDistribution = [
    { name: "Engineering", value: 45, users: 3500, growth: "+15.2%" },
    { name: "Business", value: 25, users: 1950, growth: "+12.8%" },
    { name: "Arts & Science", value: 15, users: 1170, growth: "+8.5%" },
    { name: "Medical", value: 10, users: 780, growth: "+18.3%" },
    { name: "Others", value: 5, users: 390, growth: "+6.7%" },
  ];

  const engagementData = [
    { metric: "Avg Session Duration", value: "4.2min", target: "5.0min" },
    { metric: "Pages per Session", value: "3.8", target: "4.5" },
    { metric: "Uploads per User", value: "2.8", target: "3.2" },
    { metric: "Repeat Order Rate", value: "67.8%", target: "70%" },
    { metric: "Feature Adoption", value: "42.5%", target: "50%" },
  ];

  const userBehavior = [
    { hour: "8AM", active: 45, new: 12 },
    { hour: "10AM", active: 89, new: 24 },
    { hour: "12PM", active: 124, new: 38 },
    { hour: "2PM", active: 76, new: 18 },
    { hour: "4PM", active: 98, new: 26 },
    { hour: "6PM", active: 145, new: 42 },
    { hour: "8PM", active: 67, new: 15 },
  ];

  const COLORS = ["#141d2f", "#2d3748", "#4a5568", "#718096", "#a0aec0"];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">User Analytics</h3>
          <p className="text-gray-600 mt-1">
            Comprehensive user behavior and engagement insights
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#141d2f] focus:border-[#141d2f]">
            <option>Last 6 Months</option>
            <option>Last Year</option>
            <option>All Time</option>
          </select>
          <div className="flex items-center space-x-2">
            {["overview", "growth", "engagement", "demographics"].map(
              (view) => (
                <button
                  key={view}
                  onClick={() => setActiveView(view)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg capitalize ${
                    activeView === view
                      ? "bg-[#141d2f] text-white"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  {view}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {activeView === "overview" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {userMetrics.map((metric, index) => (
              <div
                key={metric.metric}
                className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-6 h-6 text-[#141d2f]" />
                  <div
                    className={`flex items-center text-sm font-medium ${
                      metric.trend === "up" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {metric.trend === "up" ? (
                      <TrendingUp className="w-4 h-4 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 mr-1" />
                    )}
                    {metric.change}
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {metric.value}
                </div>
                <div className="text-sm text-gray-600">{metric.metric}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-6">
                User Growth Trends
              </h4>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="activeUsers"
                      fill="#141d2f"
                      stroke="#141d2f"
                      fillOpacity={0.1}
                    />
                    <Area
                      type="monotone"
                      dataKey="returningUsers"
                      fill="#4a5568"
                      stroke="#4a5568"
                      fillOpacity={0.1}
                    />
                    <Area
                      type="monotone"
                      dataKey="newUsers"
                      fill="#718096"
                      stroke="#718096"
                      fillOpacity={0.1}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-6">
                User Distribution by College
              </h4>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={collegeDistribution}
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
                      {collegeDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [
                        name === "value" ? `${value}%` : value,
                        name === "value" ? "Percentage" : "Users",
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeView === "growth" && (
        <div className="space-y-8">
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-6">
              Detailed User Growth Analysis
            </h4>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="newUsers"
                    fill="#141d2f"
                    name="New Users"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="activeUsers"
                    fill="#4a5568"
                    name="Active Users"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="returningUsers"
                    fill="#718096"
                    name="Returning Users"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Growth Metrics
              </h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Monthly Growth Rate</span>
                  <span className="font-semibold text-green-600">+12.5%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">User Acquisition Cost</span>
                  <span className="font-semibold text-gray-900">₹45.20</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Lifetime Value</span>
                  <span className="font-semibold text-gray-900">₹285.60</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Referral Rate</span>
                  <span className="font-semibold text-gray-900">18.3%</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Daily Activity Pattern
              </h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={userBehavior}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="hour" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="active"
                      stroke="#141d2f"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="new"
                      stroke="#4a5568"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeView === "engagement" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-6">
                Engagement Metrics vs Targets
              </h4>
              <div className="space-y-6">
                {engagementData.map((item, index) => (
                  <div key={item.metric}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-700">{item.metric}</span>
                      <span className="font-semibold text-gray-900">
                        {item.value}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-[#141d2f] h-2 rounded-full"
                        style={{
                          width: `${
                            (parseFloat(item.value) / parseFloat(item.target)) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Target: {item.target}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-6">
                User Activity Heatmap
              </h4>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={userBehavior}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="hour" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip />
                    <Bar
                      dataKey="active"
                      fill="#141d2f"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeView === "demographics" && (
        <div className="space-y-8">
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900">
                College-wise User Distribution
              </h4>
              <p className="text-gray-600 text-sm mt-1">
                Detailed breakdown of users across colleges
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
                      User Share
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Total Users
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Growth Rate
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Avg Orders
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {collegeDistribution.map((college, index) => (
                    <tr
                      key={college.name}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-[#141d2f] rounded flex items-center justify-center">
                            <BookOpen className="w-4 h-4 text-white" />
                          </div>
                          <span className="font-medium text-gray-900">
                            {college.name}
                          </span>
                        </div>
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
                        {college.users.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-green-600 font-medium">
                          {college.growth}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {college.name === "Engineering"
                          ? "2.8"
                          : college.name === "Business"
                          ? "2.6"
                          : college.name === "Arts & Science"
                          ? "2.1"
                          : college.name === "Medical"
                          ? "2.4"
                          : "1.9"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserInsights;
