// src/cms/components/crm/products/ProductDashboardV1.tsx
import { Package, Wrench, Boxes, Clock } from "lucide-react";
import { Card } from "@/core/components/ui/card/Card";
import { formatNumberWithComma, formatPrice } from "@/cms/utils/productHelper";

const stats = [
  { label: "Total Products", value: 128, icon: Package },
  { label: "Active Services", value: 42, icon: Wrench },
  { label: "Spare Parts (Inventory)", value: 560, icon: Boxes },
  { label: "Pending Requests", value: 18, icon: Clock },
];

const topProducts = [
  { name: "Product A", requests: 120, price: 1500 },
  { name: "Product B", requests: 95, price: 2300 },
  { name: "Product C", requests: 80, price: 1800 },
];

const recentServices = [
  {
    name: "Repair Laptop",
    agent: "John Doe",
    date: "2026-04-01",
    status: "Completed",
  },
  {
    name: "Install Software",
    agent: "Jane Smith",
    date: "2026-03-30",
    status: "In Progress",
  },
  {
    name: "Replace Battery",
    agent: "Michael Tan",
    date: "2026-03-29",
    status: "Pending",
  },
];

const ProductDashboardV1 = () => {
  return (
    <div
      // className="p-6 space-y-6"
      className="p-0 space-y-6 pb-6"
    >
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card
            key={index}
            // className="shadow-md rounded-2xl"
            className="rounded-2xl dark:border-gray-700"
          >
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>

                <h2 className="text-2xl font-bold text-gray-600 dark:text-gray-300">{formatNumberWithComma(stat.value)}</h2>
              </div>

              <stat.icon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
          </Card>
        ))}
      </div>

      {/* Top Products */}
      <Card
        // className="shadow-md rounded-2xl"
        className="rounded-2xl dark:border-gray-700"
      >
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-600 dark:text-gray-300">Top Products (This Month)</h3>

          <div className="space-y-3">
            {topProducts.map((product, index) => (
              <div
                key={index}
                className={`flex justify-between items-center ${index < topProducts.length - 1 ? "border-b dark:border-gray-700" : ""} pb-2`}
              >
                <div>
                  <p className="font-medium text-gray-600 dark:text-gray-300">#{index + 1} {product.name}</p>

                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Requests: {formatNumberWithComma(product.requests)}
                  </p>
                </div>

                <p className="font-semibold text-gray-600 dark:text-gray-300">{formatPrice(product.price, "THB", "th-TH", 0)}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Recent Services */}
      <Card
        // className="shadow-md rounded-2xl"
        className="rounded-2xl dark:border-gray-700"
      >
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-600 dark:text-gray-300">Recent Services</h3>

          <div className="space-y-3">
            {recentServices.map((service, index) => (
              <div
                key={index}
                className="flex justify-between items-center border-b pb-2 dark:border-gray-700"
              >
                <div>
                  <p className="font-medium text-gray-600 dark:text-gray-300">{service.name}</p>

                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Agent: {service.agent}
                  </p>

                  <p className="text-xs text-gray-400 dark:text-gray-500">{service.date}</p>
                </div>

                <span
                  className={`text-sm px-2 py-1 rounded-full ${
                    service.status === "Completed"
                      ? "bg-green-100 text-green-600"
                      : service.status === "In Progress"
                      ? "bg-yellow-100 text-yellow-600"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {service.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Extra Insight Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card
          // className="shadow-md rounded-2xl"
          className="rounded-2xl dark:border-gray-700"
        >
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-2 text-gray-600 dark:text-gray-300">Low Stock Alert</h3>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatNumberWithComma(12)} items are below minimum stock level
            </p>
          </div>
        </Card>

        <Card
          // className="shadow-md rounded-2xl"
          className="rounded-2xl dark:border-gray-700"
        >
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-2 text-gray-600 dark:text-gray-300">Revenue (This Month)</h3>

            <p className="text-2xl font-bold text-gray-600 dark:text-gray-300">{formatPrice(245000, "THB", "th-TH", 0)}</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default ProductDashboardV1;
