import { formatFileSize, getFileIcon } from "@/cms/components/Attachment/AttachmentConv";
import { FilePreviewCard } from "@/cms/components/Attachment/AttachmentPreviewList";
import { ImageIcon } from "lucide-react";
import { useState, useRef } from "react";

const DndMultiImageUploader: React.FC<{
  onFilesSelect: (files: File[]) => void;
  existingFiles: (File)[]; // Updated type for existingFiles
  handleRemoveFile: (index: number) => void;
  disabled?: boolean;
  accept?: string;
}> = ({ onFilesSelect, existingFiles, handleRemoveFile, disabled, accept }) => {
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
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
      if (imageFiles.length > 0) {
        onFilesSelect(imageFiles);
      } else {
        // setShowToast(true)
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFilesSelect(Array.from(files));
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div>
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
          multiple
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />
        <ImageIcon className="w-12 h-12 text-gray-400" />
        <p className="mt-2 text-sm text-center text-gray-500 dark:text-gray-400">Drag & drop images here, or click to select</p>
      </div>
      {existingFiles.length > 0 && (
        // <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mb-2">
        <div className="grid grid-cols-3">
          {existingFiles.map((file, index: number) => { // 'file' can now be File or an object
            // let imageUrl: string = "";
            // if (file instanceof File || file instanceof Blob) {
            //   imageUrl = URL.createObjectURL(file);
            // } else if (typeof file === 'object' && file !== null && 'url' in file && typeof file.url === 'string') {
            //   imageUrl = file.url;
            // } else {
            //   console.warn("Unexpected file format in existingFiles, cannot determine image URL:", file);
            //   imageUrl = "";
            // }

            return <FilePreviewCard file={file} disabled={disabled} getFileIcon={getFileIcon} formatFileSize={formatFileSize} onRemove={() => handleRemoveFile(index)} />

            {/* <img
                  src={imageUrl}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover rounded border border-gray-300 dark:border-gray-600"
                />
                <Button onClick={() => handleRemoveFile(index)} className="absolute top-1 right-1 rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity" disabled={disabled} size="xxs" variant="error">×</Button> */}



          })}
        </ div>
      )}
    </div>
  );
};


export default DndMultiImageUploader