// src/cms/components/crm/ItemCard.tsx
import React from "react";
import { useImageValidator } from "@/core/hooks/useImageValidator";
import { convertDaysToMonths, formatPrice } from "@/cms/utils/productHelper";
import type { Brand } from "@/cms/types/brand";
import type { Category } from "@/cms/types/category";
import Badge from "@/core/components/ui/badge/Badge";

const ItemCard: React.FC<{
  actions?: React.ReactNode;
  brands?: Brand[];
  categories?: Category[];
  item: Record<string, React.ReactNode>;
  language?: string;
  parentKey?: string;
  parents?: Record<string, React.ReactNode>[];
  onPreview?: (url: string, alt: string) => void;
}> = ({ actions, brands, categories, item, language, parentKey, parents, onPreview }) => {
  const brand = brands?.find(b => b?.brandId === item?.brandId);
  const category = categories?.find(c => c?.categoryId === item?.categoryId);
  const parent = parentKey && parents?.find(p => p[parentKey] === item[parentKey]);
  const attachment = item?.attachment as { attUrl?: string; attName?: string } | undefined;
  const imageStatus = useImageValidator(attachment?.attUrl);
  const imageUrl = imageStatus === "valid" && attachment?.attUrl ? attachment?.attUrl : "/images/crm/placeholder.svg";
  const imageAlt = attachment?.attName || (language === "th" ? String(item?.th || "") : String(item?.en || "")) || "";
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg overflow-hidden hover:border-gray-200 dark:hover:border-gray-700 transition-colors flex flex-col h-full">
      <div 
        className="h-48 bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
        onClick={() => onPreview?.(imageUrl, imageAlt)}
      >
        <img
          src={imageUrl}
          alt={imageAlt}
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="p-4 flex flex-col flex-1">
        <div className="inline-flex items-start justify-between">
          <div>
            <h3 className="text-gray-900 dark:text-white font-semibold mb-2 line-clamp-2 flex-1 min-h-12">
              {language === "th" ? item?.th : item?.en}
            </h3>

            <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">
              {item?.code}
            </p>
          </div>
          
          <div className="flex item-center gap-1">

          </div>
        </div>
        
        <div className="space-y-2 mb-3 text-sm flex-1">
          {brand && (
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>Brand:</span>
              <span className="text-black dark:text-white font-medium">
                {brand ? (language === "th" ? brand?.th : brand?.en) : "-"}
              </span>
            </div>
          )}
          
          {category && (
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>Category:</span>
              <span className="text-black dark:text-white font-medium">
                {category ? (language === "th" ? category?.th : category?.en) : "-"}
              </span>
            </div>
          )}
          
          {item?.mfd && (
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>Year:</span>
              <span className="text-black dark:text-white font-medium">
                {item?.mfd}
              </span>
            </div>
          )}
          
          {item?.price && (
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>Price:</span>
              <span className="text-black dark:text-white font-semibold">
                {formatPrice(item?.price as unknown as number)}
              </span>
            </div>
          )}
        </div>
        
        {item?.warranty && (
          <Badge className="mb-3 w-fit" color="success">
            {convertDaysToMonths(item?.warranty as unknown as number)}
          </Badge>
        )}

        {parent && (
          <div className="flex justify-between mb-3 text-gray-500 dark:text-gray-400 text-sm">
            <span>Belong to:</span>
            <span className="text-black dark:text-white font-medium">
              {parent ? (language === "th" ? parent?.th : parent?.en) : "-"}
            </span>
          </div>
        )}
        
        <div className="mt-auto">
          {actions}
        </div>
      </div>
    </div>
  );
};

export default ItemCard;
