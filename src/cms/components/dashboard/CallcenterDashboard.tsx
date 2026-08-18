// src/components/CallcenterDashboard.tsx
import React, { useState } from "react";
import { Clock, Phone, PhoneOff, RotateCcw, Settings, Users } from "lucide-react";

interface QueueData {
  name: string;
  waiting: string;
  totalCall: number;
  inQueue: number;
  answer: number;
  misscall: number;
  agentAvailable: number;
  agentOnCall: number;
}

interface AgentData {
  id: number;
  name: string;
  status: "Ready" | "Not Ready" | "Talking";
  ext: string;
}

const CallcenterDashboard: React.FC = () => {
  const [queueData] = useState<QueueData[]>([
    {
      name: "VIP",
      waiting: "00:00:00",
      totalCall: 10,
      inQueue: 0,
      answer: 10,
      misscall: 0,
      agentAvailable: 6,
      agentOnCall: 9
    },
    {
      name: "TTB เครื่องดื่ม",
      waiting: "00:00:00",
      totalCall: 140,
      inQueue: 0,
      answer: 130,
      misscall: 1,
      agentAvailable: 6,
      agentOnCall: 9
    },
    {
      name: "SCB สายนาน",
      waiting: "00:00:15",
      totalCall: 60,
      inQueue: 1,
      answer: 60,
      misscall: 3,
      agentAvailable: 0,
      agentOnCall: 9
    },
    {
      name: "GSB สายนาน",
      waiting: "00:00:30",
      totalCall: 20,
      inQueue: 2,
      answer: 20,
      misscall: 0,
      agentAvailable: 0,
      agentOnCall: 5
    },
    {
      name: "KBANK เครื่องดื่ม",
      waiting: "00:00:25",
      totalCall: 240,
      inQueue: 1,
      answer: 240,
      misscall: 0,
      agentAvailable: 0,
      agentOnCall: 4
    },
    {
      name: "TTB สายนาน",
      waiting: "00:01:15",
      totalCall: 70,
      inQueue: 2,
      answer: 70,
      misscall: 0,
      agentAvailable: 0,
      agentOnCall: 9
    },
    {
      name: "SCB เครื่องดื่ม",
      waiting: "00:00:36",
      totalCall: 220,
      inQueue: 1,
      answer: 220,
      misscall: 1,
      agentAvailable: 0,
      agentOnCall: 6
    },
    {
      name: "GSB เครื่องดื่ม",
      waiting: "00:00:00",
      totalCall: 70,
      inQueue: 0,
      answer: 70,
      misscall: 0,
      agentAvailable: 6,
      agentOnCall: 7
    }
  ]);

  const [agentData] = useState<AgentData[]>([
    { id: 1, name: "Agent 1", status: "Ready", ext: "20001" },
    { id: 2, name: "Agent 2", status: "Talking", ext: "20002" },
    { id: 3, name: "Agent 3", status: "Not Ready", ext: "20003" },
    { id: 4, name: "Agent 4", status: "Ready", ext: "20004" },
    { id: 5, name: "Agent 5", status: "Ready", ext: "20005" },
    { id: 6, name: "Agent 6", status: "Ready", ext: "20006" },
    { id: 7, name: "Agent 7", status: "Not Ready", ext: "20007" },
    { id: 8, name: "Agent 8", status: "Ready", ext: "20008" },
    { id: 9, name: "Agent 9", status: "Ready", ext: "20009" }
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

  const totals = {
    totalCall: queueData.reduce((sum, item) => sum + item.totalCall, 0),
    inQueue: queueData.reduce((sum, item) => sum + item.inQueue, 0),
    answer: queueData.reduce((sum, item) => sum + item.answer, 0),
    misscall: queueData.reduce((sum, item) => sum + item.misscall, 0)
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 cursor-default">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Call Center Dashboard</h1>
        <div className="flex gap-2">
          <button className="p-2 text-gray-600 dark:text-gray-300 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 rounded border border-gray-400 dark:border-gray-500">
            <Settings size={20} />
          </button>
          <button className="p-2 text-gray-600 dark:text-gray-300 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 rounded border border-gray-400 dark:border-gray-500">
            <RotateCcw size={20} />
          </button>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        <div className="dark:bg-gray-700 rounded-lg p-6 flex items-center justify-center gap-4">
          <Phone className="text-blue-500 dark:text-blue-400" size={24} />
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Incoming Call</div>
            <div className="text-3xl font-bold text-gray-600 dark:text-gray-300">750</div>
          </div>
        </div>

        <div className="dark:bg-gray-700 rounded-lg p-6 flex items-center justify-center gap-4">
          <Phone className="text-green-500 dark:text-green-400" size={24} />
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Answer Call</div>
            <div className="text-3xl font-bold text-gray-600 dark:text-gray-300">750</div>
          </div>
        </div>

        <div className="dark:bg-gray-700 rounded-lg p-6 flex items-center justify-center gap-4">
          <Clock className="text-yellow-500 dark:text-yellow-400" size={24} />
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Queue Waiting</div>
            <div className="text-3xl font-bold text-gray-600 dark:text-gray-300">7</div>
          </div>
        </div>

        <div className="dark:bg-gray-700 rounded-lg p-6 flex items-center justify-center gap-4">
          <PhoneOff className="text-red-500 dark:text-red-400" size={24} />
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Missed Call</div>
            <div className="text-3xl font-bold text-gray-600 dark:text-gray-300">9</div>
          </div>
        </div>

        <div className="dark:bg-gray-700 rounded-lg p-6 flex items-center justify-center gap-4">
          <Users className="text-purple-500 dark:text-purple-400" size={24} />
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Agent Logged In</div>
            <div className="text-3xl font-bold text-gray-600 dark:text-gray-300">9</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Queue Monitor */}
        <div className="lg:col-span-2 dark:bg-gray-700 rounded-lg">
          <h2 className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-100">Queue Monitor</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-300 dark:border-gray-600">
                  <th className="text-left py-3 px-2 font-medium text-gray-700 dark:text-gray-200">Name</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700 dark:text-gray-200">Waiting</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700 dark:text-gray-200">Total Call</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700 dark:text-gray-200">In Queue</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700 dark:text-gray-200">Answer</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700 dark:text-gray-200">Misscall</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700 dark:text-gray-200">Agent available</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700 dark:text-gray-200">Agent On Call</th>
                </tr>
              </thead>
              <tbody>
                {queueData.map((queue, index) => (
                  <tr key={index} className="border-b border-gray-300 dark:border-gray-600 hover:bg-gray-300 dark:hover:bg-gray-600">
                    <td className="py-3 px-2 font-mono text-sm text-gray-600 dark:text-gray-300">{queue.name}</td>
                    <td className="py-3 px-2 font-mono text-sm text-gray-600 dark:text-gray-300">{queue.waiting}</td>
                    <td className="py-3 px-2 font-mono text-sm text-gray-600 dark:text-gray-300">{queue.totalCall}</td>
                    <td className="py-3 px-2 font-mono text-sm text-gray-600 dark:text-gray-300">{queue.inQueue}</td>
                    <td className="py-3 px-2 font-mono text-sm text-gray-600 dark:text-gray-300">{queue.answer}</td>
                    <td className="py-3 px-2 font-mono text-sm text-gray-600 dark:text-gray-300">{queue.misscall}</td>
                    <td className="py-3 px-2 font-mono text-sm text-gray-600 dark:text-gray-300">{queue.agentAvailable}</td>
                    <td className="py-3 px-2 font-mono text-sm text-gray-600 dark:text-gray-300">{queue.agentOnCall}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-gray-300 dark:border-gray-600">
                  <td className="py-3 px-2 font-semibold text-gray-700 dark:text-gray-200">Total</td>
                  <td className="py-3 px-2 text-gray-700 dark:text-gray-200"></td>
                  <td className="py-3 px-2 font-mono text-sm font-semibold text-gray-700 dark:text-gray-200">{totals.totalCall}</td>
                  <td className="py-3 px-2 font-mono text-sm font-semibold text-gray-700 dark:text-gray-200">{totals.inQueue}</td>
                  <td className="py-3 px-2 font-mono text-sm font-semibold text-gray-700 dark:text-gray-200">{totals.answer}</td>
                  <td className="py-3 px-2 font-mono text-sm font-semibold text-gray-700 dark:text-gray-200">{totals.misscall}</td>
                  <td className="py-3 px-2 text-gray-700 dark:text-gray-200"></td>
                  <td className="py-3 px-2 text-gray-700 dark:text-gray-200"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Agent Monitor */}
        <div className="dark:bg-gray-700 rounded-lg">
          <h2 className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-100">Agent Monitor</h2>
          <div className="space-y-1">
            {agentData.map((agent) => (
              <div key={agent.id} className="flex justify-between items-center px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                <div>
                  <div className="font-medium text-gray-600 dark:text-gray-300">{agent.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Ext. {agent.ext}</div>
                </div>
                <span className={getStatusBadge(agent.status)}>
                  {agent.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallcenterDashboard;
