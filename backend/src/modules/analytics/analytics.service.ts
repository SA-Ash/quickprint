import { prisma } from '../../infrastructure/database/prisma.client.js';

export const analyticsService = {
  async getShopSummary(shopOwnerId: string) {

    const shop = await prisma.shop.findUnique({
      where: { ownerId: shopOwnerId },
    });

    if (!shop) {
      throw new Error('Shop not found');
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const currentMonthOrders = await prisma.order.findMany({
      where: {
        shopId: shop.id,
        createdAt: { gte: startOfMonth },
      },
      include: {
        payment: true,
      },
    });

    const lastMonthOrders = await prisma.order.findMany({
      where: {
        shopId: shop.id,
        createdAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth,
        },
      },
      include: {
        payment: true,
      },
    });

    const currentMonthRevenue = currentMonthOrders.reduce((sum, order) => {
      return sum + parseFloat(order.totalCost.toString());
    }, 0);

    const lastMonthRevenue = lastMonthOrders.reduce((sum, order) => {
      return sum + parseFloat(order.totalCost.toString());
    }, 0);
    const revenueTrend = lastMonthRevenue > 0
      ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(0)
      : currentMonthRevenue > 0 ? 100 : 0;

    const orderTrend = lastMonthOrders.length > 0
      ? ((currentMonthOrders.length - lastMonthOrders.length) / lastMonthOrders.length * 100).toFixed(0)
      : currentMonthOrders.length > 0 ? 100 : 0;

    const avgOrderValue = currentMonthOrders.length > 0
      ? Math.round(currentMonthRevenue / currentMonthOrders.length)
      : 0;

    const lastMonthAvgOrderValue = lastMonthOrders.length > 0
      ? Math.round(lastMonthRevenue / lastMonthOrders.length)
      : 0;

    const avgTrend = lastMonthAvgOrderValue > 0
      ? ((avgOrderValue - lastMonthAvgOrderValue) / lastMonthAvgOrderValue * 100).toFixed(0)
      : avgOrderValue > 0 ? 100 : 0;

    const completedOrders = currentMonthOrders.filter(o => o.status === 'COMPLETED');
    const onTimeRate = currentMonthOrders.length > 0
      ? Math.round((completedOrders.length / currentMonthOrders.length) * 100)
      : 100;

    return {
      stats: [
        {
          number: `₹${Math.round(currentMonthRevenue).toLocaleString()}`,
          label: 'Revenue This Month',
          trend: `${Number(revenueTrend) >= 0 ? '+' : ''}${revenueTrend}%`,
          positive: Number(revenueTrend) >= 0,
        },
        {
          number: currentMonthOrders.length.toString(),
          label: 'Orders This Month',
          trend: `${Number(orderTrend) >= 0 ? '+' : ''}${orderTrend}%`,
          positive: Number(orderTrend) >= 0,
        },
        {
          number: `₹${avgOrderValue}`,
          label: 'Average Order Value',
          trend: `${Number(avgTrend) >= 0 ? '+' : ''}${avgTrend}%`,
          positive: Number(avgTrend) >= 0,
        },
        {
          number: `${onTimeRate}%`,
          label: 'Completion Rate',
          trend: '+0%',
          positive: true,
        },
      ],
    };
  },

  async getRevenueTrends(shopOwnerId: string) {
    const shop = await prisma.shop.findUnique({
      where: { ownerId: shopOwnerId },
    });

    if (!shop) {
      throw new Error('Shop not found');
    }

    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const orders = await prisma.order.findMany({
        where: {
          shopId: shop.id,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      const revenue = orders.reduce((sum, order) => {
        return sum + parseFloat(order.totalCost.toString());
      }, 0);

      months.push({
        month: startDate.toLocaleString('default', { month: 'short' }),
        revenue: Math.round(revenue),
        orders: orders.length,
      });
    }

    return { trends: months };
  },


  async getPopularServices(shopOwnerId: string) {
    const shop = await prisma.shop.findUnique({
      where: { ownerId: shopOwnerId },
    });

    if (!shop) {
      throw new Error('Shop not found');
    }

    const orders = await prisma.order.findMany({
      where: { shopId: shop.id },
    });

    const serviceCounts: Record<string, number> = {
      'B&W Single': 0,
      'B&W Double': 0,
      'Color Single': 0,
      'Color Double': 0,
      'Binding': 0,
    };

    orders.forEach(order => {
      const config = order.printConfig as { color?: boolean; sides?: string; binding?: string };
      if (config) {
        if (config.color) {
          if (config.sides === 'double') {
            serviceCounts['Color Double']++;
          } else {
            serviceCounts['Color Single']++;
          }
        } else {
          if (config.sides === 'double') {
            serviceCounts['B&W Double']++;
          } else {
            serviceCounts['B&W Single']++;
          }
        }
        if (config.binding && config.binding !== 'none') {
          serviceCounts['Binding']++;
        }
      }
    });

    const total = Object.values(serviceCounts).reduce((a, b) => a + b, 0) || 1;

    const services = Object.entries(serviceCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    return { services };
  },
};

export default analyticsService;
