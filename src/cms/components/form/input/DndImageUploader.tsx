import Button from "@/core/components/ui/button/Button";
import { ImageIcon } from "lucide-react";
import { useState, useRef } from "react";

const DndImageUploader: React.FC<{
  onFileSelect: (file: File) => void;
  existingFile: File | null;
  handleRemoveFile: () => void;
  disabled?: boolean;
  accept?: string;
}> = ({ onFileSelect, existingFile, handleRemoveFile, disabled, accept }) => {
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation(); // Necessary to allow drop
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      if (files[0].type.startsWith('image/')) {
        onFileSelect(files[0]);
      } else {

        // setShowToast(true)
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div>
      {existingFile ? (
        <div className="relative group mt-2 w-full h-40">
          <img src={URL.createObjectURL(existingFile)} alt="Selected" className="w-full h-full object-contain rounded border border-gray-300 dark:border-gray-600" />
          <Button onClick={handleRemoveFile} className="absolute top-1 right-1 rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity" disabled={disabled} size="xxs" variant="error">×</Button>
        </div>
      ) : (
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleClick}
          className={`w-full h-40 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors
              ${dragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'}
              ${disabled ? 'cursor-not-allowed bg-gray-100 dark:bg-gray-800' : 'cursor-pointer hover:border-blue-400'}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept || "image/*"}
            onChange={handleFileChange}
            className="hidden"
            disabled={disabled}
          />
          <ImageIcon className="w-12 h-12 text-gray-400" />
          <p className="mt-2 text-sm text-center text-gray-500 dark:text-gray-400">Drag & drop an image here, or click to select</p>
        </div>
      )}
    </div>
  );
};

export default DndImageUploader