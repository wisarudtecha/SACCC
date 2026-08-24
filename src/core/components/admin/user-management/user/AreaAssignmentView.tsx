// /src/components/admin/user-management/user/AreaAssignmentView.tsx
import React, { useState } from "react";
import { ChevronDown, ChevronRight, Minus } from "lucide-react";
import { CheckLineIcon, LockIcon } from "@/core/icons";
import { useSyncPreviewedIdentity } from "@/core/hooks/useSyncPreviewedIdentity";
import { useTranslation } from "@/core/hooks/useTranslation";
import type { AreaCountryTree } from "@/cms/types/area";
import Button from "@/core/components/ui/button/Button";

type CheckState = "checked" | "indeterminate" | "unchecked";

const getCheckState = (total: number, selected: number): CheckState => {
  if (total === 0 || selected === 0) {
    return "unchecked";
  }
  return selected === total ? "checked" : "indeterminate";
};

const AreaCheckbox: React.FC<{
  state: CheckState;
  disabled: boolean;
  onClick: () => void;
}> = ({ state, disabled, onClick }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors shrink-0
      ${
        state !== "unchecked"
          ? "bg-green-500 border-green-500 text-white"
          : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-green-400 cursor-pointer"}`}
  >
    {state === "checked" && <CheckLineIcon className="w-4 h-4" />}
    {state === "indeterminate" && <Minus className="w-4 h-4" />}
  </button>
);

const AreaAssignmentContent: React.FC<{
  loading: boolean;
  /** The org's nested country trees - parentage comes from the structure itself. */
  trees: AreaCountryTree[];
  areaList: string[];
  userName: string;
  trackedUsername: string;
  onAreaToggle: (distId: string) => void;
  /**
   * `countryId` scopes a province cascade to one country. Province codes are not
   * globally unique - two countries can both have province "10" - so without it
   * selecting one province would tick the other country's districts too.
   */
  onAreaCascadeToggle: (scopeType: "country" | "province", scopeId: string, countryId?: string) => void;
  onUserAreaSave: () => void;
  onUserChange: (userName: string) => void;
}> = ({
  loading,
  trees,
  areaList,
  userName,
  trackedUsername,
  onAreaToggle,
  onAreaCascadeToggle,
  onUserAreaSave,
  onUserChange,
}) => {
  const { language, t } = useTranslation();

  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set());
  const [expandedProvinces, setExpandedProvinces] = useState<Set<string>>(new Set());

  // The preview modal supports navigating between users while open, and this component
  // remounts on every tab switch — trackedUsername (parent-persisted) survives that remount,
  // so a bare remount with the same user is correctly a no-op.
  useSyncPreviewedIdentity(userName, trackedUsername, onUserChange);

  const toggleExpanded = (set: Set<string>, setter: (next: Set<string>) => void, id: string) => {
    const next = new Set(set);
    if (next.has(id)) {
      next.delete(id);
    }
    else {
      next.add(id);
    }
    setter(next);
  };

  // Children come straight off the tree node. The previous version re-joined
  // three flat lists by provId/countryId, which mis-grouped districts whenever
  // two countries shared a province code - walking the tree makes that
  // unrepresentable.
  const districtsOfCountry = (country: AreaCountryTree) =>
    (country.provinces || []).flatMap(province => province.districts || []);

  // Province and district codes are only unique within their country, so both the
  // expansion set and the React keys are namespaced. Bare codes made two
  // countries' identically-coded provinces expand and collapse as one.
  const scopedKey = (countryId: string, code: string) => `${countryId}:${code}`;

  const isDisabled = !userName;

  return (
    <div className="bg-white dark:bg-gray-800 border border-b-0 border-gray-200 dark:border-gray-700">
      <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 cursor-default">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-300 tracking-wider">
          {t("crud.user.list.area.update.title")}
        </span>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {trees.map(country => {
          const countryDistricts = districtsOfCountry(country);
          const countrySelected = countryDistricts.filter(d => areaList.includes(d.distId)).length;
          const countryState = getCheckState(countryDistricts.length, countrySelected);
          const isCountryExpanded = expandedCountries.has(country.countryId);
          const countryProvinces = country.provinces || [];

          return (
            <div key={country.countryId}>
              <div className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <button
                  onClick={() => toggleExpanded(expandedCountries, setExpandedCountries, country.countryId)}
                  className="p-1 rounded text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 shrink-0"
                >
                  {isCountryExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                <AreaCheckbox
                  state={countryState}
                  disabled={isDisabled}
                  onClick={() => onAreaCascadeToggle("country", country.countryId)}
                />
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 capitalize">
                  {language === "th" && country.th || country.en}
                </span>
              </div>

              {isCountryExpanded && (
                <div className="pl-10 bg-gray-50 dark:bg-gray-800/50">
                  {countryProvinces.map(province => {
                    const provinceDistricts = province.districts || [];
                    const provinceSelected = provinceDistricts.filter(d => areaList.includes(d.distId)).length;
                    const provinceState = getCheckState(provinceDistricts.length, provinceSelected);
                    const provinceKey = scopedKey(country.countryId, province.provId);
                    const isProvinceExpanded = expandedProvinces.has(provinceKey);

                    return (
                      <div key={provinceKey} className="border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3 px-6 py-2 hover:bg-gray-100 dark:hover:bg-gray-700/50">
                          <button
                            onClick={() => toggleExpanded(expandedProvinces, setExpandedProvinces, provinceKey)}
                            className="p-1 rounded text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 shrink-0"
                          >
                            {isProvinceExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                          <AreaCheckbox
                            state={provinceState}
                            disabled={isDisabled}
                            onClick={() => onAreaCascadeToggle("province", province.provId, country.countryId)}
                          />
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-100 capitalize">
                            {language === "th" && province.th || province.en}
                          </span>
                        </div>

                        {isProvinceExpanded && (
                          <div className="pl-10 bg-gray-100 dark:bg-gray-700/30">
                            {provinceDistricts.map(district => {
                              const districtState: CheckState = areaList.includes(district.distId)
                                ? "checked"
                                : "unchecked";

                              return (
                                <div
                                  key={scopedKey(provinceKey, district.distId)}
                                  className="flex items-center gap-3 px-6 py-2 border-t border-gray-200 dark:border-gray-700 hover:bg-gray-200/50 dark:hover:bg-gray-600/30"
                                >
                                  <span className="w-6 shrink-0" />
                                  <AreaCheckbox
                                    state={districtState}
                                    disabled={isDisabled}
                                    onClick={() => onAreaToggle(district.distId)}
                                  />
                                  <span className="text-sm text-gray-700 dark:text-gray-200 capitalize">
                                    {language === "th" && district.th || district.en}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {trees.length === 0 && (
        <div className="text-center py-12">
          <LockIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {t("crud.common.zero_records")}
          </h3>
        </div>
      )}

      <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <Button
              variant="success"
              size="sm"
              onClick={() => !loading && onUserAreaSave()}
              disabled={loading || !userName}
              className={loading || !userName ? "opacity-50 cursor-not-allowed" : ""}
            >
              {loading ? t("crud.user.list.area.update.button.saving") : t("crud.user.list.area.update.button.save")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AreaAssignmentContent;
