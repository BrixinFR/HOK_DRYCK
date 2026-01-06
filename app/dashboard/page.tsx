import ProductsChart from "@/components/products-chart";
import Sidebar from "@/components/sidebar";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TrendingUp, Package, DollarSign, AlertTriangle, BarChart3, PieChart } from "lucide-react";

export default async function DashboardPage() {

  const user = await getCurrentUser();

  const [totalProducts, lowStock, allProducts] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({
      where: {
        lowStockAt: { not: null },
        quantity: { lte: 5 },
      },
    }),
    prisma.product.findMany({
      select: { price: true, quantity: true, createdAt: true },
    }),
  ]);

  const totalItems = allProducts.reduce(
    (sum: number, product: { quantity: any }) => sum + Number(product.quantity),
    0
  );

  const totalValue = allProducts.reduce(
    (sum: number, product: { price: any; quantity: any }) => sum + Number(product.price) * Number(product.quantity),
    0
  );

  const inStockCount = allProducts.filter((p: { quantity: any }) => Number(p.quantity) > 5).length;
  const lowStockCount = allProducts.filter(
    (p: { quantity: any }) => Number(p.quantity) <= 5 && Number(p.quantity) >= 1
  ).length;
  const outOfStockCount = allProducts.filter(
    (p: { quantity: any }) => Number(p.quantity) === 0
  ).length;

  const inStockPercentage =
    totalProducts > 0 ? Math.round((inStockCount / totalProducts) * 100) : 0;
  const lowStockPercentage =
    totalProducts > 0 ? Math.round((lowStockCount / totalProducts) * 100) : 0;
  const outOfStockPercentage =
    totalProducts > 0 ? Math.round((outOfStockCount / totalProducts) * 100) : 0;

  const now = new Date();
  const weeklyProductsData: { week: string; products: number }[] = [];

  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - i * 7);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekStart.setHours(23, 59, 59, 999);

    const weekLabel = `${String(weekStart.getMonth() + 1).padStart(
      2,
      "0"
    )}/${String(weekStart.getDate() + 1).padStart(2, "0")}`;

    const weekProducts = allProducts.filter((product: { createdAt: any }) => {
      const productDate = new Date(product.createdAt);
      return productDate >= weekStart && productDate <= weekEnd;
    });

    weeklyProductsData.push({
      week: weekLabel,
      products: weekProducts.length,
    });
  }

  const recent = await prisma.product.findMany({
    orderBy: { updatedAt: "desc" },
    take: 5,
  });
  
  return (
    <div className="min-h-screen bg-linear-to-br from-pink-50 via-rose-50 to-red-50">
      <Sidebar currentPath="/dashboard" />
      <main className="ml-64 p-8">
        {/* Header with decorative elements */}
        <div className="mb-10 relative">
          <div className="absolute -left-8 -top-4 w-72 h-72 bg-linear-to-br from-[#de3163]/20 to-pink-300/20 rounded-full blur-3xl"></div>
          <div className="relative bg-white/60 backdrop-blur-md rounded-2xl border border-pink-200 shadow-lg shadow-pink-200/50 p-8">
            <div className="flex items-center space-x-4 mb-3">
              <div className="w-2 h-16 bg-linear-to-b from-[#de3163] to-pink-500 rounded-full"></div>
              <div>
                <h1 className="text-5xl font-black text-gray-900 mb-1 tracking-tight">
                  Dashboard Overview
                </h1>
                <p className="text-base text-gray-700 font-medium">
                  Welcome back! Here's what's happening with your inventory today.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Stats Cards - Horizontal Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Products Card */}
          <div className="group relative bg-linear-to-br from-white via-white to-pink-50/50 rounded-2xl border-2 border-pink-200 shadow-xl shadow-pink-100/50 p-6 hover:shadow-2xl hover:shadow-[#de3163]/30 hover:-translate-y-2 hover:border-[#de3163] transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-linear-to-br from-[#de3163]/20 to-transparent rounded-full -mr-20 -mt-20 blur-2xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-linear-to-br from-[#de3163] to-pink-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                  <Package className="w-7 h-7 text-white" />
                </div>
                <div className="flex items-center text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span className="text-sm font-bold">+{totalProducts}</span>
                </div>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <div className="text-5xl font-black text-gray-900">
                  {totalProducts}
                </div>
                <div className="text-2xl font-bold text-gray-400">/</div>
                <div className="text-3xl font-bold text-[#de3163]">
                  {totalItems}
                </div>
              </div>
              <div className="text-sm font-semibold text-gray-700">
                Products / Items
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {totalProducts} unique assortments with {totalItems} total items
              </div>
            </div>
          </div>

          {/* Total Value Card */}
          <div className="group relative bg-linear-to-br from-white via-white to-pink-50/50 rounded-2xl border-2 border-pink-200 shadow-xl shadow-pink-100/50 p-6 hover:shadow-2xl hover:shadow-[#de3163]/30 hover:-translate-y-2 hover:border-[#de3163] transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-linear-to-br from-pink-500/20 to-transparent rounded-full -mr-20 -mt-20 blur-2xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-linear-to-br from-pink-500 to-rose-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                  <DollarSign className="w-7 h-7 text-white" />
                </div>
                <div className="flex items-center text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span className="text-sm font-bold">+${Number(totalValue).toFixed(0)}</span>
                </div>
              </div>
              <div className="text-5xl font-black text-gray-900 mb-2">
                ${Number(totalValue).toFixed(0)}
              </div>
              <div className="text-sm font-semibold text-gray-700">Total Inventory Value</div>
            </div>
          </div>

          {/* Low Stock Alert Card */}
          <div className="group relative bg-linear-to-br from-white via-white to-amber-50/50 rounded-2xl border-2 border-amber-200 shadow-xl shadow-amber-100/50 p-6 hover:shadow-2xl hover:shadow-amber-400/30 hover:-translate-y-2 hover:border-amber-400 transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-linear-to-br from-amber-400/20 to-transparent rounded-full -mr-20 -mt-20 blur-2xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-linear-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg group-hover:scale-110 group-hover:rotate-12 transition-all">
                  <AlertTriangle className="w-7 h-7 text-white" />
                </div>
                <div className="flex items-center text-amber-700 bg-amber-100 px-3 py-1.5 rounded-full border border-amber-300">
                  <span className="text-sm font-bold">⚠️ Alert</span>
                </div>
              </div>
              <div className="text-5xl font-black text-gray-900 mb-2">
                {lowStock}
              </div>
              <div className="text-sm font-semibold text-gray-700">Low Stock Items</div>
            </div>
          </div>
        </div>

        {/* Chart Section - Full Width */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 shadow-lg shadow-pink-100/50 p-8 hover:shadow-xl hover:shadow-pink-200/50 transition-all duration-300">
            <div className="flex items-center mb-6">
              <div className="p-2 bg-linear-to-br from-[#de3163] to-pink-600 rounded-lg mr-4">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Product Growth Trend</h2>
                <p className="text-sm text-gray-600">New products added per week over the last 12 weeks</p>
              </div>
            </div>
            <div className="h-64">
              <ProductsChart data={weeklyProductsData} />
            </div>
          </div>
        </div>

        {/* Bottom Section - Stock Levels & Efficiency */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stock Levels - Takes 2 columns */}
          <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 shadow-lg shadow-pink-100/50 p-6 hover:shadow-xl hover:shadow-pink-200/50 transition-all duration-300">
            <div className="flex items-center mb-6">
              <div className="p-2 bg-linear-to-br from-[#de3163] to-pink-600 rounded-lg mr-4">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Recent Stock Levels</h2>
                <p className="text-sm text-gray-600">Your 5 most recently updated products</p>
              </div>
            </div>
            <div className="space-y-3">
              {recent.map((product, key) => {
                const stockLevel =
                  product.quantity === 0
                    ? 0
                    : product.quantity <= (product.lowStockAt || 5)
                    ? 1
                    : 2;

                const bgColors = [
                  "bg-red-500",
                  "bg-amber-500",
                  "bg-emerald-500",
                ];
                const textColors = [
                  "text-red-600",
                  "text-amber-600",
                  "text-emerald-600",
                ];
                const bgGradients = [
                  "from-red-50 to-rose-50",
                  "from-amber-50 to-orange-50",
                  "from-emerald-50 to-green-50",
                ];
                return (
                  <div
                    key={key}
                    className={`flex items-center justify-between p-4 rounded-xl bg-linear-to-r ${bgGradients[stockLevel]} border border-pink-100 hover:border-[#de3163] hover:shadow-md transition-all duration-200 group`}
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-4 h-4 rounded-full ${bgColors[stockLevel]} shadow-lg group-hover:scale-110 transition-transform`}
                      />
                      <span className="text-sm font-semibold text-gray-800">
                        {product.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-bold ${textColors[stockLevel]} bg-white px-3 py-1 rounded-lg shadow-sm`}>
                        {product.quantity} units
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Efficiency - Takes 1 column */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 shadow-lg shadow-pink-100/50 p-6 hover:shadow-xl hover:shadow-pink-200/50 transition-all duration-300">
            <div className="flex items-center mb-6">
              <div className="p-2 bg-linear-to-br from-[#de3163] to-pink-600 rounded-lg mr-3">
                <PieChart className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-gray-800">Stock Efficiency</h2>
            </div>
            <div className="flex items-center justify-center mb-6">
              <div className="relative w-40 h-40">
                <svg className="w-40 h-40 transform -rotate-90">
                  {/* Background circle */}
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="#fce7f3"
                    strokeWidth="16"
                    fill="none"
                  />
                  {/* In Stock segment (cerise) */}
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="#de3163"
                    strokeWidth="16"
                    fill="none"
                    strokeDasharray={`${(inStockPercentage / 100) * 440} 440`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                  {/* Low Stock segment (soft lavender) */}
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="#c4b5fd"
                    strokeWidth="16"
                    fill="none"
                    strokeDasharray={`${(lowStockPercentage / 100) * 440} 440`}
                    strokeDashoffset={`${-((inStockPercentage / 100) * 440)}`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                  {/* Out of Stock segment (soft slate) */}
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="#94a3b8"
                    strokeWidth="16"
                    fill="none"
                    strokeDasharray={`${(outOfStockPercentage / 100) * 440} 440`}
                    strokeDashoffset={`${-(((inStockPercentage + lowStockPercentage) / 100) * 440)}`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-[#de3163]">
                      {inStockPercentage}%
                    </div>
                    <div className="text-xs text-gray-600 font-medium mt-1">In Stock</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-xl bg-linear-to-r from-pink-50 to-rose-50 hover:from-pink-100 hover:to-rose-100 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-[#de3163] shadow-sm" />
                  <span className="text-sm font-medium text-gray-700">In Stock</span>
                </div>
                <span className="text-sm font-bold text-[#de3163]">{inStockPercentage}%</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-linear-to-r from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-violet-300 shadow-sm" />
                  <span className="text-sm font-medium text-gray-700">Low Stock</span>
                </div>
                <span className="text-sm font-bold text-violet-600">{lowStockPercentage}%</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-linear-to-r from-slate-50 to-gray-50 hover:from-slate-100 hover:to-gray-100 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-slate-400 shadow-sm" />
                  <span className="text-sm font-medium text-gray-700">Out of Stock</span>
                </div>
                <span className="text-sm font-bold text-slate-600">{outOfStockPercentage}%</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}