// src/cms/components/crm/ItemList.tsx
import React from "react";
import { useImageValidator } from "@/core/hooks/useImageValidator";

const ItemList: React.FC<{
  item: Record<string, React.ReactNode>;
  language?: string;
}> = ({ item, language }) => {
  const attachment = item?.attachment as { attUrl?: string; attName?: string } | undefined;
  const imageStatus = useImageValidator(attachment?.attUrl);
  const imageUrl = imageStatus === "valid" && attachment?.attUrl ? attachment?.attUrl : "/images/crm/placeholder.svg";
  const imageAlt = attachment?.attName || (language === "th" ? String(item?.th || "") : String(item?.en || "")) || "";
  return (
    <div className="flex items-center gap-2">
      {imageUrl && (
        <img
          src={imageUrl}
          alt={imageAlt}
          className="w-10 h-10 rounded object-cover"
        />
      )}

      <span className="font-medium line-clamp-2">
        {language === "th" ? item.th : item.en}
      </span>
    </div>
  );
};

export default ItemList;
