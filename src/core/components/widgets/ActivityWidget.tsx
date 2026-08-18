// /src/components/widgets/ActivityWidget.tsx
import React, { useState, useEffect } from "react";
import type { DashboardWidget } from "@/core/types/dashboard";
import { Plus, Activity, Clock, Users, CheckCircle } from "lucide-react";

export const ActivityWidget: React.FC<{ widget: DashboardWidget }> = ({ widget }) => {
  // const [activities, setActivities] = useState([
  //   { id: 1, user: 'John Doe', action: 'created ticket', target: '#001', time: '2 mins ago', type: 'create' },
  //   { id: 2, user: 'Jane Smith', action: 'updated status', target: '#002', time: '5 mins ago', type: 'update' },
  //   { id: 3, user: 'Bob Wilson', action: 'commented on', target: '#003', time: '12 mins ago', type: 'comment' },
  //   { id: 4, user: 'Alice Brown', action: 'assigned ticket', target: '#004', time: '1 hour ago', type: 'assign' }
  // ]);

  // Updated: [07-07-2025] v0.1.1
  const [activities, setActivities] = useState([
    { id: 1, user: 'John Doe', action: 'created case', target: '#CAS-001', time: '2 mins ago', type: 'create' },
    { id: 2, user: 'Jane Smith', action: 'updated status', target: '#CAS-002', time: '5 mins ago', type: 'update' },
    { id: 3, user: 'Bob Wilson', action: 'assigned case', target: '#CAS-003', time: '12 mins ago', type: 'assign' },
    { id: 4, user: 'Alice Brown', action: 'resolved case', target: '#CAS-004', time: '1 hour ago', type: 'resolve' }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      // Updated: [07-07-2025] v0.1.1
      const actions = ['created case', 'updated status', 'assigned case', 'resolved case', 'commented on'];
      const users = ['John Doe', 'Jane Smith', 'Bob Wilson', 'Alice Brown', 'Mike Johnson'];
      const types = ['create', 'update', 'assign', 'resolve', 'comment'];

      // const newActivity = {
      //   id: Date.now(),
      //   user: ['John Doe', 'Jane Smith', 'Bob Wilson', 'Alice Brown'][Math.floor(Math.random() * 4)],
      //   action: ['created ticket', 'updated status', 'commented on', 'assigned ticket'][Math.floor(Math.random() * 4)],
      //   target: `#${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`,
      //   time: 'Just now',
      //   type: ['create', 'update', 'comment', 'assign'][Math.floor(Math.random() * 4)]
      // };

      // Updated: [07-07-2025] v0.1.1
      const newActivity = {
        id: Date.now(),
        user: users[Math.floor(Math.random() * users.length)],
        action: actions[Math.floor(Math.random() * actions.length)],
        target: `#CAS-${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`,
        time: 'Just now',
        type: types[Math.floor(Math.random() * types.length)]
      };
      
      setActivities(prev => [newActivity, ...prev.slice(0, 3)]);
    }, widget.config.refreshInterval || 15000);

    return () => clearInterval(interval);
  }, [widget.config.refreshInterval]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'create': return <Plus className="h-3 w-3 text-green-500 dark:text-green-400" />;
      case 'update': return <Activity className="h-3 w-3 text-blue-500 dark:text-blue-400" />;
      case 'comment': return <Clock className="h-3 w-3 text-yellow-500 dark:text-yellow-400" />;
      case 'assign': return <Users className="h-3 w-3 text-purple-500 dark:text-purple-400" />;
      // Updated: [07-07-2025] v0.1.1
      case 'resolve': return <CheckCircle className="h-3 w-3 text-green-500 dark:text-green-400" />;
      default: return <Activity className="h-3 w-3 text-gray-500 dark:text-gray-400" />;
    }
  };

  return (
    <div className="h-full bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">{widget.title}</h3>
        <Activity className="h-4 w-4 text-green-500 dark:text-green-400" />
      </div>
      <div className="space-y-3 overflow-y-auto max-h-48">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 dark:text-white">
                <span className="font-medium">{activity.user}</span>
                {' '}{activity.action}{' '}
                <span className="font-medium text-blue-600 dark:text-blue-300">{activity.target}</span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
