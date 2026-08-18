// src/components/AnalyticsDashboard.tsx
import React, { useState } from 'react';
import { Clock, Phone, PhoneOff, RotateCcw, Settings, Users } from 'lucide-react';

interface QueuePerformance {
  name: string;
  waiting: string;
  total: number;
  inQueue: number;
  pending: number;
  complete: number;
  cancel: number;
  inSLA: number;
  overSLA: number;
  noSLA: number;
}

interface AgentPerformance {
  agent: string;
  total: number;
  pending: number;
  complete: number;
  cancel: number;
  inSLA: number;
  overSLA: number;
  noSLA: number;
}

interface AgentMonitor {
  agent: string;
  status: 'Ready' | 'Not Ready';
  ready: string;
  notReady: string;
  answer: string;
  totalTime: string;
}

const AnalyticsDashboard: React.FC = () => {
  const [queuePerformance] = useState<QueuePerformance[]>([
    { name: 'TTB เครื่องดื่ม', waiting: '00:00:00', total: 14, inQueue: 0, pending: 0, complete: 0, cancel: 1, inSLA: 0, overSLA: 1, noSLA: 0 },
    { name: 'SCB สายนาน', waiting: '00:00:00', total: 17, inQueue: 1, pending: 0, complete: 0, cancel: 0, inSLA: 0, overSLA: 0, noSLA: 0 },
    { name: 'GSB สายนาน', waiting: '00:00:00', total: 18, inQueue: 2, pending: 0, complete: 0, cancel: 0, inSLA: 0, overSLA: 0, noSLA: 0 },
    { name: 'KBANK เครื่องดื่ม', waiting: '00:00:00', total: 17, inQueue: 1, pending: 0, complete: 0, cancel: 0, inSLA: 0, overSLA: 0, noSLA: 0 },
    { name: 'TTB สายนาน', waiting: '00:00:00', total: 21, inQueue: 2, pending: 0, complete: 0, cancel: 0, inSLA: 0, overSLA: 0, noSLA: 0 },
    { name: 'SCB เครื่องดื่ม', waiting: '00:00:00', total: 12, inQueue: 1, pending: 0, complete: 0, cancel: 0, inSLA: 0, overSLA: 0, noSLA: 0 },
    { name: 'GSB เครื่องดื่ม', waiting: '00:00:00', total: 17, inQueue: 0, pending: 0, complete: 3, cancel: 0, inSLA: 0, overSLA: 1, noSLA: 0 },
    { name: 'TTB เครื่องดื่ม', waiting: '00:00:00', total: 14, inQueue: 0, pending: 0, complete: 0, cancel: 1, inSLA: 0, overSLA: 1, noSLA: 0 },
    { name: 'SCB สายนาน', waiting: '00:00:00', total: 17, inQueue: 1, pending: 0, complete: 0, cancel: 0, inSLA: 0, overSLA: 0, noSLA: 0 },
    { name: 'GSB สายนาน', waiting: '00:00:00', total: 18, inQueue: 2, pending: 0, complete: 0, cancel: 0, inSLA: 0, overSLA: 0, noSLA: 0 },
    { name: 'KBANK เครื่องดื่ม', waiting: '00:00:00', total: 17, inQueue: 1, pending: 0, complete: 0, cancel: 0, inSLA: 0, overSLA: 0, noSLA: 0 },
    { name: 'TTB สายนาน', waiting: '00:00:00', total: 21, inQueue: 2, pending: 0, complete: 0, cancel: 0, inSLA: 0, overSLA: 0, noSLA: 0 },
    { name: 'SCB เครื่องดื่ม', waiting: '00:00:00', total: 12, inQueue: 1, pending: 0, complete: 0, cancel: 0, inSLA: 0, overSLA: 0, noSLA: 0 }
  ]);

  const [agentPerformance] = useState<AgentPerformance[]>([
    { agent: 'Agent 1', total: 2, pending: 0, complete: 2, cancel: 0, inSLA: 0, overSLA: 2, noSLA: 0 },
    { agent: 'Agent 2', total: 1, pending: 0, complete: 0, cancel: 1, inSLA: 0, overSLA: 1, noSLA: 0 },
    { agent: 'Agent 3', total: 2, pending: 0, complete: 1, cancel: 1, inSLA: 0, overSLA: 2, noSLA: 0 },
    { agent: 'Agent 4', total: 2, pending: 5, complete: 2, cancel: 2, inSLA: 0, overSLA: 5, noSLA: 0 },
    { agent: 'Agent 5', total: 3, pending: 1, complete: 3, cancel: 0, inSLA: 2, overSLA: 0, noSLA: 0 },
    { agent: 'Agent 6', total: 4, pending: 0, complete: 3, cancel: 2, inSLA: 2, overSLA: 0, noSLA: 0 },
    { agent: 'Agent 7', total: 5, pending: 0, complete: 1, cancel: 0, inSLA: 2, overSLA: 0, noSLA: 0 },
    { agent: 'Agent 8', total: 4, pending: 2, complete: 2, cancel: 5, inSLA: 2, overSLA: 5, noSLA: 0 },
    { agent: 'Agent 9', total: 5, pending: 0, complete: 1, cancel: 2, inSLA: 3, overSLA: 1, noSLA: 0 }
  ]);

  const [agentMonitor] = useState<AgentMonitor[]>([
    { agent: 'Agent 1', status: 'Ready', ready: '00:01:15', notReady: '01:50:36', answer: '00:00:12', totalTime: '01:52:03' },
    { agent: 'Agent 2', status: 'Not Ready', ready: '00:55:19', notReady: '00:10:21', answer: '00:18:14', totalTime: '01:23:54' },
    { agent: 'Agent 3', status: 'Not Ready', ready: '00:02:57', notReady: '00:04:32', answer: '00:10:16', totalTime: '00:06:06' },
    { agent: 'Agent 4', status: 'Ready', ready: '00:10:28', notReady: '00:01:55', answer: '00:04:32', totalTime: '00:10:05' },
    { agent: 'Agent 5', status: 'Ready', ready: '00:08:17', notReady: '00:10:07', answer: '00:09:19', totalTime: '00:06:48' },
    { agent: 'Agent 6', status: 'Ready', ready: '00:00:02', notReady: '00:03:04', answer: '00:06:21', totalTime: '00:00:22' },
    { agent: 'Agent 7', status: 'Not Ready', ready: '00:08:59', notReady: '00:03:06', answer: '00:06:52', totalTime: '00:05:13' },
    { agent: 'Agent 8', status: 'Ready', ready: '00:03:03', notReady: '00:02:05', answer: '00:00:06', totalTime: '00:00:16' },
    { agent: 'Agent 9', status: 'Ready', ready: '00:07:13', notReady: '00:03:55', answer: '00:00:49', totalTime: '00:02:30' }
  ]);

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded text-xs font-medium";
    switch (status) {
      case 'Ready':
        return `${baseClasses} bg-green-500 text-white`;
      case 'Not Ready':
        return `${baseClasses} bg-red-500 text-white`;
      default:
        return `${baseClasses} bg-gray-500 text-white`;
    }
  };

  const statusCounts = {
    Available: agentMonitor.filter(a => a.status === 'Ready').length,
    OnCall: 2,
    Break: 1
  };

  const monthlyData = [
    { month: 'Jan', calls: 60 },
    { month: 'Feb', calls: 80 },
    { month: 'Mar', calls: 70 },
    { month: 'Apr', calls: 90 },
    { month: 'May', calls: 85 },
    { month: 'Jun', calls: 110 },
    { month: 'Jul', calls: 100 },
    { month: 'Aug', calls: 120 },
    { month: 'Sep', calls: 95 },
    { month: 'Oct', calls: 140 },
    { month: 'Nov', calls: 130 },
    { month: 'Dec', calls: 150 }
  ];

  const AreaChart = () => {
    const maxValue = Math.max(...monthlyData.map(d => d.calls));
    const height = 200;
    const width = 400;
    
    const points = monthlyData.map((item, index) => {
      const x = (index / (monthlyData.length - 1)) * width;
      const y = height - (item.calls / maxValue) * height;
      return `${x},${y}`;
    }).join(' ');
    
    return (
      <div className="dark:bg-gray-700 rounded-lg p-4">
        <h3 className="text-sm font-medium mb-2 dark:text-gray-200">Recent Movement</h3>
        <svg
          // width={width}
          // height={height}
          className="w-full"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
            </linearGradient>
          </defs>
          <polyline
            fill="url(#gradient)"
            stroke="#3b82f6"
            strokeWidth="2"
            points={`0,${height} ${points} ${width},${height}`}
          />
          <polyline
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            points={points}
          />
        </svg>
      </div>
    );
  };

  const BarChart = () => {
    const maxValue = Math.max(...monthlyData.map(d => d.calls));
    
    return (
      <div className="dark:bg-gray-700 rounded-lg p-4">
        <h3 className="text-sm font-medium mb-4 text-gray-700 dark:text-gray-200">Monthly Calls</h3>
        <div className="flex items-end justify-between h-52 gap-1">
          {monthlyData.map((item, index) => (
            <div key={index} className="flex flex-col items-center">
              <div 
                className="bg-blue-500 rounded-t w-6 transition-all duration-300 hover:bg-blue-700"
                style={{ 
                  height: `${(item.calls / maxValue) * 100}px`,
                  minHeight: '4px'
                }}
              ></div>
              <span className="text-xs mt-1 text-gray-500 dark:text-gray-400">{item.month}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const PieChart = () => {
    const total = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
    const availablePercentage = (statusCounts.Available / total) * 100;
    const onCallPercentage = (statusCounts.OnCall / total) * 100;
    const breakPercentage = (statusCounts.Break / total) * 100;

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
            strokeDasharray={`${availablePercentage} ${100 - availablePercentage}`}
            strokeDashoffset="0"
          />
          <circle
            cx="21"
            cy="21"
            r="15.915"
            fill="transparent"
            stroke="#ef4444"
            strokeWidth="6"
            strokeDasharray={`${onCallPercentage} ${100 - onCallPercentage}`}
            strokeDashoffset={`-${availablePercentage}`}
          />
          <circle
            cx="21"
            cy="21"
            r="15.915"
            fill="transparent"
            stroke="#eab308"
            strokeWidth="6"
            strokeDasharray={`${breakPercentage} ${100 - breakPercentage}`}
            strokeDashoffset={`-${availablePercentage + onCallPercentage}`}
          />
        </svg>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 cursor-default">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Analytics Dashboard</h1>
        <div className="flex gap-2">
          <button className="p-2 text-gray-600 dark:text-gray-300 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 rounded border border-gray-400 dark:border-gray-500">
            <Settings size={20} />
          </button>
          <button className="p-2 text-gray-600 dark:text-gray-300 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 rounded border border-gray-400 dark:border-gray-500">
            <RotateCcw size={20} />
          </button>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <div className="dark:bg-gray-700 rounded-lg p-6 flex items-center justify-center gap-4">
          <Phone className="text-green-500 dark:text-green-400" size={24} />
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Incoming Call</div>
            <div className="text-3xl font-bold text-gray-600 dark:text-gray-300">750</div>
          </div>
        </div>
        <div className="dark:bg-gray-700 rounded-lg p-6 flex items-center justify-center gap-4">
          <Clock className="text-yellow-500 dark:text-yellow-400" size={24} />
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Queue Waiting</div>
            <div className="text-3xl font-bold text-gray-600 dark:text-gray-300">7</div>
          </div>
        </div>
        <div className="dark:bg-gray-700 rounded-lg p-6 flex items-center justify-center gap-4">
          <PhoneOff className="text-red-500 dark:text-red-400" size={24} />
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Agent Login</div>
            <div className="text-3xl font-bold text-gray-600 dark:text-gray-300">9</div>
          </div>
        </div>
        <div className="dark:bg-gray-700 rounded-lg p-6 flex items-center justify-center gap-4">
          <Users className="text-purple-500 dark:text-purple-400" size={24} />
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Missed Call</div>
            <div className="text-3xl font-bold text-gray-600 dark:text-gray-300">9</div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <AreaChart />
        
        <div className="dark:bg-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-medium mb-4 dark:text-gray-200">Agent Available</h3>
          <div className="flex items-center justify-center">
            <PieChart />
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="dark:text-gray-300">Available</span>
              </div>
              <span className="dark:text-gray-300">{statusCounts.Available}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span className="dark:text-gray-300">On Call</span>
              </div>
              <span className="dark:text-gray-300">{statusCounts.OnCall}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span className="dark:text-gray-300">Break</span>
              </div>
              <span className="dark:text-gray-300">{statusCounts.Break}</span>
            </div>
          </div>
        </div>

        <BarChart />
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Queue Monitor */}
        <div className="dark:bg-gray-700 rounded-lg">
          <h2 className="text-lg font-medium mb-4 dark:text-gray-200">Queue Monitor</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-gray-600">
                  <th className="text-left py-2 px-1 font-medium text-xs dark:text-gray-200">Name</th>
                  <th className="text-left py-2 px-1 font-medium text-xs dark:text-gray-200">Waiting</th>
                  <th className="text-left py-2 px-1 font-medium text-xs dark:text-gray-200">Total</th>
                  <th className="text-left py-2 px-1 font-medium text-xs dark:text-gray-200">In Queue</th>
                  <th className="text-left py-2 px-1 font-medium text-xs dark:text-gray-200">Pending</th>
                  <th className="text-left py-2 px-1 font-medium text-xs dark:text-gray-200">Complete</th>
                  <th className="text-left py-2 px-1 font-medium text-xs dark:text-gray-200">Cancel</th>
                  <th className="text-left py-2 px-1 font-medium text-xs dark:text-gray-200">In SLA</th>
                  <th className="text-left py-2 px-1 font-medium text-xs dark:text-gray-200">Over SLA</th>
                  <th className="text-left py-2 px-1 font-medium text-xs dark:text-gray-200">No SLA</th>
                </tr>
              </thead>
              <tbody>
                {queuePerformance.map((queue, index) => (
                  <tr key={index} className="border-b dark:border-gray-600 hover:bg-gray-300 dark:hover:bg-gray-600 text-xs">
                    <td className="py-2 px-1 dark:text-gray-300">{queue.name}</td>
                    <td className="py-2 px-1 font-mono dark:text-gray-300">{queue.waiting}</td>
                    <td className="py-2 px-1 text-center dark:text-gray-300">{queue.total}</td>
                    <td className="py-2 px-1 text-center dark:text-gray-300">{queue.inQueue}</td>
                    <td className="py-2 px-1 text-center dark:text-gray-300">{queue.pending}</td>
                    <td className="py-2 px-1 text-center dark:text-gray-300">{queue.complete}</td>
                    <td className="py-2 px-1 text-center dark:text-gray-300">{queue.cancel}</td>
                    <td className="py-2 px-1 text-center dark:text-gray-300">{queue.inSLA}</td>
                    <td className="py-2 px-1 text-center dark:text-gray-300">{queue.overSLA}</td>
                    <td className="py-2 px-1 text-center dark:text-gray-300">{queue.noSLA}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Agent Performance & Monitor */}
        <div className="space-y-6">
          {/* Agent Performance */}
          <div className="dark:bg-gray-700 rounded-lg">
            <h2 className="text-lg font-medium mb-4 dark:text-gray-200">Agent Performance</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b dark:border-gray-600">
                    <th className="text-left py-2 px-1 font-medium text-xs dark:text-gray-200">Agent</th>
                    <th className="text-left py-2 px-1 font-medium text-xs dark:text-gray-200">Total</th>
                    <th className="text-left py-2 px-1 font-medium text-xs dark:text-gray-200">Pending</th>
                    <th className="text-left py-2 px-1 font-medium text-xs dark:text-gray-200">Complete</th>
                    <th className="text-left py-2 px-1 font-medium text-xs dark:text-gray-200">Cancel</th>
                    <th className="text-left py-2 px-1 font-medium text-xs dark:text-gray-200">In SLA</th>
                    <th className="text-left py-2 px-1 font-medium text-xs dark:text-gray-200">Over SLA</th>
                    <th className="text-left py-2 px-1 font-medium text-xs dark:text-gray-200">No SLA</th>
                  </tr>
                </thead>
                <tbody>
                  {agentPerformance.slice(0, 5).map((agent, index) => (
                    <tr key={index} className="border-b dark:border-gray-600 hover:bg-gray-300 dark:hover:bg-gray-600 text-xs">
                      <td className="py-2 px-1 dark:text-gray-300">{agent.agent}</td>
                      <td className="py-2 px-1 text-center dark:text-gray-300">{agent.total}</td>
                      <td className="py-2 px-1 text-center dark:text-gray-300">{agent.pending}</td>
                      <td className="py-2 px-1 text-center dark:text-gray-300">{agent.complete}</td>
                      <td className="py-2 px-1 text-center dark:text-gray-300">{agent.cancel}</td>
                      <td className="py-2 px-1 text-center dark:text-gray-300">{agent.inSLA}</td>
                      <td className="py-2 px-1 text-center dark:text-gray-300">{agent.overSLA}</td>
                      <td className="py-2 px-1 text-center dark:text-gray-300">{agent.noSLA}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Agent Monitor */}
          <div className="dark:bg-gray-700 rounded-lg">
            <h2 className="text-lg font-medium mb-4 dark:text-gray-200">Agent Monitor</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b dark:border-gray-600">
                    <th className="text-left py-2 px-1 font-medium text-xs dark:text-gray-300">Agent</th>
                    <th className="text-left py-2 px-1 font-medium text-xs dark:text-gray-300">Status</th>
                    <th className="text-left py-2 px-1 font-medium text-xs dark:text-gray-300">Ready</th>
                    <th className="text-left py-2 px-1 font-medium text-xs dark:text-gray-300">Not Ready</th>
                    <th className="text-left py-2 px-1 font-medium text-xs dark:text-gray-300">Answer</th>
                    <th className="text-left py-2 px-1 font-medium text-xs dark:text-gray-300">Total Time</th>
                  </tr>
                </thead>
                <tbody>
                  {agentMonitor.slice(0, 5).map((agent, index) => (
                    <tr key={index} className="border-b dark:border-gray-600 hover:bg-gray-300 dark:hover:bg-gray-600 text-xs">
                      <td className="py-2 px-1 dark:text-gray-300">{agent.agent}</td>
                      <td className="py-2 px-1">
                        <span className={getStatusBadge(agent.status)}>
                          {agent.status}
                        </span>
                      </td>
                      <td className="py-2 px-1 font-mono dark:text-gray-300">{agent.ready}</td>
                      <td className="py-2 px-1 font-mono dark:text-gray-300">{agent.notReady}</td>
                      <td className="py-2 px-1 font-mono dark:text-gray-300">{agent.answer}</td>
                      <td className="py-2 px-1 font-mono dark:text-gray-300">{agent.totalTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
