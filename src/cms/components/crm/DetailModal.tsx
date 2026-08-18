// src/cms/components/crm/DetailModal.tsx
import { X } from "lucide-react";
import { useImageValidator } from "@/core/hooks/useImageValidator";
import { useTranslation } from "@/core/hooks/useTranslation";
import { Cell } from "@/cms/components/crm/View";
import { getColSpanClass } from "@/cms/utils/productHelper";
import type { Column } from "@/cms/types/product";
import Button from "@/core/components/ui/button/Button";

interface DetailModalProps<T> {
  columns: Column<T>[];
  data: T | null;
  open: boolean;
  title: string;
  getImage?: (item: T) => { url: string; alt: string } | null;
  onClose: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onImageClick?: (url: string, alt: string) => void;
}

const DetailModal = <T,>({
  columns,
  data,
  open,
  title,
  getImage,
  onClose,
  onDelete,
  onEdit,
  onImageClick
}: DetailModalProps<T>) => {
  const image = data ? getImage?.(data) : null;
  const imageStatus = useImageValidator(image?.url);
  const { t } = useTranslation();

  if (!open || !data) {
    return null;
  }

  const imageUrl = imageStatus === "valid" && image?.url ? image?.url : "/images/crm/placeholder.svg";

  return (
    <div className="fixed inset-0 bg-white/90 dark:bg-black/70 flex items-center justify-center z-9999">
      <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-black dark:text-white">{title}</h2>
          
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {image && (
          <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-4 overflow-hidden">
            <img
              src={imageUrl}
              alt={image.alt}
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => onImageClick?.(image.url, image.alt)}
            />
          </div>
        )}

        <div className="py-6">
          {/* Two-column grid layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {columns.map(col => (
              <div
                key={String(col.key)}
                className={getColSpanClass(col as unknown as Column<unknown>)}
              >
                <label className="text-gray-500 dark:text-gray-400 text-sm">{col.label}</label>

                <div className="text-black dark:text-white font-semibold">
                  {/* {col.render ? col.render(data) : String(data[col.key as keyof T] || "")} */}
                  <Cell col={col} item={data} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          {onDelete && (
            <Button variant="outline-error" size="sm" onClick={onDelete}>
              {t("crud.common.delete")}
            </Button>
          )}
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              {t("crud.common.update")}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onClose}>
            {t("common.close")}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default DetailModal;
