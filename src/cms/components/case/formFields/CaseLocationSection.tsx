import { lazy, Suspense, useCallback, useMemo } from "react";
import { COMMON_INPUT_CSS as commonInputCss } from "@/cms/components/case/constants/caseConstants";
import Loading from "@/core/components/common/Loading";
import { useToastContext } from "@/core/components/crud/ToastGlobal";
import { useTranslation } from "@/core/hooks/useTranslation";
import type { AddressResult, IncidentRadiusOverlay } from "@/cms/components/case/createCase/map/mapTypes";
import { CaseFieldSectionProps } from "./types";

// Heavy @arcgis/core SDK - lazy-loaded so it stays out of the initial bundle
// and only downloads when a case form with a map is actually opened.
// BoundaryMapField pulls in the map, so it has to be the lazy boundary too.
const BoundaryMapField = lazy(() => import("@/cms/components/case/createCase/map/BoundaryMapField"));

interface CaseLocationSectionProps extends CaseFieldSectionProps {
    /** Show the ArcGIS address picker above the free-text address. */
    showMap?: boolean;
    /**
     * No-match fallback circle around the incident pin. Passed by CaseFormFields
     * only when the incident coordinate matched no single Service Center polygon;
     * null otherwise (and always null when `showMap` is false). Purely a visual
     * decision aid - nothing about it is persisted with the case.
     */
    incidentRadius?: IncidentRadiusOverlay | null;
    className?: string;
}

/** Case address: optional map picker plus the free-text address it fills in. */
export const CaseLocationSection = ({
    caseState,
    onCaseChange,
    showMap = true,
    incidentRadius = null,
    className = "pr-0 col-span-2",
}: CaseLocationSectionProps) => {
    const { t } = useTranslation();
    const { addToast } = useToastContext();

    // Address chosen on the ArcGIS map (search or click) fills the location text
    // plus the lat/lon that the case payload previously always sent empty.
    const handleMapSelect = useCallback((result: AddressResult) => {
        onCaseChange({
            location: result.address || caseState?.location || "",
            caseLat: String(result.latitude),
            caseLon: String(result.longitude),
        });
    }, [onCaseChange, caseState?.location]);

    const handleMapError = useCallback(() => {
        addToast("error", t("case.display.geocode_failed"));
    }, [addToast, t]);

    const mapValue = useMemo(() => {
        const lat = parseFloat(caseState?.caseLat ?? "");
        const lon = parseFloat(caseState?.caseLon ?? "");
        if (Number.isFinite(lat) && Number.isFinite(lon)) {
            return { latitude: lat, longitude: lon };
        }
        return null;
    }, [caseState?.caseLat, caseState?.caseLon]);

    return (
        <div className={className}>
            <h3 className="text-gray-900 dark:text-gray-400 mx-3 my-2">{t("case.display.area")} :</h3>

            {showMap && (
                <div className="mx-3 my-3">
                    <Suspense fallback={<Loading />}>
                        <BoundaryMapField
                            value={mapValue}
                            onSelect={handleMapSelect}
                            onError={handleMapError}
                            address={caseState?.location}
                            readOnly={false}
                            height={320}
                            showPlaceButton
                            incidentRadius={incidentRadius}
                        />
                    </Suspense>
                </div>
            )}

            <div className="mx-3 my-2">
                <textarea
                    onChange={(e) => onCaseChange({ location: e.target.value })}
                    value={caseState?.location || ""}
                    placeholder={t("case.display.area_placeholder")}
                    className={`w-full h-20 p-2 ${commonInputCss}`}
                />
            </div>

            {showMap && mapValue && (
                <p className="mx-3 text-xs text-gray-500 dark:text-gray-400">
                    {t("case.display.location_coordinates")}: {caseState?.caseLat}, {caseState?.caseLon}
                </p>
            )}
        </div>
    );
};
