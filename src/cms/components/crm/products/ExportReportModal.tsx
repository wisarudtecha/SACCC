import { useState } from "react";
import { FileText, Image, Loader2 } from "lucide-react";
import { Modal } from "@/core/components/ui/modal";
import Button from "@/core/components/ui/button/Button";

type ExportType = "pdf" | "image";

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (type: ExportType) => Promise<void>;
}

const exportOptions: { type: ExportType; label: string; description: string; icon: React.ElementType }[] = [
  {
    type: "pdf",
    label: "PDF",
    description: "Export as a PDF document",
    icon: FileText,
  },
  {
    type: "image",
    label: "Image",
    description: "Export as a PNG image",
    icon: Image,
  },
];

const ExportReportModal = ({ isOpen, onClose, onExport }: ExportReportModalProps) => {
  const [selected, setSelected] = useState<ExportType | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!selected) return;
    setIsExporting(true);
    try {
      await onExport(selected);
    } finally {
      setIsExporting(false);
      setSelected(null);
    }
  };

  const handleClose = () => {
    if (isExporting) return;
    setSelected(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      showCloseButton={!isExporting}
      className="max-w-md w-full p-6"
    >
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">Export Report</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Choose a format to export the dashboard</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {exportOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = selected === option.type;
          return (
            <button
              key={option.type}
              onClick={() => !isExporting && setSelected(option.type)}
              disabled={isExporting}
              className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                isSelected
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                  : "border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <div className={`p-3 rounded-xl ${isSelected ? "bg-blue-100 dark:bg-blue-800" : "bg-gray-100 dark:bg-gray-700"}`}>
                <Icon className={`w-7 h-7 ${isSelected ? "text-blue-600 dark:text-blue-300" : "text-gray-500 dark:text-gray-400"}`} />
              </div>
              <div className="text-center">
                <p className={`font-semibold text-sm ${isSelected ? "text-blue-600 dark:text-blue-300" : "text-gray-700 dark:text-gray-300"}`}>
                  {option.label}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{option.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleClose}
          disabled={isExporting}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleExport}
          disabled={!selected || isExporting}
          className="flex-1 flex items-center justify-center gap-2"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Exporting...
            </>
          ) : (
            "Export"
          )}
        </Button>
      </div>
    </Modal>
  );
};

export default ExportReportModal;
