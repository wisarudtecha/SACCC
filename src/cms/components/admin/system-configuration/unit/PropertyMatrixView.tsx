// src/cms/components/admin/system-configuration/unit/PropertyMatrixView.tsx
import React, { useEffect, useState } from "react";
import { CheckLineIcon, LockIcon } from "@/core/icons";
import { useSyncPreviewedIdentity } from "@/core/hooks/useSyncPreviewedIdentity";
import { useTranslation } from "@/core/hooks/useTranslation";
import type { Property, UnitProperty } from "@/cms/types/unit";
import Badge from "@/core/components/ui/badge/Badge";
import Button from "@/core/components/ui/button/Button";

/**
 * Display name for a unit-property JOIN row (GetMdmUnitPropById).
 * The name is nested under propMetaData - these rows carry no top-level en/th, and the
 * block can be absent entirely - so fall back through the other language and finally the
 * raw propId rather than rendering "undefined".
 */
const resolveUnitPropertyName = (item: UnitProperty, language: string): string => {
  const meta = item.propMetaData;
  if (language === "th") {
    return meta?.th || meta?.en || item.propId;
  }
  return meta?.en || meta?.th || item.propId;
};

/** Display name for a master property record (GetListMdmProperty), which does carry en/th. */
const resolvePropertyName = (item: Property, language: string): string => {
  if (language === "th") {
    return item.th || item.en || item.propId;
  }
  return item.en || item.th || item.propId;
};

// Height budget for the scrollable matrix body: a share of the viewport, less the modal
// chrome, the tab bar and the assigned-properties summary stacked above it.
const MATRIX_VIEWPORT_RATIO = 0.7;
const MATRIX_CHROME_HEIGHT = 300;

const calcMatrixMaxHeight = (): number =>
  (window.innerHeight * MATRIX_VIEWPORT_RATIO) - MATRIX_CHROME_HEIGHT;

const PropertyMatrixContent: React.FC<{
  assigned: UnitProperty[];
  canEdit: boolean;
  isFetching: boolean;
  loading: boolean;
  properties: Property[];
  propertyList: string[];
  trackedUnitId: string;
  unitId: string;
  handleUnitPropertiesSave: () => void;
  onUnitChange: (unitId: string) => void;
  onUnitPropertiesToggle: (propId: string) => void;
}> = ({
  assigned,
  canEdit,
  isFetching,
  loading,
  properties,
  propertyList,
  trackedUnitId,
  unitId,
  handleUnitPropertiesSave,
  onUnitChange,
  onUnitPropertiesToggle,
}) => {
  const { language, t } = useTranslation();

  // The parent (UnitManagement) owns the query, the selection state and the save handler,
  // mirroring how UserManagement drives SkillsMatrixView. PreviewDialog remounts this
  // component on every tab switch, so the comparison baseline (trackedUnitId) has to live
  // in the parent - a bare remount with the same unit is then correctly a no-op.
  useSyncPreviewedIdentity(unitId, trackedUnitId, onUnitChange);

  // Seeded lazily rather than from 0: an initial 0 paints the body collapsed for one frame
  // before the effect below corrects it, which reads as a flicker.
  const [maxHeight, setMaxHeight] = useState<number>(calcMatrixMaxHeight);

  useEffect(() => {
    const updateHeight = () => setMaxHeight(calcMatrixMaxHeight());
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  // While the shared query is still switching units, propertyList has been cleared but the
  // parent still points at the PREVIOUS unit - saving here would wipe that unit assignments.
  // Block both editing and saving until the seeded selection is trustworthy again.
  const isBusy = loading || isFetching;
  const canToggle = canEdit && !isBusy;
  const isSaveDisabled = isBusy || !canEdit || !unitId;

  return (
    <div className="space-y-4">
      {/* Currently assigned - read straight off the server, so it reflects the last save */}
      <div className="grid grid-cols-1 gap-2">
        <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
          {t("crud.unit.list.property.update.assigned")}:
        </label>
        <div className="text-sm">
          {isFetching && (
            <span className="text-gray-500 dark:text-gray-400">
              {t("crud.common.loading_records")}
            </span>
          )}
          {!isFetching && assigned.length === 0 && (
            <span className="text-gray-500 dark:text-gray-400">
              {t("crud.common.empty_table")}
            </span>
          )}
          {!isFetching && assigned.map(item => (
            <Badge key={item.propId} className="mr-2">
              {resolveUnitPropertyName(item, language)}
            </Badge>
          ))}
        </div>
      </div>

      {/* Assignment matrix */}
      <div className="bg-white dark:bg-gray-800 border border-b-0 border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight }}>
          <table className="min-w-full border-collapse">
            <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 cursor-default">
              <tr className="bg-gray-100 dark:bg-gray-800 z-100">
                <th
                  className="px-6 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300 tracking-wider sticky left-0 bg-gray-100 dark:bg-gray-800 z-100"
                  colSpan={2}
                >
                  {t("crud.unit.list.property.update.title")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {properties.filter(p => p.active === true).map(property => {
                const hasProperty = propertyList.includes(property.propId);
                return (
                  <tr
                    key={property.propId}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300"
                  >
                    <td className="px-6 py-4 sticky left-0 z-100">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-100 capitalize indent-6">
                          {resolvePropertyName(property, language)}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => onUnitPropertiesToggle(property.propId)}
                          disabled={!canToggle}
                          className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors
                            ${
                              hasProperty
                                ? "bg-green-500 border-green-500 text-white"
                                : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                            } ${!canToggle ? "opacity-50 cursor-not-allowed" : "hover:border-green-400 cursor-pointer"}`}
                        >
                          {hasProperty && <CheckLineIcon className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {properties.length === 0 && (
          <div className="text-center py-12">
            <LockIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {t("crud.common.zero_records")}
            </h3>
          </div>
        )}

        <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div className="flex items-center justify-center">
            <Button
              variant="success"
              size="sm"
              onClick={() => !isSaveDisabled && handleUnitPropertiesSave()}
              disabled={isSaveDisabled}
              className={isSaveDisabled ? "opacity-50 cursor-not-allowed" : ""}
            >
              {loading
                ? t("crud.unit.list.property.update.button.saving")
                : t("crud.unit.list.property.update.button.save")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyMatrixContent;
