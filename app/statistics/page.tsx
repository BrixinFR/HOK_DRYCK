import Sidebar from "@/components/sidebar";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import StatisticsClient from "@/components/products-chart";

export default async function StatisticsPage() {
  const user = await getCurrentUser();
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
  const oneYearAgo = new Date(now.getTime() - 360 * 24 * 60 * 60 * 1000);

  // Fetch sales data for the last 6 months
  const recentSales = await prisma.sale.findMany({
    where: { createdAt: { gte: sixMonthsAgo } },
    include: {
      items: {
        include: {
          product: { select: { name: true, userId: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const userSales = recentSales.filter(sale => 
    sale.items.some(item => item.product.userId === user.id)
  );

  // Fetch previous period for growth calculation
  const previousSales = await prisma.sale.findMany({
    where: {
      createdAt: { gte: oneYearAgo, lt: sixMonthsAgo },
    },
    include: {
      items: {
        include: { product: { select: { userId: true } } },
      },
    },
  });

  const userPreviousSales = previousSales.filter(sale =>
    sale.items.some(item => item.product.userId === user.id)
  );

  // Calculate metrics
  const totalRevenue = userSales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
  const previousRevenue = userPreviousSales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
  const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;
  const totalUnitsSold = userSales.reduce(
    (sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0
  );
  const averageOrderValue = userSales.length > 0 ? totalRevenue / userSales.length : 0;

  // Daily revenue data
  const dailyData = new Map<string, { revenue: number; sales: number }>();
  for (let i = 179; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    dailyData.set(date.toISOString().split('T')[0], { revenue: 0, sales: 0 });
  }
  
  userSales.forEach((sale) => {
    const dateStr = sale.createdAt.toISOString().split('T')[0];
    const current = dailyData.get(dateStr);
    if (current) {
      dailyData.set(dateStr, {
        revenue: current.revenue + Number(sale.totalAmount),
        sales: current.sales + 1,
      });
    }
  });
  
  const dailyRevenue = Array.from(dailyData.entries()).map(([date, data]) => ({
    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    revenue: data.revenue,
    sales: data.sales,
  }));

  // Top products
  const productStats = new Map<string, { name: string; unitsSold: number; revenue: number }>();
  userSales.forEach((sale) => {
    sale.items.forEach((item) => {
      if (item.product.userId !== user.id) return;
      const current = productStats.get(item.productId) || {
        name: item.product.name,
        unitsSold: 0,
        revenue: 0,
      };
      productStats.set(item.productId, {
        name: item.product.name,
        unitsSold: current.unitsSold + item.quantity,
        revenue: current.revenue + (Number(item.price) * item.quantity),
      });
    });
  });
  const topSellingProducts = Array.from(productStats.values())
    .sort((a, b) => b.unitsSold - a.unitsSold)
    .slice(0, 5);

  const recentSalesFormatted = userSales.slice(0, 10).map((sale) => ({
    id: sale.id,
    totalAmount: Number(sale.totalAmount),
    createdAt: sale.createdAt.toISOString(),
    itemCount: sale.items.reduce((sum, item) => sum + item.quantity, 0),
  }));

  return (
    <>
      <Sidebar currentPath="/statistics" />
      <StatisticsClient
        dailyRevenue={dailyRevenue}
        topSellingProducts={topSellingProducts}
        recentSales={recentSalesFormatted}
        totalRevenue={totalRevenue}
        totalSales={userSales.length}
        averageOrderValue={averageOrderValue}
        totalUnitsSold={totalUnitsSold}
        revenueGrowth={revenueGrowth}
      />
    </>
  );
}