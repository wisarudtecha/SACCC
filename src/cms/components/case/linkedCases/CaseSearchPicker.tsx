import React, { useState } from "react";
import { Pagination } from "@/core/components/crud/Pagination";
import Loading from "@/core/components/common/Loading";
import Input from "@/core/components/form/input/InputField";
import Button from "@/core/components/ui/button/Button";
import Badge from "@/core/components/ui/badge/Badge";
import { CloseIcon } from "@/core/icons";
import { useTranslation } from "@/core/hooks/useTranslation";
import { Case, useGetListCaseQuery } from "@/cms/store/api/caseApi";
import { getPriorityColorClass } from "@/cms/components/function/Prioriy";
import { statusIdToStatusTitle } from "@/cms/components/ui/status/status";
import { filterLinkableCases } from "./linkedCaseUtils";

interface CaseSearchPickerProps {
    /** Called with the case the agent chose to link. */
    onSelect: (caseItem: Case) => void;
    /** Ids never offered for linking: the current case, its existing children, its parent. */
    excludeIds: string[];
}

/**
 * Search the case directory and pick one to link.
 *
 * Mirrors CustomerSearchPicker: selection only — what happens to the chosen
 * case (PATCHing its referCaseId) is entirely the caller's business.
 */
export const CaseSearchPicker: React.FC<CaseSearchPickerProps> = ({ onSelect, excludeIds }) => {
    const { t } = useTranslation();

    const [searchInput, setSearchInput] = useState<string>("");
    const [appliedSearch, setAppliedSearch] = useState<string>("");
    const [page, setPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);

    const offset = (page - 1) * pageSize;

    const {
        data: caseData,
        isLoading,
        isFetching,
        error
    } = useGetListCaseQuery({
        start: offset,
        length: pageSize,
        detail: appliedSearch || undefined
    }, {
        refetchOnMountOrArgChange: true
    });

    const linkableCases = filterLinkableCases(caseData?.data ?? [], excludeIds);

    const handleSearch = () => {
        setAppliedSearch(searchInput);
        setPage(1);
    };

    const clearSearch = () => {
        setSearchInput("");
        setAppliedSearch("");
        setPage(1);
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === "Enter") {
            handleSearch();
        }
    };

    const startEntry = offset + 1;
    const totalCount = caseData?.totalRecords || 0;
    const totalPages = caseData?.totalPage || 1;
    const endEntry = Math.min(offset + pageSize, totalCount);

    return (
        <div className="bg-white px-0 py-0 dark:border-gray-800 dark:bg-white/3">
            <div className="mx-auto w-full">
                <div className="flex flex-col justify-between">
                    <div className="mb-4">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1 w-full">
                            <Input
                                type="text"
                                className="w-full sm:w-64"
                                placeholder={`${t("case.panel.link_case_search_placeholder")}...`}
                                value={searchInput}
                                onChange={e => setSearchInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />

                            <Button
                                className="h-11"
                                variant="dark"
                                onClick={handleSearch}
                            >
                                {t("common.search")}
                            </Button>

                            {appliedSearch && (
                                <Button
                                    className="h-11"
                                    onClick={clearSearch}
                                >
                                    <CloseIcon className="w-4 h-4 mr-2" />
                                    {t("common.clear_filters")}
                                </Button>
                            )}
                        </div>
                    </div>

                    {isFetching || isLoading ? (
                        <Loading />
                    ) : error || linkableCases.length === 0 ? (
                        <div className="text-center py-6">
                            <p className="text-gray-500 text-lg">{t("common.no_result")}</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {linkableCases.map((caseItem) => (
                                <div
                                    key={caseItem.caseId}
                                    onClick={() => onSelect(caseItem)}
                                    className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 hover:bg-gray-200 dark:hover:bg-gray-750 transition-colors cursor-pointer group"
                                >
                                    <div className="flex items-center space-x-2 mb-1">
                                        <div className={`w-2 h-2 ${getPriorityColorClass(caseItem.priority)} rounded-full shrink-0`}></div>
                                        <span className="text-xs text-gray-600 dark:text-gray-500 font-mono">#{caseItem.caseId}</span>
                                        <span className="text-xs text-gray-600 dark:text-gray-500">
                                            {caseItem.createdDate ? new Date(caseItem.createdDate).toLocaleDateString() : ""}
                                        </span>
                                    </div>
                                    <h4 className="text-sm font-medium text-gray-900 dark:text-white leading-tight mb-1 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                                        {caseItem.caseDetail || "No details available"}
                                    </h4>
                                    <Badge>
                                        {statusIdToStatusTitle(caseItem.statusId)}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="my-0">
                        <Pagination
                            endEntry={endEntry}
                            pagination={{
                                page,
                                pageSize,
                                total: totalCount
                            }}
                            startEntry={startEntry}
                            totalPages={totalPages}
                            onPageChange={newPage => setPage(newPage)}
                            onPageSizeChange={newPageSize => {
                                setPage(1);
                                setPageSize(Number(newPageSize));
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CaseSearchPicker;
