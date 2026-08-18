// /src/components/area/Area.tsx
import React from "react";
import { MapPin } from "lucide-react";

const AreaDesignerContent: React.FC<{ showAreaDesigner: (value: boolean) => void }> = ({ showAreaDesigner }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Interactive Area Designer
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Draw and configure response areas with advanced GIS tools
          </p>
        </div>
        <div className="p-6">
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <MapPin className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Interactive Map Designer</h3>
            <p>Advanced polygon drawing, GIS integration, and area configuration tools will be implemented here.</p>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => showAreaDesigner(false)}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Save Area
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AreaDesignerContent;
