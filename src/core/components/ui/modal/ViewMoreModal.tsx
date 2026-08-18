// src/components/modals/ViewMoreModal.tsx
// Updated: [07-07-2025] v0.1.1
import React from "react";
import type { DashboardWidget } from "@/core/types/dashboard";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/core/components/ui/table";
import Button from "@/core/components/ui/button/Button";
import { X } from "lucide-react";

export const ViewMoreModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  widget: DashboardWidget;
}> = ({ isOpen, onClose, widget }) => {
  if (!isOpen) return null;

  const renderExpandedWidget = () => {
    // Render a larger version of the widget with more details
    switch (widget.type) {
      case 'table':
        return (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">{widget.title} - Detailed View</h2>
            <div className="overflow-x-auto">
              <Table className="w-full text-sm">
                <TableHeader>
                  <TableRow className="border-b border-gray-200 dark:border-gray-700">
                    <TableCell isHeader className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Products</TableCell>
                    <TableCell isHeader className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Category</TableCell>
                    <TableCell isHeader className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Price</TableCell>
                    <TableCell isHeader className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Status</TableCell>
                    <TableCell isHeader className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Date</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 10 }, (_, i) => (
                    <TableRow key={i} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800">
                      <TableCell className="py-3 px-4">Product {i + 1}</TableCell>
                      <TableCell className="py-3 px-4">Category {i + 1}</TableCell>
                      <TableCell className="py-3 px-4">${(Math.random() * 1000).toFixed(2)}</TableCell>
                      <TableCell className="py-3 px-4">
                        <span className="px-2 py-1 rounded-full text-xs bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100">
                          Active
                        </span>
                      </TableCell>
                      <TableCell className="py-3 px-4">2024-01-{String(i + 1).padStart(2, '0')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        );
      default:
        return (
          <div className="p-6 text-center">
            <h2 className="text-xl font-bold mb-4">{widget.title} - Detailed View</h2>
            <p className="text-gray-600 dark:text-gray-300">Detailed view for {widget.type} widgets coming soon...</p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 dark:bg-white bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Widget Details</h2>
          <Button onClick={onClose} variant="outline">
            <X className="h-5 w-5" />
          </Button>
        </div>
        {renderExpandedWidget()}
      </div>
    </div>
  );
};
