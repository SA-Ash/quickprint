import React, { useMemo } from "react";
import { Download, TrendingUp } from "lucide-react";

const RevenueTrends = ({ orders = [], timeRange = 'monthly' }) => {
  // Generate revenue data based on time range
  const { revenueData, totalRevenue, prevRevenue, trend } = useMemo(() => {
    const now = new Date();
    
    if (timeRange === 'weekly') {
      // Last 7 days
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dayOrders = orders.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate.toDateString() === date.toDateString();
        });
        const dayRevenue = dayOrders.reduce((sum, o) => sum + parseFloat(o.totalCost || 0), 0);
        days.push({
          label: date.toLocaleDateString('en-IN', { weekday: 'short' }),
          revenue: dayRevenue
        });
      }
      const totalRevenue = days.reduce((sum, d) => sum + d.revenue, 0);
      
      // Previous week for comparison
      let prevRevenue = 0;
      for (let i = 13; i >= 7; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dayOrders = orders.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate.toDateString() === date.toDateString();
        });
        prevRevenue += dayOrders.reduce((sum, o) => sum + parseFloat(o.totalCost || 0), 0);
      }
      
      const trend = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue * 100).toFixed(0) : 0;
      return { revenueData: days, totalRevenue, prevRevenue, trend };
    }
    
    if (timeRange === 'monthly') {
      // Last 6 months
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthOrders = orders.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate.getMonth() === date.getMonth() && 
                 orderDate.getFullYear() === date.getFullYear();
        });
        const monthRevenue = monthOrders.reduce((sum, o) => sum + parseFloat(o.totalCost || 0), 0);
        months.push({
          label: date.toLocaleDateString('en-IN', { month: 'short' }),
          revenue: monthRevenue
        });
      }
      const totalRevenue = months.reduce((sum, m) => sum + m.revenue, 0);
      
      // Previous 6 months for comparison
      let prevRevenue = 0;
      for (let i = 11; i >= 6; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthOrders = orders.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate.getMonth() === date.getMonth() && 
                 orderDate.getFullYear() === date.getFullYear();
        });
        prevRevenue += monthOrders.reduce((sum, o) => sum + parseFloat(o.totalCost || 0), 0);
      }
      
      const trend = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue * 100).toFixed(0) : 0;
      return { revenueData: months, totalRevenue, prevRevenue, trend };
    }
    
    // Yearly - Last 4 years by quarter
    const quarters = [];
    for (let i = 3; i >= 0; i--) {
      const year = now.getFullYear() - i;
      const yearOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate.getFullYear() === year;
      });
      const yearRevenue = yearOrders.reduce((sum, o) => sum + parseFloat(o.totalCost || 0), 0);
      quarters.push({
        label: year.toString(),
        revenue: yearRevenue
      });
    }
    const totalRevenue = quarters.reduce((sum, q) => sum + q.revenue, 0);
    const trend = 0; // No comparison for yearly
    
    return { revenueData: quarters, totalRevenue, prevRevenue: 0, trend };
  }, [orders, timeRange]);

  const maxRevenue = Math.max(...revenueData.map((item) => item.revenue), 1);

  // Export revenue data as CSV
  const exportRevenue = () => {
    const headers = ['Period', 'Revenue (₹)'];
    const csvRows = revenueData.map(item => [item.label, item.revenue]);
    csvRows.push([]);
    csvRows.push(['Total', totalRevenue]);

    const csvContent = [
      headers.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', `revenue_${timeRange}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const periodLabel = timeRange === 'weekly' ? 'Daily Revenue (in ₹)' 
    : timeRange === 'monthly' ? 'Monthly Revenue (in ₹)' 
    : 'Yearly Revenue (in ₹)';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-5 md:mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center mb-3 sm:mb-0">
          <TrendingUp className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
          Revenue Trends
        </h2>

        <button 
          onClick={exportRevenue}
          className="flex items-center text-xs sm:text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 transition-colors"
        >
          <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
          Export
        </button>
      </div>

      <div className="mt-4 sm:mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-0">
            {periodLabel}
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
                  style={{ height: `${Math.max((item.revenue / maxRevenue) * 180, 4)}px` }}
                ></div>
                <div className="hidden group-hover:block absolute -top-8 px-2 py-1 bg-gray-800 text-white text-xs rounded-md whitespace-nowrap z-10">
                  ₹{item.revenue.toLocaleString('en-IN')}
                </div>
              </div>
              <span className="text-xs text-gray-500 mt-1 sm:mt-2">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-6 sm:mt-8 pt-3 sm:pt-4 border-t border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center mb-3 sm:mb-0">
          <div className="flex items-center mr-0 sm:mr-4 mb-2 sm:mb-0">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">
              ₹{totalRevenue.toLocaleString('en-IN')}
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

export default RevenueTrends;
