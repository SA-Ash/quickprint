import React, { useMemo } from "react";
import { Download, PieChart as LucidePieChart } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#facc15", "#8b5cf6", "#ef4444", "#f97316"];

const ServicePieChart = ({ serviceData }) => {
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
                `${value}% • ₹${props.payload.value.toLocaleString('en-IN')}`,
                name,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-lg sm:text-xl font-bold text-gray-800">
            100%
          </span>
          <span className="text-xs text-gray-500 mt-1">
            Total
          </span>
        </div>
      </div>
    </div>
  );
};

const PopularServices = ({ orders = [], timeRange = 'monthly' }) => {
  // Filter orders based on time range
  const filteredOrders = useMemo(() => {
    const now = new Date();
    return orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      switch (timeRange) {
        case 'weekly':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return orderDate >= weekAgo;
        case 'monthly':
          const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          return orderDate >= monthAgo;
        case 'yearly':
          const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          return orderDate >= yearAgo;
        default:
          return true;
      }
    });
  }, [orders, timeRange]);

  // Calculate service breakdown from real orders
  const { serviceData, totalOrders, prevOrderCount, trend } = useMemo(() => {
    const services = {
      'B&W Single Side': { count: 0, revenue: 0 },
      'B&W Double Side': { count: 0, revenue: 0 },
      'Color Single Side': { count: 0, revenue: 0 },
      'Color Double Side': { count: 0, revenue: 0 },
    };

    filteredOrders.forEach(order => {
      const isColor = order.printConfig?.color === true;
      const isDoubleSided = order.printConfig?.doubleSided === true;
      const revenue = parseFloat(order.totalCost || 0);
      
      let serviceKey;
      if (isColor && isDoubleSided) {
        serviceKey = 'Color Double Side';
      } else if (isColor) {
        serviceKey = 'Color Single Side';
      } else if (isDoubleSided) {
        serviceKey = 'B&W Double Side';
      } else {
        serviceKey = 'B&W Single Side';
      }
      
      services[serviceKey].count++;
      services[serviceKey].revenue += revenue;
    });

    const totalOrders = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + parseFloat(o.totalCost || 0), 0);

    const serviceData = Object.entries(services)
      .filter(([_, data]) => data.count > 0)
      .map(([name, data], index) => ({
        service: name,
        percentage: totalOrders > 0 ? Math.round((data.count / totalOrders) * 100) : 0,
        value: Math.round(data.revenue),
        color: COLORS[index % COLORS.length],
        count: data.count
      }))
      .sort((a, b) => b.percentage - a.percentage);

    // If no orders, show placeholder
    if (serviceData.length === 0) {
      serviceData.push({
        service: 'No Orders Yet',
        percentage: 100,
        value: 0,
        color: '#e5e7eb',
        count: 0
      });
    }

    // Calculate previous period for trend
    const now = new Date();
    let prevOrderCount = 0;
    orders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      switch (timeRange) {
        case 'weekly':
          const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (orderDate >= twoWeeksAgo && orderDate < weekAgo) prevOrderCount++;
          break;
        case 'monthly':
          const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());
          const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          if (orderDate >= twoMonthsAgo && orderDate < monthAgo) prevOrderCount++;
          break;
        case 'yearly':
          const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
          const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          if (orderDate >= twoYearsAgo && orderDate < yearAgo) prevOrderCount++;
          break;
      }
    });

    const trend = prevOrderCount > 0 
      ? ((totalOrders - prevOrderCount) / prevOrderCount * 100).toFixed(0) 
      : 0;

    return { serviceData, totalOrders, prevOrderCount, trend };
  }, [filteredOrders, orders, timeRange]);

  // Export service data as CSV
  const exportServices = () => {
    const headers = ['Service Type', 'Orders', 'Percentage', 'Revenue (₹)'];
    const csvRows = serviceData.map(item => [
      item.service,
      item.count,
      `${item.percentage}%`,
      item.value
    ]);
    csvRows.push([]);
    csvRows.push(['Total', totalOrders, '100%', serviceData.reduce((sum, s) => sum + s.value, 0)]);

    const csvContent = [
      headers.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', `services_${timeRange}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-5 md:mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center mb-3 sm:mb-0">
          <LucidePieChart className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
          Popular Services
        </h2>
        <button 
          onClick={exportServices}
          className="flex items-center text-xs sm:text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 transition-colors"
        >
          <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
          Export
        </button>
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

        <ServicePieChart serviceData={serviceData} />

        <div className="w-full md:w-auto mt-4 md:mt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            {serviceData.map((item, index) => (
              <div
                key={index}
                className="flex items-center p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
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
                    {item.percentage}% • ₹{item.value.toLocaleString('en-IN')}
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
              {totalOrders} orders
            </div>
            {parseFloat(trend) !== 0 && (
              <div className={`ml-2 px-2 py-1 ${parseFloat(trend) >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} text-xs font-medium rounded-full`}>
                {parseFloat(trend) >= 0 ? '+' : ''}{trend}%
              </div>
            )}
          </div>
          <div className="text-xs sm:text-sm text-gray-500">
            vs previous period
          </div>
        </div>

        <div className="text-xs sm:text-sm text-gray-500">
          Last updated: {new Date().toLocaleString('en-IN', { 
            day: 'numeric', 
            month: 'short', 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
    </div>
  );
};

export default PopularServices;
