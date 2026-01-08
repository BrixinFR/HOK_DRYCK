"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { DollarSign, TrendingUp, ShoppingCart, Package2, ArrowUp, ArrowDown } from "lucide-react";

// Utility function for currency formatting
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Utility function for date formatting
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Shared chart styles
const commonChartStyles = {
  cartesianGrid: { strokeDasharray: "3 3", stroke: "#f0f0f0" },
  axis: { stroke: "#666", fontSize: 12, tickLine: false, axisLine: false },
  tooltip: {
    contentStyle: {
      backgroundColor: "white",
      border: "1px solid #e5e7eb",
      borderRadius: "12px",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    },
    labelStyle: { color: "#374151", fontWeight: "600", marginBottom: "8px" },
  },
};

// Reusable Product Chart Component (for weekly products)
interface ProductChartData {
  week: string;
  products: number;
}

export function ProductChart({ data }: { data: ProductChartData[] }) {
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid {...commonChartStyles.cartesianGrid} />
          <XAxis dataKey="week" {...commonChartStyles.axis} />
          <YAxis {...commonChartStyles.axis} allowDecimals={false} />
          <Area
            type="monotone"
            dataKey="products"
            stroke="#8b5cf6"
            fill="#8b5cf6"
            fillOpacity={0.2}
            strokeWidth={2}
            dot={{ fill: "#8b5cf6", r: 2 }}
            activeDot={{ fill: "#8b5cf6", r: 4 }}
          />
          <Tooltip
            contentStyle={commonChartStyles.tooltip.contentStyle}
            labelStyle={{ color: "#374151", fontWeight: "500" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Reusable Revenue & Sales Chart Component
interface RevenueSalesChartData {
  date: string;
  revenue: number;
  sales: number;
}

export function RevenueSalesChart({ data }: { data: RevenueSalesChartData[] }) {
  return (
    <div className="h-96">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#de3163" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#de3163" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid {...commonChartStyles.cartesianGrid} />
          <XAxis dataKey="date" {...commonChartStyles.axis} />
          <YAxis
            yAxisId="left"
            {...commonChartStyles.axis}
            tickFormatter={(value) => `${value} kr`}
          />
          <YAxis yAxisId="right" orientation="right" {...commonChartStyles.axis} />
          <Tooltip
            contentStyle={commonChartStyles.tooltip.contentStyle}
            labelStyle={commonChartStyles.tooltip.labelStyle}
            formatter={(value: any, name: string | undefined) => {
              if (name === "revenue") return [formatCurrency(Number(value)), "Revenue"];
              return [value, "Sales Count"];
            }}
          />
          <Legend />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="revenue"
            stroke="#de3163"
            fill="url(#colorRevenue)"
            strokeWidth={3}
            name="Revenue"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="sales"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={{ fill: "#8b5cf6", r: 3 }}
            name="Sales Count"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Reusable Top Products Bar Chart Component
interface TopProductsChartData {
  name: string;
  unitsSold: number;
  revenue: number;
}

export function TopProductsChart({ data }: { data: TopProductsChartData[] }) {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical">
          <CartesianGrid {...commonChartStyles.cartesianGrid} />
          <XAxis type="number" {...commonChartStyles.axis} />
          <YAxis type="category" dataKey="name" {...commonChartStyles.axis} width={120} />
          <Tooltip
            contentStyle={commonChartStyles.tooltip.contentStyle}
            formatter={(value: any, name: string | undefined) => {
              if (name === "Revenue") return [formatCurrency(Number(value)), "Revenue"];
              if (name === "Units Sold") return [value, "Units Sold"];
              return [value, name];
            }}
          />
          <Legend />
          <Bar dataKey="unitsSold" fill="#de3163" radius={[0, 8, 8, 0]} name="Units Sold" />
          <Bar dataKey="revenue" fill="#ec4899" radius={[0, 8, 8, 0]} name="Revenue" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Reusable Metric Card Component
interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  gradient: string;
  borderColor: string;
  iconBg: string;
  shadowColor: string;
  hoverShadow: string;
  hoverBorder: string;
  growth?: number;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  gradient,
  borderColor,
  iconBg,
  shadowColor,
  hoverShadow,
  hoverBorder,
  growth,
}: MetricCardProps) {
  return (
    <div className={`group relative ${gradient} rounded-2xl border-2 ${borderColor} ${shadowColor} p-6 ${hoverShadow} hover:-translate-y-2 transition-all duration-300 overflow-hidden`}>
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 ${iconBg} rounded-xl shadow-lg group-hover:scale-110 transition-transform`}>
            {icon}
          </div>
          {growth !== undefined && growth !== 0 && (
            <div className={`flex items-center ${growth > 0 ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-red-600 bg-red-50 border-red-200'} px-3 py-1.5 rounded-full border`}>
              {growth > 0 ? <ArrowUp className="w-4 h-4 mr-1" /> : <ArrowDown className="w-4 h-4 mr-1" />}
              <span className="text-sm font-bold">{growth > 0 ? '+' : ''}{growth.toFixed(1)}%</span>
            </div>
          )}
        </div>
        <div className="text-4xl font-black text-gray-900 mb-2">{value}</div>
        <div className="text-sm font-semibold text-gray-700">{title}</div>
        <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
      </div>
    </div>
  );
}

// Main Statistics Dashboard Component
interface StatisticsClientProps {
  dailyRevenue: { date: string; revenue: number; sales: number }[];
  topSellingProducts: { name: string; unitsSold: number; revenue: number }[];
  recentSales: {
    id: string;
    totalAmount: number;
    createdAt: string;
    itemCount: number;
  }[];
  totalRevenue: number;
  totalSales: number;
  averageOrderValue: number;
  totalUnitsSold: number;
  revenueGrowth: number;
}

export default function StatisticsClient({
  dailyRevenue = [],
  topSellingProducts = [],
  recentSales = [],
  totalRevenue = 0,
  totalSales = 0,
  averageOrderValue = 0,
  totalUnitsSold = 0,
  revenueGrowth = 0,
}: StatisticsClientProps) {
  const [selectedRange, setSelectedRange] = useState<'week' | 'month' | 'threeMonths' | 'sixMonths'>('month');

  // Filter data based on selected range
  const getFilteredData = () => {
    const daysMap = {
      week: 7,
      month: 30,
      threeMonths: 90,
      sixMonths: 180,
    };
    
    const daysToShow = daysMap[selectedRange];
    return dailyRevenue.slice(-daysToShow);
  };

  const timeRangeLabels = {
    week: '1 Week',
    month: '1 Month',
    threeMonths: '3 Months',
    sixMonths: '6 Months',
  };

  return (
    <main className="ml-64 p-8 min-h-screen bg-linear-to-br from-pink-50 via-rose-50 to-red-50">
      {/* Header */}
      <div className="mb-10 relative">
        <div className="absolute -left-8 -top-4 w-72 h-72 bg-linear-to-br from-[#de3163]/20 to-pink-300/20 rounded-full blur-3xl"></div>
        <div className="relative bg-white/60 backdrop-blur-md rounded-2xl border border-pink-200 shadow-lg shadow-pink-200/50 p-8">
          <div className="flex items-center space-x-4 mb-3">
            <div className="w-2 h-16 bg-linear-to-b from-[#de3163] to-pink-500 rounded-full"></div>
            <div>
              <h1 className="text-5xl font-black text-gray-900 mb-1 tracking-tight">
                Sales Analytics
              </h1>
              <p className="text-base text-gray-700 font-medium">
                Deep insights into your sales performance and revenue trends
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          subtitle="Last 30 days"
          icon={<DollarSign className="w-7 h-7 text-white" />}
          gradient="bg-linear-to-br from-white via-white to-pink-50/50"
          borderColor="border-pink-200"
          iconBg="bg-linear-to-br from-[#de3163] to-pink-600"
          shadowColor="shadow-xl shadow-pink-100/50"
          hoverShadow="hover:shadow-2xl hover:shadow-[#de3163]/30"
          hoverBorder="[#de3163]"
          growth={revenueGrowth}
        />
        
        <MetricCard
          title="Total Sales"
          value={totalSales}
          subtitle="Completed transactions"
          icon={<ShoppingCart className="w-7 h-7 text-white" />}
          gradient="bg-linear-to-br from-white via-white to-purple-50/50"
          borderColor="border-purple-200"
          iconBg="bg-linear-to-br from-purple-500 to-purple-600"
          shadowColor="shadow-xl shadow-purple-100/50"
          hoverShadow="hover:shadow-2xl hover:shadow-purple-500/30"
          hoverBorder="purple-500"
        />
        
        <MetricCard
          title="Avg Order Value"
          value={formatCurrency(averageOrderValue)}
          subtitle="Per transaction"
          icon={<DollarSign className="w-7 h-7 text-white" />}
          gradient="bg-linear-to-br from-white via-white to-blue-50/50"
          borderColor="border-blue-200"
          iconBg="bg-linear-to-br from-blue-500 to-blue-600"
          shadowColor="shadow-xl shadow-blue-100/50"
          hoverShadow="hover:shadow-2xl hover:shadow-blue-500/30"
          hoverBorder="blue-500"
        />
        
        <MetricCard
          title="Units Sold"
          value={totalUnitsSold.toLocaleString()}
          subtitle="Total items moved"
          icon={<Package2 className="w-7 h-7 text-white" />}
          gradient="bg-linear-to-br from-white via-white to-orange-50/50"
          borderColor="border-orange-200"
          iconBg="bg-linear-to-br from-orange-500 to-orange-600"
          shadowColor="shadow-xl shadow-orange-100/50"
          hoverShadow="hover:shadow-2xl hover:shadow-orange-500/30"
          hoverBorder="orange-500"
        />
      </div>

      {/* Revenue & Sales Over Time */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 shadow-lg shadow-pink-100/50 p-8 hover:shadow-xl hover:shadow-pink-200/50 transition-all duration-300 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Revenue & Sales Trends</h2>
          
          {/* Time Range Toggle */}
          <div className="flex items-center gap-2 bg-pink-50 p-1 rounded-xl border border-pink-200">
            {(Object.keys(timeRangeLabels) as Array<keyof typeof timeRangeLabels>).map((range) => (
              <button
                key={range}
                onClick={() => setSelectedRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  selectedRange === range
                    ? 'bg-[#de3163] text-white shadow-md'
                    : 'text-gray-600 hover:text-[#de3163] hover:bg-white'
                }`}
              >
                {timeRangeLabels[range]}
              </button>
            ))}
          </div>
        </div>
        <RevenueSalesChart data={getFilteredData()} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Top Selling Products */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 shadow-lg shadow-pink-100/50 p-8 hover:shadow-xl hover:shadow-pink-200/50 transition-all duration-300">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Top Selling Products</h2>
          <TopProductsChart data={topSellingProducts} />
        </div>

        {/* Recent Sales */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 shadow-lg shadow-pink-100/50 p-8 hover:shadow-xl hover:shadow-pink-200/50 transition-all duration-300">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Sales</h2>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {recentSales.map((sale) => (
              <div
                key={sale.id}
                className="flex items-center justify-between p-4 rounded-xl bg-linear-to-r from-pink-50 to-rose-50 border border-pink-100 hover:border-[#de3163] hover:shadow-md transition-all duration-200"
              >
                <div>
                  <div className="text-sm font-bold text-gray-900">
                    {formatCurrency(sale.totalAmount)}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {sale.itemCount} {sale.itemCount === 1 ? 'item' : 'items'} · {formatDate(sale.createdAt)}
                  </div>
                </div>
                <div className="px-3 py-1 bg-[#de3163] text-white text-xs font-bold rounded-full">
                  Sale #{sale.id.slice(-6)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}