// src/cms/components/crm/ImageWithValidation.tsx
"use client";

import { useImageValidator } from "@/core/hooks/useImageValidator";
import { useTranslation } from "@/core/hooks/useTranslation";

interface Props {
  src?: string;
  alt?: string;
  className?: string;
  fallback?: string;
}

const ImageWithValidation = ({
  src,
  alt = "",
  className = "",
  fallback = "/images/crm/placeholder.svg"
}: Props) => {
  const status = useImageValidator(src);
  const { t } = useTranslation();

  if (status === "loading") {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <span className="text-xs text-gray-400">
          {t("common.loading")}
        </span>
      </div>
    );
  }

  if (status === "invalid" || !src) {
    return (
      <img
        src={fallback}
        alt="fallback"
        className={className}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
    />
  );
};

export default ImageWithValidation;
