// /src/components/crud/ExportMenu.tsx
import 
  // React, 
  { useState } 
from "react";
import Button from "@/core/components/ui/button/Button";
import { Modal } from "@/core/components/ui/modal";
import { DownloadIcon, FileIcon, CloseIcon } from "@/core/icons";
import type { ExportOption } from "@/core/types/enhanced-crud";

interface ExportMenuProps<T> {
  data: T[];
  exportOptions: ExportOption[];
  filename?: string;
  onExport: (option: ExportOption, data: T[]) => Promise<void>;
}

export const ExportMenu = <T,>({
  data,
  exportOptions,
  // filename = "export",
  onExport
}: ExportMenuProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const handleExport = async (option: ExportOption) => {
    setLoading(option.key);
    try {
      await onExport(option, data);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setLoading(null);
      setIsOpen(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="h-11"
      >
        <DownloadIcon className="w-4 h-4" />
        Export
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} className="max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Export Data
          </h3>
          <Button
            onClick={() => setIsOpen(false)}
            variant="ghost"
            size="sm"
          >
            <CloseIcon className="w-4 h-4" />
          </Button>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
          Choose a format to export {data.length} items
        </p>

        <div className="space-y-2">
          {exportOptions.map(option => {
            const Icon = option.icon || FileIcon;
            const isLoading = loading === option.key;

            return (
              <Button
                key={option.key}
                onClick={() => handleExport(option)}
                variant="outline"
                className="w-full justify-start"
                disabled={isLoading}
              >
                <Icon className="w-4 h-4" />
                {isLoading ? "Exporting..." : option.label}
                <span className="ml-auto text-xs text-gray-500">
                  .{option.format}
                </span>
              </Button>
            );
          })}
        </div>
      </Modal>
    </>
  );
};
