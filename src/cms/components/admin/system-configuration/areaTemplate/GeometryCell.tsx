// /src/cms/components/admin/system-configuration/areaTemplate/GeometryCell.tsx
import React from "react";
import { useTranslation } from "@/core/hooks/useTranslation";
import type { PolygonCoordinates } from "@/cms/types/area";
import { describeGeometry } from "@/cms/utils/areaGeometry";

interface GeometryCellProps {
  coordinates?: PolygonCoordinates | null;
}

/**
 * Read-only geometry indicator for list rows. Polygons are authored in the
 * template forms; everywhere else only needs to answer "does this row have
 * geometry, and roughly how much".
 */
const GeometryCell: React.FC<GeometryCellProps> = ({ coordinates }) => {
  const { t } = useTranslation();
  const { hasGeometry, pointCount } = describeGeometry(coordinates);

  if (!hasGeometry) {
    return (
      <span className="text-xs text-gray-400 dark:text-gray-500">
        {t("crud.areaTemplate.geometry.none")}
      </span>
    );
  }

  return (
    <span className="text-xs text-gray-600 dark:text-gray-300">
      {t("crud.areaTemplate.geometry.summary").replace("_POINTS_", String(pointCount))}
    </span>
  );
};

export default GeometryCell;
