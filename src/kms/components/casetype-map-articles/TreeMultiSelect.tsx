import React, { useState, useRef, useEffect, useMemo } from 'react';
import { TreeMultiSelectProps, TreeNode as TreeNodeType } from './TreeMultiSelect.types';
import { TreeNode } from './TreeNode';
import {
  getAllLeafBreadcrumbs,
  getAllParentIds,
  filterTree,
  toggleNodeSelection,
} from './tree-utils';
import { useTranslation } from "@/core/hooks/useTranslation";
export const TreeMultiSelect: React.FC<TreeMultiSelectProps> = ({
  data,
  value,
  defaultValue = [],
  onChange,
  // placeholder = 'เลือกรายการ...',
  searchable = true,
  disabled = false,
  className = '',
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // Manage internal state if uncontrolled
  const isControlled = value !== undefined;
  const [internalSelected, setInternalSelected] = useState<string[]>(defaultValue);
  const currentSelectedList = isControlled ? value : internalSelected;
  const selectedLeafIds = useMemo(() => new Set(currentSelectedList), [currentSelectedList]);

  // Expanded nodes state
  const allParentIds = useMemo(() => getAllParentIds((data ?? [])), [data]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(allParentIds));

  // Breadcrumb lookup cache
  const leafBreadcrumbs = useMemo(() => getAllLeafBreadcrumbs((data ?? [])), [data]);

  // Temporary selection buffer when dropdown is open
  const [draftSelectedIds, setDraftSelectedIds] = useState<Set<string>>(selectedLeafIds);



  // Sync draft selection when dropdown opens or value changes
  useEffect(() => {
    if (isOpen) {
      setDraftSelectedIds(new Set(selectedLeafIds));
    }
  }, [isOpen/*, selectedLeafIds*/]);


  /*****************new **************** */
  useEffect(() => {
    const ids = Array.from(draftSelectedIds);
    if (!isControlled) {
      setInternalSelected(ids);
    }

    onChange?.(ids);
  }, [draftSelectedIds, isControlled, onChange]);


  /***************************************** */


  // Filter tree data by searchKeyword
  const { filteredData, autoExpandedIds } = useMemo(() => {
    if (!searchKeyword.trim()) {
      return { filteredData: data, autoExpandedIds: new Set<string>() };
    }
    const { filtered, expandedNodeIds } = filterTree((data ?? []), searchKeyword);
    return { filteredData: filtered, autoExpandedIds: expandedNodeIds };
  }, [data, searchKeyword]);

  // Expand matching nodes on search
  useEffect(() => {
    if (searchKeyword.trim()) {
      setExpandedIds((prev) => {
        const next = new Set(prev);
        autoExpandedIds.forEach((id) => next.add(id));
        return next;
      });
    }
  }, [searchKeyword, autoExpandedIds]);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, searchable]);

  // Handlers
  const handleToggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleSelectDraft = (node: TreeNodeType) => {
    const next = toggleNodeSelection(node, draftSelectedIds);
    setDraftSelectedIds(next);
    // setTimeout(()=>{handleApply();},5000)

  };

  const handleApply = () => {
    const ids = Array.from(draftSelectedIds);
    if (!isControlled) {
      setInternalSelected(ids);
    }
    onChange?.(ids);
    //setIsOpen(false);
  };

  const handleCancel = () => {
    setDraftSelectedIds(new Set(selectedLeafIds));
    setIsOpen(false);
  };

  const handleRemoveTag = (e: React.MouseEvent, id: string) => {

    e.stopPropagation();
    if (disabled) return;
    const next = new Set(selectedLeafIds);
    next.delete(id);
    const ids = Array.from(next);
    if (!isControlled) {
      setInternalSelected(ids);
    }
    setDraftSelectedIds(new Set(ids));
    onChange?.(ids);
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    if (!isControlled) {
      setInternalSelected([]);
    }
    setDraftSelectedIds(new Set([]));
    onChange?.([]);
  };

  // Selected tag items to render
  const selectedList = useMemo(() => Array.from(selectedLeafIds), [selectedLeafIds]);
  const visibleTags = selectedList;

  return (
    <div ref={containerRef} className={`relative w-full text-left font-sans  ${className}`}>
      {/* Trigger Button / Display Box */}
      <div
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        // className={`min-h-[42px] w-full px-3 py-1.5 border rounded-lg bg-white flex items-center justify-between gap-2 cursor-pointer transition-all duration-200 shadow-sm  dark:border-gray-700 dark:bg-gray-900 dark:placeholder:text-white/30 dark:focus:border-brand-800 dark:text-gray-400 ${disabled
        //   ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-60'
        //   : isOpen
        //     ? 'border-blue-500 ring-2 ring-blue-100'
        //     : 'border-gray-300 hover:border-gray-400'
        //   }`}

        className="min-h-11 w-full appearance-none rounded-lg border px-4 py-2.5 pr-6 text-sm shadow-theme-xs flex items-center justify-between focus:outline-hidden focus:ring-3 cursor-pointer border-gray-300 bg-transparent placeholder:text-gray-400 focus:border-brand-300 focus:ring-brand-500/10 text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:placeholder:text-white/30 dark:focus:border-brand-800 dark:text-gray-400"
      >
        {/* Tags Container */}
        <div className="flex flex-wrap items-center gap-1 flex-1 max-w-full overflow-hidden">
          {selectedList.length === 0 ? (
            <span className="text-gray-400 text-sm select-none">{t("knowledge.service-mapping-article.article-placeholder")}</span>
          ) : (
            <>
              {visibleTags.map((id) => {
                const info = leafBreadcrumbs.get(id);
                const tagLabel = info ? info.path : id;
                return (
                  <span
                    key={id}
                    // className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium max-w-[240px] truncate"
                    className="bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 px-2 py-0.5 rounded text-xs"
                    title={tagLabel}
                  >
                    <span className="truncate">{tagLabel}</span>
                    {!disabled && (
                      <button
                        type="button"
                        onClick={(e) => handleRemoveTag(e, id)}
                        className="text-blue-500 hover:text-blue-800 hover:bg-blue-100 rounded p-0.5 transition-colors focus:outline-none"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </span>
                );
              })}
            </>
          )}
        </div>

        {/* Right Action Icons (Clear All + Caret) */}
        <div className="flex items-center gap-1.5 text-gray-400 shrink-0">
          {selectedList.length > 0 && !disabled && (
            <button
              type="button"
              onClick={handleClearAll}
              className="p-1 hover:text-gray-600 rounded-full hover:bg-gray-100 focus:outline-none"
              title="Clear all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          <svg
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-500' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Dropdown Panel */}
      {isOpen && (
        // <div className="absolute z-50 mt-1.5 w-full min-w-[300px] bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100 dark:border-gray-700 dark:bg-gray-900 dark:placeholder:text-white/30 dark:focus:border-brand-800 dark:text-gray-400">
        <div className=" absolute max-h-60 z-99999 mt-1 w-full overflow-y-auto rounded border bg-white dark:bg-gray-900 shadow-lg">

          {/* Search Header */}
          {searchable && (
            // <div className="p-2.5 border-b border-gray-100 bg-gray-50/50">

            <div className="relative flexx items-centerx">
              {/* <svg
                  className="w-4 h-4 absolute left-3 text-gray-400 pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg> */}
              <input
                ref={searchInputRef}
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder={t("knowledge.service-mapping-article.article-search")}
                //className="w-full pl-9 pr-8 py-1.5 text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 transition"
                className="h-11 w-full   border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3  dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30  bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90  dark:focus:border-brand-800"
              />
              {searchKeyword && (
                <button
                  type="button"
                  onClick={() => setSearchKeyword('')}
                  className="absolute right-2.5 text-gray-400 hover:text-gray-600 p-0.5 rounded"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

          )}

          {/* Tree Node List (Scrollable) */}
          <div className="max-h-64 overflow-y-auto p-2 divide-y divide-transparent">
            {(filteredData ?? []).length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400 select-none">
                {t("knowledge.service-mapping-article.article-not-found")}
              </div>
            ) : (
              (filteredData ?? []).map((node) => (
                <TreeNode
                  key={node.id}
                  node={node}
                  level={0}
                  selectedLeafIds={draftSelectedIds}
                  expandedIds={expandedIds}
                  onToggleExpand={handleToggleExpand}
                  onToggleSelect={handleToggleSelectDraft}
                  disabled={disabled}
                  onApply={handleApply}
                />
              ))
            )}
          </div>

          {/* Footer Bar */}
          <div className="px-3 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs dark:border-gray-700 dark:bg-gray-900 dark:placeholder:text-white/30 dark:focus:border-brand-800 dark:text-gray-400">
            <span className="text-gray-600 font-medium">
              {t("knowledge.service-mapping-article.article-select")} <strong className="text-blue-600 font-semibold">{draftSelectedIds.size}</strong> {t("knowledge.service-mapping-article.article-item")}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancel}
                //className="px-3 py-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 font-medium transition focus:outline-none"
                className="inline-flex items-center justify-center gap-2 rounded-lg transition  px-3 py-2.5 text-xs shadow-theme-xs bg-warning-500 text-white dark:text-white hover:bg-warning-600 disabled:bg-warning-300  "
              >
                {t("knowledge.service-mapping-article.article-cancel")}
              </button>
              {/* <button
                type="button"
                onClick={handleApply}
                className="px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 font-medium shadow-sm transition focus:outline-none"
              >
                Apply
              </button> */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
