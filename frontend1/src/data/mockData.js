// data/mockData.js
export const mockDashboardData = {
  overview: {
    totalRevenue: 124856,
    totalOrders: 1248,
    activePartners: 42,
    activeUsers: 8742,
    avgOrderValue: 99.8,
    satisfactionRate: 4.7,
  },
  revenue: {
    monthly: [
      { month: "Jan", revenue: 45000, orders: 320 },
      { month: "Feb", revenue: 52000, orders: 380 },
      { month: "Mar", revenue: 48000, orders: 350 },
      { month: "Apr", revenue: 61000, orders: 420 },
      { month: "May", revenue: 58000, orders: 390 },
      { month: "Jun", revenue: 72000, orders: 480 },
    ],
    byCollege: [
      { name: "Engineering", value: 45 },
      { name: "Business", value: 25 },
      { name: "Arts", value: 15 },
      { name: "Medical", value: 10 },
      { name: "Others", value: 5 },
    ],
  },
  orders: {
    status: [
      { status: "Pending", count: 45, color: "yellow" },
      { status: "Printing", count: 28, color: "blue" },
      { status: "Ready", count: 12, color: "green" },
      { status: "Completed", count: 1156, color: "gray" },
      { status: "Cancelled", count: 8, color: "red" },
    ],
    trends: [
      { hour: "8AM", orders: 45 },
      { hour: "10AM", orders: 89 },
      { hour: "12PM", orders: 124 },
      { hour: "2PM", orders: 76 },
      { hour: "4PM", orders: 98 },
      { hour: "6PM", orders: 145 },
      { hour: "8PM", orders: 67 },
    ],
  },
};

export default mockDashboardData;
