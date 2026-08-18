// src/components/modals/WidgetConfigModal.tsx
// Updated: [07-07-2025] v0.1.1
import React, { useState, useEffect } from "react";
import type { DashboardWidget } from "@/core/types/dashboard";
import Button from "@/core/components/ui/button/Button";
import Input from "@/core/components/form/input/InputField";
import Select from "@/core/components/form/Select";
import { X } from "lucide-react";

export const WidgetConfigModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  widget: DashboardWidget;
  onUpdate: (updates: Partial<DashboardWidget>) => void;
}> = ({ isOpen, onClose, widget, onUpdate }) => {
  const [config, setConfig] = useState(widget);

  useEffect(() => {
    setConfig(widget);
  }, [widget]);

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdate(config);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-900 dark:bg-white bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Configure Widget</h2>
          <Button onClick={onClose} variant="outline">
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Title</label>
            <Input
              type="text"
              value={config.title}
              onChange={(e) => setConfig({ ...config, title: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Width (Grid Columns)</label>
            <Select
              value={`${config.position.w}`}
              onChange={(value) => setConfig({
                ...config,
                position: { ...config.position, w: parseInt(value) }
              })}
              options={
                ([]).map((option: string) => ({
                  value: `${parseInt(option) + 1}`,
                  label: `${parseInt(option) + 1} Column${parseInt(option) > 0 ? "s" : ""}`
                }))
              }
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Height (Grid Rows)</label>
            <Select
              value={`${config.position.h}`}
              onChange={(value) => setConfig({
                ...config,
                position: { ...config.position, h: parseInt(value) }
              })}
              options={
                ([]).map((option: string) => ({
                  value: `${parseInt(option) + 1}`,
                  label: `${parseInt(option) + 1} Row${parseInt(option) > 0 ? "s" : ""}`
                }))
              }
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Refresh Interval</label>
            <Select
              value={`${config.config.refreshInterval || 30000}`}
              onChange={(value) => setConfig({
                ...config,
                config: { ...config.config, refreshInterval: parseInt(value) }
              })}
              options={
                ([`15`, `30`, `60`, `300`]).map((option: string) => ({
                  value: `${parseInt(option) * 1000}`,
                  label: `${parseInt(option) >= 60 ? `${parseInt(option) / 60}` : `${parseInt(option)}` + (parseInt(option) < 60 ? "seconds" : "minute")}`
                }))
              }
            />
          </div>
        </div>
        
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            onClick={onClose}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="primary"
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};
