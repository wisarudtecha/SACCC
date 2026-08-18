// /src/components/area/Coverage.tsx
import React from "react";
import { Activity } from "lucide-react";

const AnalyticContent: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="text-center py-12 text-gray-400 dark:text-gray-500 cursor-default">
        <Activity className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-medium mb-2">Advanced Analytics Coming Soon</h3>
        <p>Detailed performance analytics, predictive modeling, and optimization recommendations will be available here.</p>
      </div>
    </div>
  );
};

export default AnalyticContent;
