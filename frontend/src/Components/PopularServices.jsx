import React, { useState } from "react";
import { Download, PieChart as LucidePieChart } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const serviceData = [
  {
    service: "Black & White Single Side",
    percentage: 45,
    value: 11250,
    color: "#3b82f6",
  },
  {
    service: "Color Printing Double Side",
    percentage: 30,
    value: 7500,
    color: "#10b981",
  },
  {
    service: "Black & White Double Side",
    percentage: 15,
    value: 3750,
    color: "#facc15",
  },
  {
    service: "Color Printing Double Side",
    percentage: 7,
    value: 1750,
    color: "#8b5cf6",
  },
  { service: "Binding", percentage: 3, value: 750, color: "#ef4444" },
];

const ServicePieChart = ({ hovered, setHovered }) => {
  return (
    <div className="flex items-center justify-center">
      <div className="relative w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={serviceData}
              dataKey="percentage"
              nameKey="service"
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={80}
              paddingAngle={3}

            >
              {serviceData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name, props) => [
                `${value}% • ₹${props.payload.value.toLocaleString()}`,
                name,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-lg sm:text-xl font-bold text-gray-800">
            {hovered ? `${hovered.percentage}%` : "100%"}
          </span>
          <span className="text-xs text-gray-500 mt-1">
            {hovered ? hovered.service : "Total"}
          </span>
        </div>
      </div>
    </div>
  );
};

const PopularServices = () => {
  const [timeRange, setTimeRange] = useState("monthly");
  const [hoveredService, setHoveredService] = useState(null);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-5 md:mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center mb-3 sm:mb-0">
          <LucidePieChart className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
          Popular Services
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

      <div className="flex flex-col md:flex-row items-center justify-between">
        <div className="flex-1 md:flex-none">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">
            Service Distribution
          </h3>
          <p className="text-xs text-gray-500 mb-4 md:mb-0 text-right md:text-left">
            By usage
          </p>
        </div>

        <ServicePieChart

        />

        <div className="w-full md:w-auto mt-4 md:mt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            {serviceData.map((item, index) => (
              <div
                key={index}
                className="flex items-center p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredService(item)}
                onMouseLeave={() => setHoveredService(null)}
              >
                <div
                  className="w-3 h-3 sm:w-4 sm:h-4 rounded-full mr-2"
                  style={{ backgroundColor: item.color }}
                ></div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs sm:text-sm font-medium text-gray-800 truncate">
                    {item.service}
                  </div>
                  <div className="text-xs text-gray-500">
                    {item.percentage}% • ₹{item.value.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-6 sm:mt-8 pt-3 sm:pt-4 border-t border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center mb-3 sm:mb-0">
          <div className="flex items-center mr-0 sm:mr-4 mb-2 sm:mb-0">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">
              250+ orders
            </div>
            <div className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
              +8%
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

export default PopularServices;
