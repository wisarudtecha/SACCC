// src/cms/components/crm/products/ProductDashboardV2.tsx
import { Package, Boxes, ShoppingCart, Wrench, CalendarDays, Users, AlertTriangle, TrendingUp, Activity, ClipboardList } from "lucide-react";
import { Card } from "@/core/components/ui/card/Card";
import { formatNumberWithComma, formatPrice, formatPriceWithCompact } from "@/cms/utils/productHelper";

const summaryCards = [
  {
    title: "Products",
    value: 1280,
    growth: "+12%",
    description: "Total active products",
    icon: Package,
  },
  // {
  //   title: "Services",
  //   value: 84,
  //   growth: "+8%",
  //   description: "Active service packages",
  //   icon: Wrench,
  // },
  {
    title: "Spare Parts",
    value: 5640,
    growth: "+5%",
    description: "Spare parts in stock",
    icon: Boxes,
  },
  {
    title: "Ordering",
    value: 84,
    growth: "+8%",
    // description: "Active service packages",
    description: "Pending Orders",
    icon: Wrench,
  },
  {
    // title: "Pending Orders",
    title: "Total Pending",
    value: 23,
    growth: "-3%",
    description: "Waiting for approval",
    icon: ShoppingCart,
  },
];

const topProducts = [
  {
    name: "Industrial Router X1",
    requests: 182,
    price: 12500,
  },
  {
    name: "Fiber Switch 24 Port",
    requests: 144,
    price: 8900,
  },
  {
    name: "UPS Backup Pro",
    requests: 121,
    price: 15200,
  },
  {
    name: "Smart Sensor Hub",
    requests: 98,
    price: 4500,
  },
  {
    name: "CCTV Camera HD",
    requests: 76,
    price: 3200,
  },
  {
    name: "Access Point Pro",
    requests: 65,
    price: 7800,
  }
];

const recentServices = [
  {
    service: "Network Maintenance",
    agent: "Michael T.",
    date: "2026-05-15",
    status: "Completed",
  },
  {
    service: "Server Installation",
    agent: "Sarah K.",
    date: "2026-05-14",
    status: "In Progress",
  },
  {
    service: "CCTV Inspection",
    agent: "David P.",
    date: "2026-05-13",
    status: "Pending",
  },
];

const modules = [
  // {
  //   title: "Product Management",
  //   icon: Package,
  //   total: 1280,
  // },
  {
    title: "Product Stock",
    icon: Activity,
    total: 9850,
  },
  // {
  //   title: "Spare Part Management",
  //   icon: Boxes,
  //   total: 5640,
  // },
  {
    title: "Spare Part Stock",
    icon: ClipboardList,
    total: 4320,
  },
  // {
  //   title: "Spare Part Ordering",
  //   icon: ShoppingCart,
  //   total: 182,
  // },
  {
    title: "Customers",
    icon: Users,
    total: 2450,
  },
  {
    title: "Appointments",
    icon: CalendarDays,
    total: 52,
  },
  {
    title: "Package & Services",
    icon: Wrench,
    total: 84,
  }
];

const ProductDashboardV2 = () => {
  return (
    <>
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {summaryCards.map((item, index) => (
          <Card
            key={index}
            className="rounded-2xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
          >
            <div className="p-0 flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{item.title}</p>
                <h2 className="text-3xl font-bold mt-2 text-gray-600 dark:text-gray-300">{formatNumberWithComma(item.value)}</h2>

                <div className="flex items-center gap-2 mt-3">
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      item.growth.includes("+")
                        ? "bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-300"
                        : "bg-red-100 dark:bg-red-800 text-red-600 dark:text-red-300"
                    }`}
                  >
                    {item.growth}
                  </span>

                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    From last month
                  </span>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                  {item.description}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-blue-100 dark:bg-blue-800">
                <item.icon className="w-6 h-6 text-blue-600 dark:text-blue-300" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Side */}
        <div className="xl:col-span-2 space-y-6">
          {/* Module Overview */}
          <Card className="rounded-2xl border border-gray-200 dark:border-gray-700">
            <div className="p-0">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-300">
                    {/* System Module Overview */}
                    Overview
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {/* Current operational modules inside the platform */}
                    Platform Capabilities
                  </p>
                </div>

                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-300" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {modules.map((module, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-800">
                        <module.icon className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                      </div>

                      <div>
                        <p className="font-medium text-sm text-gray-500 dark:text-gray-400">{module.title}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Active records
                        </p>
                      </div>
                    </div>

                    <div className="text-xl font-bold text-gray-600 dark:text-gray-300">{formatNumberWithComma(module.total)}</div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Top Products */}
          <Card className="rounded-2xl border border-gray-200 dark:border-gray-700">
            <div className="p-0">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-300">
                    {/* Top Requested Products */}
                    Top Ordered
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {/* Most requested products this month */}
                    Most ordered spare parts this month
                  </p>
                </div>

                <Package className="w-5 h-5 text-blue-600 dark:text-blue-300" />
              </div>

              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between border border-gray-200 dark:border-gray-700 rounded-2xl p-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-600 text-white text-sm font-semibold">
                          {index + 1}
                        </span>

                        <p className="font-semibold text-gray-600 dark:text-gray-300">{product.name}</p>
                      </div>

                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        {/* Requested {product.requests} times */}
                        Ordered {formatNumberWithComma(product.requests)} times
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-600 dark:text-gray-300">{formatPrice(product.price, "THB", "th-TH", 0)}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">Unit price</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Side */}
        <div className="space-y-6">
          {/* Alert */}
          <Card className="rounded-2xl border border-gray-200 dark:border-gray-700">
            <div className="p-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-600 dark:text-gray-300">
                    Inventory Alert
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Low stock and pending requests
                  </p>
                </div>

                <AlertTriangle className="w-5 h-5 text-orange-500" />
              </div>

              <div className="mt-5 space-y-4">
                <div className="p-4 rounded-2xl bg-orange-100 dark:bg-orange-800 border border-orange-100 dark:border-orange-800">
                  <p className="text-sm font-medium text-orange-700 dark:text-orange-200">
                    {formatNumberWithComma(12)} spare parts below minimum stock level
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-red-100 dark:bg-red-800 border border-red-100 dark:border-red-800">
                  <p className="text-sm font-medium text-red-700 dark:text-red-200">
                    {formatNumberWithComma(5)} purchase requests waiting for approval
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Revenue */}
          <Card className="rounded-2xl border border-gray-200 dark:border-gray-700">
            <div className="p-0">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-lg font-semibold text-gray-600 dark:text-gray-300">
                    Estimated Revenue
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Monthly operational revenue
                  </p>
                </div>

                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-300" />
              </div>

              <div className="flex items-center justify-center py-3">
                <div className="w-44 h-44 rounded-full border-14 border-blue-200 border-t-blue-600 rotate-45 flex items-center justify-center">
                  <div className="-rotate-45 text-center">
                    <p className="text-sm text-gray-400 dark:text-gray-500">This Month</p>
                    <h2 className="text-4xl font-bold text-gray-500 dark:text-gray-300">{formatPriceWithCompact(920, "THB", "th-TH", 0)}</h2>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mt-0">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-500 dark:text-gray-400">Product Sales</span>
                    <span className="text-gray-600 dark:text-gray-300">82%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div className="w-[82%] h-full bg-blue-600 dark:bg-blue-400 rounded-full" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-500 dark:text-gray-400">Service Revenue</span>
                    <span className="text-gray-600 dark:text-gray-300">64%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div className="w-[64%] h-full bg-green-500 dark:bg-green-400 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Recent Services */}
          <Card className="rounded-2xl border border-gray-200 dark:border-gray-700">
            <div className="p-0">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-semibold text-gray-600 dark:text-gray-300">
                    Recent Services
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Latest service records
                  </p>
                </div>

                <Wrench className="w-5 h-5 text-blue-600 dark:text-blue-300" />
              </div>

              <div className="space-y-4">
                {recentServices.map((service, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 dark:border-gray-700 rounded-2xl p-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-600 dark:text-gray-300">{service.service}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Agent: {service.agent}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                          {service.date}
                        </p>
                      </div>

                      <span
                        className={`text-xs px-3 py-1 rounded-full font-medium ${
                          service.status === "Completed"
                            ? "bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200"
                            : service.status === "In Progress"
                            ? "bg-yellow-100 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-200"
                            : "bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200"
                        }`}
                      >
                        {service.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

export default ProductDashboardV2;
