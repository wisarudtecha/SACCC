import React, { useRef, useEffect } from 'react';
import { TreeNode as TreeNodeType } from './TreeMultiSelect.types';
import { getNodeCheckboxState, isLeafNode } from './tree-utils';

interface TreeNodeProps {
  node: TreeNodeType;
  level: number;
  selectedLeafIds: Set<string>;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onToggleSelect: (node: TreeNodeType) => void;
  onApply:()=>void;
  disabled?: boolean;
}

export const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  level,
  selectedLeafIds,
  expandedIds,
  onToggleExpand,
  onToggleSelect,
  onApply,
  disabled = false,
}) => {
  const checkboxRef = useRef<HTMLInputElement>(null);
  const isLeaf = isLeafNode(node);
  const isExpanded = expandedIds.has(node.id);
  const state = getNodeCheckboxState(node, selectedLeafIds);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = state === 'indeterminate';
    }
  }, [state]);

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (!disabled) {
      onToggleSelect(node);
    }
  };

  const handleRowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled) {
          onToggleSelect(node);
         // setTimeout(()=>{onApply();},5000)
         // onApply();
      // if (isLeaf) {
      //   onToggleSelect(node);
      // } else {
      //   onToggleExpand(node.id);
      // }
    }
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleExpand(node.id);
  };

  return (
    <div className="select-none text-sm">
      <div
         onClick={handleRowClick}
        style={{ paddingLeft: `${level * 18 + 8}px` }}
        className={`flex items-center gap-2 py-1.5 pr-3 rounded cursor-pointer transition-colors px-3 py-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white ${
          disabled
            ? 'opacity-50 cursor-not-allowed text-gray-400'
            : 'hover:bg-blue-50 text-gray-700 hover:text-blue-600'
        }`}
      >
        {/* Expand / Collapse Icon or Leaf placeholder */}
        {!isLeaf ? (
          <button
            type="button"
            onClick={handleExpandClick}
            className="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-600 focus:outline-none transition-transform duration-150"
            disabled={disabled}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            
            <svg
              className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : (
          <span className="w-4 h-4 inline-block" />
        )}

        {/* Custom styled checkbox */}
        <div className="relative flex items-center justify-center">
          <input
            ref={checkboxRef}
            type="checkbox"
            checked={state === 'checked'}
            onChange={handleCheckboxChange}
            disabled={disabled}
            className={`w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 transition duration-150 cursor-pointer ${
              disabled ? 'cursor-not-allowed' : ''
            }`}
          />
        </div>

        {/* Node Label */}
        <span
          className={`flex-1 truncate ${
            state === 'checked' ? 'font-medium text-blue-700' : ''
          }`}

          // className={`flex-1 truncate px-3 py-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white
          //       true ${
          //   state === 'checked' ? 'font-medium text-blue-700' : ''
          // }`}
                
              
        >
          {node.label}
        </span>
      </div>

      {/* Children list */}
      {!isLeaf && isExpanded && node.children && (
        <div className="flex flex-col">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              selectedLeafIds={selectedLeafIds}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              onToggleSelect={onToggleSelect}
              disabled={disabled}
              onApply={onApply}
            />
          ))}
        </div>
      )}
    </div>
  );
};
