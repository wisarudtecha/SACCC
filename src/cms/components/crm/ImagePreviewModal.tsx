// src/cms/components/crm/ImagePreviewModal.tsx
import { useState } from "react";
import { X, ZoomIn, ZoomOut } from "lucide-react";
import Button from "@/core/components/ui/button/Button";

interface ImagePreviewModalProps {
  alt: string | undefined;
  open: boolean;
  url: string | undefined;
  onClose: () => void;
}

const ImagePreviewModal = ({ alt, open, url, onClose }: ImagePreviewModalProps) => {
  const [zoom, setZoom] = useState(1);

  if (!open || !url) {
    return null;
  }

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-10000">
      <div className="relative w-full h-full flex items-center justify-center p-4">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-300 bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Controls */}
        <div className="absolute top-4 left-4 flex gap-2 z-10">
          <Button
            onClick={handleZoomOut}
            variant="outline"
            size="sm"
            className="bg-black/50 hover:bg-black/70 border-white/20  dark:text-white"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button
            onClick={handleZoomIn}
            variant="outline"
            size="sm"
            className="bg-black/50 hover:bg-black/70 border-white/20 dark:text-white"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>

        {/* Image */}
        <div className="overflow-auto max-w-full max-h-full">
          <img
            src={url}
            alt={alt}
            style={{
              transform: `scale(${zoom})`,
              transition: 'transform 0.2s ease-in-out'
            }}
            className="max-w-full max-h-full object-contain"
          />
        </div>

        {/* Image title */}
        {alt && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 rounded-lg cursor-default">
            {alt}
          </div>
        )}
      </div>
    </div>
  );
}

export default ImagePreviewModal;
