// src/components/AgentStatusDashboard.tsx
import React, { useState } from "react";
import { RotateCcw, Settings } from "lucide-react";

interface Agent {
  id: number;
  name: string;
  status: "Ready" | "Not Ready" | "Talking";
  ready: string;
  notReady: string;
  answer: string;
  totalTime: string;
}

const AgentStatusDashboard: React.FC = () => {
  const [agents] = useState<Agent[]>([
    {
      id: 1,
      name: "Agent 1",
      status: "Ready",
      ready: "00:01:15",
      notReady: "01:50:36",
      answer: "00:00:12",
      totalTime: "01:52:03"
    },
    {
      id: 2,
      name: "Agent 2",
      status: "Talking",
      ready: "00:55:19",
      notReady: "00:10:21",
      answer: "00:18:14",
      totalTime: "01:23:54"
    },
    {
      id: 3,
      name: "Agent 3",
      status: "Not Ready",
      ready: "00:02:57",
      notReady: "00:04:32",
      answer: "00:10:16",
      totalTime: "00:06:06"
    },
    {
      id: 4,
      name: "Agent 4",
      status: "Ready",
      ready: "00:10:28",
      notReady: "00:01:55",
      answer: "00:04:32",
      totalTime: "00:10:05"
    },
    {
      id: 5,
      name: "Agent 5",
      status: "Ready",
      ready: "00:08:17",
      notReady: "00:10:07",
      answer: "00:09:19",
      totalTime: "00:06:48"
    },
    {
      id: 6,
      name: "Agent 6",
      status: "Ready",
      ready: "00:00:02",
      notReady: "00:03:04",
      answer: "00:06:21",
      totalTime: "00:00:22"
    },
    {
      id: 7,
      name: "Agent 7",
      status: "Not Ready",
      ready: "00:08:59",
      notReady: "00:03:06",
      answer: "00:06:52",
      totalTime: "00:05:13"
    },
    {
      id: 8,
      name: "Agent 8",
      status: "Ready",
      ready: "00:03:03",
      notReady: "00:02:05",
      answer: "00:00:06",
      totalTime: "00:00:16"
    },
    {
      id: 9,
      name: "Agent 9",
      status: "Ready",
      ready: "00:07:13",
      notReady: "00:03:55",
      answer: "00:00:49",
      totalTime: "00:02:30"
    }
  ]);

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded text-xs font-medium";
    switch (status) {
      case "Ready":
        return `${baseClasses} bg-green-500 text-white`;
      case "Not Ready":
        return `${baseClasses} bg-red-500 text-white`;
      case "Talking":
        return `${baseClasses} bg-yellow-500 text-white`;
      default:
        return `${baseClasses} bg-gray-500 text-white`;
    }
  };

  const statusCounts = {
    Ready: agents.filter(a => a.status === "Ready").length,
    NotReady: agents.filter(a => a.status === "Not Ready").length,
    Talking: agents.filter(a => a.status === "Talking").length,
    Break: 0
  };

  const total = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);

  const PieChart = () => {
    const readyPercentage = (statusCounts.Ready / total) * 100;
    const notReadyPercentage = (statusCounts.NotReady / total) * 100;
    const talkingPercentage = (statusCounts.Talking / total) * 100;
    
    return (
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 42 42" className="w-full h-full transform -rotate-90">
          <circle
            cx="21"
            cy="21"
            r="15.915"
            fill="transparent"
            stroke="#10b981"
            strokeWidth="6"
            strokeDasharray={`${readyPercentage} ${100 - readyPercentage}`}
            strokeDashoffset="0"
          />
          <circle
            cx="21"
            cy="21"
            r="15.915"
            fill="transparent"
            stroke="#ef4444"
            strokeWidth="6"
            strokeDasharray={`${notReadyPercentage} ${100 - notReadyPercentage}`}
            strokeDashoffset={`-${readyPercentage}`}
          />
          <circle
            cx="21"
            cy="21"
            r="15.915"
            fill="transparent"
            stroke="#eab308"
            strokeWidth="6"
            strokeDasharray={`${talkingPercentage} ${100 - talkingPercentage}`}
            strokeDashoffset={`-${readyPercentage + notReadyPercentage}`}
          />
        </svg>
      </div>
    );
  };

  const totals = {
    ready: "01:37:33",
    notReady: "02:29:41",
    answer: "00:56:41",
    totalTime: "03:47:17"
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 cursor-default">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Agent Status Dashboard</h1>
        <div className="flex gap-2">
          <button className="p-2 text-gray-600 dark:text-gray-300 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 rounded border border-gray-400 dark:border-gray-500">
            <Settings size={20} />
          </button>
          <button className="p-2 text-gray-600 dark:text-gray-300 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 rounded border border-gray-400 dark:border-gray-500">
            <RotateCcw size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Agent Monitor Table */}
        <div className="lg:col-span-3 rounded-lg">
          <h2 className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-100">Agent Monitor</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-300 dark:border-gray-600">
                  <th className="text-left py-3 px-2 font-medium text-gray-700 dark:text-gray-200">Agent</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700 dark:text-gray-200">Status</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700 dark:text-gray-200">Ready</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700 dark:text-gray-200">Not Ready</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700 dark:text-gray-200">Answer</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700 dark:text-gray-200">Total Time</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => (
                  <tr key={agent.id} className="border-b border-gray-300 dark:border-gray-600 hover:bg-gray-300 dark:hover:bg-gray-600">
                    <td className="py-3 px-2 dark:text-gray-300">{agent.name}</td>
                    <td className="py-3 px-2">
                      <span className={getStatusBadge(agent.status)}>
                        {agent.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 font-mono text-sm text-gray-600 dark:text-gray-300">{agent.ready}</td>
                    <td className="py-3 px-2 font-mono text-sm text-gray-600 dark:text-gray-300">{agent.notReady}</td>
                    <td className="py-3 px-2 font-mono text-sm text-gray-600 dark:text-gray-300">{agent.answer}</td>
                    <td className="py-3 px-2 font-mono text-sm text-gray-600 dark:text-gray-300">{agent.totalTime}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-gray-300 dark:border-gray-600">
                  <td className="py-3 px-2 font-semibold text-gray-700 dark:text-gray-200">Total</td>
                  <td className="py-3 px-2 text-gray-700 dark:text-gray-200"></td>
                  <td className="py-3 px-2 font-mono text-sm font-semibold text-gray-700 dark:text-gray-200">{totals.ready}</td>
                  <td className="py-3 px-2 font-mono text-sm font-semibold text-gray-700 dark:text-gray-200">{totals.notReady}</td>
                  <td className="py-3 px-2 font-mono text-sm font-semibold text-gray-700 dark:text-gray-200">{totals.answer}</td>
                  <td className="py-3 px-2 font-mono text-sm font-semibold text-gray-700 dark:text-gray-200">{totals.totalTime}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Agent Status Sidebar */}
        <div className="dark:bg-gray-700 rounded-lg">
          <h2 className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-100">Agent Status</h2>
          
          {/* Pie Chart */}
          <div className="flex justify-center mb-6">
            <PieChart />
          </div>

          {/* Status Legend */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-gray-600 dark:text-gray-300">Ready</span>
              </div>
              <span className="font-semibold text-gray-600 dark:text-gray-300">{statusCounts.Ready}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span className="text-gray-600 dark:text-gray-300">NotReady</span>
              </div>
              <span className="font-semibold text-gray-600 dark:text-gray-300">{statusCounts.NotReady}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span className="text-gray-600 dark:text-gray-300">Talking</span>
              </div>
              <span className="font-semibold text-gray-600 dark:text-gray-300">{statusCounts.Talking}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-500 rounded"></div>
                <span className="text-gray-600 dark:text-gray-300">Break</span>
              </div>
              <span className="font-semibold text-gray-600 dark:text-gray-300">{statusCounts.Break}</span>
            </div>
            
            <div className="border-t border-gray-300 dark:border-gray-600 pt-4">
              <div className="flex justify-between items-center font-semibold">
                <span className="text-gray-700 dark:text-gray-200">Total</span>
                <span className="text-gray-700 dark:text-gray-200">{total}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentStatusDashboard;
