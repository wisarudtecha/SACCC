// src/cc/components/dashboard/CallCenterDashboard.tsx
"use client"

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card } from "@/core/components/ui/card/Card";

const CallCenterDashboard = () => {
  const callCenterData = [
    { name: "Mon", calls: 45, answered: 42, missed: 3, duration: 12.5 },
    { name: "Tue", calls: 52, answered: 50, missed: 2, duration: 14.2 },
    { name: "Wed", calls: 48, answered: 46, missed: 2, duration: 13.1 },
    { name: "Thu", calls: 61, answered: 58, missed: 3, duration: 15.4 },
    { name: "Fri", calls: 55, answered: 53, missed: 2, duration: 14.8 },
    { name: "Sat", calls: 38, answered: 36, missed: 2, duration: 11.2 },
    { name: "Sun", calls: 32, answered: 30, missed: 2, duration: 10.1 },
  ];

  const agentPerformance = [
    { name: "John Smith", calls: 125, satisfaction: 92, efficiency: 88 },
    { name: "Jane Doe", calls: 118, satisfaction: 95, efficiency: 91 },
    { name: "Mike Johnson", calls: 98, satisfaction: 87, efficiency: 85 },
    { name: "Sarah Williams", calls: 132, satisfaction: 90, efficiency: 89 },
  ];

  const callTypeDistribution = [
    { name: "Technical Support", value: 35 },
    { name: "Billing Inquiry", value: 25 },
    { name: "Service Request", value: 30 },
    { name: "Other", value: 10 },
  ];

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

  return (
    <div className="flex-1 dark:bg-black overflow-y-auto cursor-default">
      <div className="w-full">
        <div
          // className="p-6 space-y-6"
          className="space-y-6"
        >
          {/* Key Metrics */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
            <Card className="bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800">
              <div className="pb-2">
                <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Calls</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-black dark:text-white">331</div>
                <p className="text-xs text-green-500 dark:text-green-400 mt-1">+5% from last week</p>
              </div>
            </Card>
            <Card className="bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800">
              <div className="pb-2">
                <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">Answered</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-500 dark:text-green-400">315</div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">95.2% answer rate</p>
              </div>
            </Card>
            <Card className="bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800">
              <div className="pb-2">
                <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">Avg Duration</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-black dark:text-white">12m 34s</div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Per call average</p>
              </div>
            </Card>
            <Card className="bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800">
              <div className="pb-2">
                <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">Satisfaction</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-500 dark:text-blue-400">91%</div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Customer CSAT score</p>
              </div>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card className="bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800">
              <div>
                <div className="text-black dark:text-white">Daily Call Volume</div>
              </div>
              <div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={callCenterData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151" }} />
                    <Legend />
                    <Line type="monotone" dataKey="calls" stroke="#3b82f6" name="Total Calls" />
                    <Line type="monotone" dataKey="answered" stroke="#10b981" name="Answered" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800">
              <div>
                <div className="text-black dark:text-white">Call Type Distribution</div>
              </div>
              <div>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={callTypeDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={{ fill: "#fff" }}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {callTypeDistribution.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Agent Performance */}
          <Card className="bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800">
            <div>
              <div className="text-black dark:text-white">Agent Performance</div>
            </div>
            <div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={agentPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151" }} />
                  <Legend />
                  <Bar dataKey="calls" fill="#3b82f6" name="Calls Handled" />
                  <Bar dataKey="satisfaction" fill="#10b981" name="Satisfaction %" />
                  <Bar dataKey="efficiency" fill="#f59e0b" name="Efficiency %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
};

export default CallCenterDashboard;
