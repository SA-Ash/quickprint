import { prisma } from '../../infrastructure/database/prisma.client.js';

export const adminAnalyticsService = {
  /**
   * Get platform-wide dashboard summary for admin
   */
  async getDashboardSummary() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get orders for current and last month
    const [currentMonthOrders, lastMonthOrders] = await Promise.all([
      prisma.order.findMany({
        where: { createdAt: { gte: startOfMonth } },
      }),
      prisma.order.findMany({
        where: {
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
      }),
    ]);

    // Calculate revenue
    const currentRevenue = currentMonthOrders.reduce(
      (sum, order) => sum + parseFloat(order.totalCost.toString()), 0
    );
    const lastRevenue = lastMonthOrders.reduce(
      (sum, order) => sum + parseFloat(order.totalCost.toString()), 0
    );

    const revenueTrend = lastRevenue > 0
      ? ((currentRevenue - lastRevenue) / lastRevenue * 100).toFixed(1)
      : currentRevenue > 0 ? '100' : '0';

    const orderTrend = lastMonthOrders.length > 0
      ? ((currentMonthOrders.length - lastMonthOrders.length) / lastMonthOrders.length * 100).toFixed(1)
      : currentMonthOrders.length > 0 ? '100' : '0';

    // Get user counts
    const [totalStudents, totalPartners, activeShops] = await Promise.all([
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { role: 'SHOP' } }),
      prisma.shop.count({ where: { isActive: true } }),
    ]);

    // Get users from last month for trend
    const [lastMonthStudents, lastMonthPartners] = await Promise.all([
      prisma.user.count({
        where: { role: 'STUDENT', createdAt: { lte: endOfLastMonth } },
      }),
      prisma.user.count({
        where: { role: 'SHOP', createdAt: { lte: endOfLastMonth } },
      }),
    ]);

    const studentTrend = lastMonthStudents > 0
      ? (((totalStudents - lastMonthStudents) / lastMonthStudents) * 100).toFixed(1)
      : totalStudents > 0 ? '100' : '0';

    const partnerTrend = lastMonthPartners > 0
      ? (((totalPartners - lastMonthPartners) / lastMonthPartners) * 100).toFixed(1)
      : totalPartners > 0 ? '100' : '0';

    // Calculate average order value
    const avgOrderValue = currentMonthOrders.length > 0
      ? (currentRevenue / currentMonthOrders.length).toFixed(2)
      : '0';

    const lastAvgOrderValue = lastMonthOrders.length > 0
      ? (lastRevenue / lastMonthOrders.length)
      : 0;

    const avgTrend = lastAvgOrderValue > 0
      ? (((parseFloat(avgOrderValue) - lastAvgOrderValue) / lastAvgOrderValue) * 100).toFixed(1)
      : parseFloat(avgOrderValue) > 0 ? '100' : '0';

    // Get average rating from shops
    const shops = await prisma.shop.findMany({
      select: { rating: true, reviewCount: true },
    });

    const totalReviews = shops.reduce((sum, shop) => sum + shop.reviewCount, 0);
    const avgRating = shops.length > 0
      ? (shops.reduce((sum, shop) => sum + shop.rating * shop.reviewCount, 0) / Math.max(totalReviews, 1)).toFixed(1)
      : '0';

    return {
      metrics: [
        {
          title: 'Total Revenue',
          value: `₹${Math.round(currentRevenue).toLocaleString()}`,
          change: `${Number(revenueTrend) >= 0 ? '+' : ''}${revenueTrend}%`,
          trend: Number(revenueTrend) >= 0 ? 'up' : 'down',
          description: 'This month',
        },
        {
          title: 'Total Orders',
          value: currentMonthOrders.length.toLocaleString(),
          change: `${Number(orderTrend) >= 0 ? '+' : ''}${orderTrend}%`,
          trend: Number(orderTrend) >= 0 ? 'up' : 'down',
          description: 'This month',
        },
        {
          title: 'Active Partners',
          value: activeShops.toString(),
          change: `${Number(partnerTrend) >= 0 ? '+' : ''}${partnerTrend}%`,
          trend: Number(partnerTrend) >= 0 ? 'up' : 'down',
          description: 'Print shops',
        },
        {
          title: 'Active Users',
          value: totalStudents.toLocaleString(),
          change: `${Number(studentTrend) >= 0 ? '+' : ''}${studentTrend}%`,
          trend: Number(studentTrend) >= 0 ? 'up' : 'down',
          description: 'Students',
        },
        {
          title: 'Avg Order Value',
          value: `₹${avgOrderValue}`,
          change: `${Number(avgTrend) >= 0 ? '+' : ''}${avgTrend}%`,
          trend: Number(avgTrend) >= 0 ? 'up' : 'down',
          description: 'Per order',
        },
        {
          title: 'Satisfaction Rate',
          value: `${avgRating}/5`,
          change: '+0%',
          trend: 'up',
          description: `Based on ${totalReviews.toLocaleString()} reviews`,
        },
      ],
    };
  },

  /**
   * Get revenue trends for chart
   */
  async getRevenueTrends() {
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const orders = await prisma.order.findMany({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      });

      const revenue = orders.reduce(
        (sum, order) => sum + parseFloat(order.totalCost.toString()), 0
      );

      months.push({
        month: startDate.toLocaleString('default', { month: 'short' }),
        revenue: Math.round(revenue),
        orders: orders.length,
      });
    }

    return { trends: months };
  },

  /**
   * Get order analytics by status
   */
  async getOrderAnalytics() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: startOfMonth } },
    });

    const statusCounts: Record<string, number> = {
      PENDING: 0,
      ACCEPTED: 0,
      PRINTING: 0,
      READY: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };

    orders.forEach(order => {
      if (statusCounts[order.status] !== undefined) {
        statusCounts[order.status]++;
      }
    });

    return {
      total: orders.length,
      byStatus: statusCounts,
      completionRate: orders.length > 0
        ? ((statusCounts.COMPLETED / orders.length) * 100).toFixed(1)
        : '0',
    };
  },

  /**
   * Get recent activity
   */
  async getRecentActivity(limit = 10) {
    const [recentOrders, recentUsers, recentShops] = await Promise.all([
      prisma.order.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true } },
          shop: { select: { businessName: true } },
        },
      }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        where: { role: 'STUDENT' },
        select: { id: true, name: true, createdAt: true },
      }),
      prisma.shop.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, businessName: true, createdAt: true },
      }),
    ]);

    const activities = [
      ...recentOrders.map(order => ({
        type: 'order',
        message: `New order from ${order.user?.name || 'Customer'} at ${order.shop?.businessName || 'Shop'}`,
        amount: parseFloat(order.totalCost.toString()),
        status: order.status,
        timestamp: order.createdAt,
      })),
      ...recentUsers.map(user => ({
        type: 'user',
        message: `New student joined: ${user.name}`,
        timestamp: user.createdAt,
      })),
      ...recentShops.map(shop => ({
        type: 'partner',
        message: `New partner registered: ${shop.businessName}`,
        timestamp: shop.createdAt,
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
     .slice(0, limit);

    return { activities };
  },

  /**
   * Get partner statistics
   */
  async getPartnerStats() {
    const shops = await prisma.shop.findMany({
      include: {
        _count: { select: { orders: true } },
        orders: {
          select: { totalCost: true },
        },
      },
    });

    const partners = shops.map(shop => ({
      id: shop.id,
      name: shop.businessName,
      orderCount: shop._count.orders,
      revenue: shop.orders.reduce((sum, o) => sum + parseFloat(o.totalCost.toString()), 0),
      rating: shop.rating,
      isActive: shop.isActive,
    })).sort((a, b) => b.revenue - a.revenue);

    return { partners };
  },
};

export default adminAnalyticsService;
