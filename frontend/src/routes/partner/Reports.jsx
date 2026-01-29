import React, { useState, useMemo } from "react";
import { Loader2, Download, Calendar, TrendingUp, ShoppingCart, DollarSign, CheckCircle } from "lucide-react";
import RevenueTrends from "../../Components/RevenueTrends";
import PopularServices from "../../Components/PopularServices";
import { usePartnerOrders } from "../../hooks/usePartnerOrders.jsx";

const Reports = () => {
  const { orders, loading } = usePartnerOrders();
  const [timeRange, setTimeRange] = useState("monthly"); // weekly, monthly, yearly

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

  // Calculate previous period orders for comparison
  const previousPeriodOrders = useMemo(() => {
    const now = new Date();
    return orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      switch (timeRange) {
        case 'weekly':
          const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return orderDate >= twoWeeksAgo && orderDate < weekAgo;
        case 'monthly':
          const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());
          const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          return orderDate >= twoMonthsAgo && orderDate < monthAgo;
        case 'yearly':
          const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
          const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          return orderDate >= twoYearsAgo && orderDate < yearAgo;
        default:
          return false;
      }
    });
  }, [orders, timeRange]);

  // Calculate stats from real orders
  const stats = useMemo(() => {
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + parseFloat(order.totalCost || 0), 0);
    const prevRevenue = previousPeriodOrders.reduce((sum, order) => sum + parseFloat(order.totalCost || 0), 0);
    const revenueTrend = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue * 100).toFixed(0) : 0;

    const orderCount = filteredOrders.length;
    const prevOrderCount = previousPeriodOrders.length;
    const orderTrend = prevOrderCount > 0 ? ((orderCount - prevOrderCount) / prevOrderCount * 100).toFixed(0) : 0;

    const avgOrderValue = orderCount > 0 ? (totalRevenue / orderCount).toFixed(0) : 0;
    const prevAvgOrderValue = prevOrderCount > 0 
      ? (prevRevenue / prevOrderCount).toFixed(0) 
      : 0;
    const avgTrend = prevAvgOrderValue > 0 
      ? ((avgOrderValue - prevAvgOrderValue) / prevAvgOrderValue * 100).toFixed(0) 
      : 0;

    const completedOrders = filteredOrders.filter(o => o.status === 'completed').length;
    const completionRate = orderCount > 0 ? ((completedOrders / orderCount) * 100).toFixed(0) : 100;
    const prevCompletedOrders = previousPeriodOrders.filter(o => o.status === 'completed').length;
    const prevCompletionRate = prevOrderCount > 0 ? ((prevCompletedOrders / prevOrderCount) * 100) : 100;
    const completionTrend = (completionRate - prevCompletionRate).toFixed(0);

    return [
      {
        number: `₹${totalRevenue.toLocaleString('en-IN')}`,
        label: `Revenue This ${timeRange === 'weekly' ? 'Week' : timeRange === 'monthly' ? 'Month' : 'Year'}`,
        trend: `${revenueTrend >= 0 ? '+' : ''}${revenueTrend}%`,
        positive: revenueTrend >= 0,
        icon: DollarSign,
        color: "bg-green-50 text-green-600"
      },
      {
        number: orderCount.toString(),
        label: `Orders This ${timeRange === 'weekly' ? 'Week' : timeRange === 'monthly' ? 'Month' : 'Year'}`,
        trend: `${orderTrend >= 0 ? '+' : ''}${orderTrend}%`,
        positive: orderTrend >= 0,
        icon: ShoppingCart,
        color: "bg-blue-50 text-blue-600"
      },
      {
        number: `₹${avgOrderValue}`,
        label: "Average Order Value",
        trend: `${avgTrend >= 0 ? '+' : ''}${avgTrend}%`,
        positive: avgTrend >= 0,
        icon: TrendingUp,
        color: "bg-purple-50 text-purple-600"
      },
      {
        number: `${completionRate}%`,
        label: "Completion Rate",
        trend: `${completionTrend >= 0 ? '+' : ''}${completionTrend}%`,
        positive: completionTrend >= 0,
        icon: CheckCircle,
        color: "bg-amber-50 text-amber-600"
      },
    ];
  }, [filteredOrders, previousPeriodOrders, timeRange]);

  // Export report as CSV
  const exportReport = () => {
    const headers = ['Order ID', 'Customer', 'Date', 'File', 'Copies', 'Color', 'Double Sided', 'Total', 'Status'];
    const csvRows = filteredOrders.map(order => [
      order.orderNumber,
      order.customer?.name || 'Student',
      new Date(order.createdAt).toLocaleDateString('en-IN'),
      order.fileName || 'Document',
      order.copies || 1,
      order.printConfig?.color ? 'Color' : 'B&W',
      order.printConfig?.doubleSided ? 'Yes' : 'No',
      order.totalCost,
      order.status
    ]);

    // Add summary row
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + parseFloat(order.totalCost || 0), 0);
    csvRows.push([]);
    csvRows.push(['SUMMARY']);
    csvRows.push(['Total Orders', filteredOrders.length]);
    csvRows.push(['Total Revenue', `₹${totalRevenue.toLocaleString('en-IN')}`]);
    csvRows.push(['Period', timeRange]);

    const csvContent = [
      headers.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', `report_${timeRange}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const timeRangeLabel = timeRange === 'weekly' ? 'Week' : timeRange === 'monthly' ? 'Month' : 'Year';

  if (loading) {
    return (
      <div className="min-h-screen max-w-[90rem] mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-[90rem] mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
            Reports & Analytics
          </h1>
          <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
            Track your business performance and get insights into your operations.
          </p>
        </div>
        
        <div className="flex items-center gap-3 mt-4 sm:mt-0">
          <div className="relative">
            <select
              className="appearance-none pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          
          <button
            onClick={exportReport}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 mb-6 sm:mb-8">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-200 transition-all hover:shadow-md"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-gray-600 text-xs sm:text-sm font-medium mb-1">
                    {stat.label}
                  </h3>
                  <h1 className="font-bold text-lg sm:text-xl md:text-2xl text-gray-800">
                    {stat.number}
                  </h1>
                </div>
              </div>
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full ${
                  stat.positive
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {stat.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-6 sm:space-y-8">
        <RevenueTrends orders={orders} timeRange={timeRange} />
        <PopularServices orders={orders} timeRange={timeRange} />
      </div>
    </div>
  );
};

export default Reports;
