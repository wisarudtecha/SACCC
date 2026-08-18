import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FiChevronDown,
  FiChevronRight,
  FiFile,
  FiFolder,
  FiSearch,
} from "react-icons/fi";

import type { FileTreeNode } from "../../../files/dtos/files.dto";
import { useFileBlockData } from "../../../files/hook/useFilesData";

interface FileSidebarProps {
  currentPath: string;
  onSelect: (path: string) => void;
}

interface TreeNodeRowProps {
  node: FileTreeNode;
  depth: number;
  currentPath: string;
  onSelect: (path: string) => void;
}

const TreeNodeRow = ({
  node,
  depth,
  currentPath,
  onSelect,
}: TreeNodeRowProps) => {
  const [expanded, setExpanded] = useState(depth === 0);
  const hasChildren = node.children && node.children.length > 0;
  const isActive = currentPath === node.path;
  const isFolder = node.type === "folder";

  const handleClick = () => {
    if (isFolder) {
      if (hasChildren) setExpanded((prev) => !prev);
      onSelect(node.path);
    }
  };

  return (
    <li>
      <button
        type="button"
        onClick={handleClick}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
        className={[
          "flex w-full items-center gap-1.5 rounded-lg py-1.5 pr-2 text-left text-sm transition-colors",
          isActive
            ? "bg-sky-50 font-medium text-sky-600 dark:bg-sky-500/10 dark:text-sky-300"
            : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/[0.05]",
        ].join(" ")}
      >
        {/* Expand/collapse arrow */}
        <span className="w-4 shrink-0 text-slate-400 dark:text-slate-500">
          {isFolder && hasChildren ? (
            expanded ? (
              <FiChevronDown size={12} />
            ) : (
              <FiChevronRight size={12} />
            )
          ) : null}
        </span>

        {/* Icon */}
        <span className="shrink-0">
          {isFolder ? (
            <FiFolder
              size={14}
              className={
                isActive ? "text-sky-500" : "text-amber-400 dark:text-amber-300"
              }
            />
          ) : (
            <FiFile size={13} className="text-slate-400 dark:text-slate-500" />
          )}
        </span>

        <span className="min-w-0 truncate">{node.name}</span>
      </button>

      {expanded && hasChildren && (
        <ul className="mt-0.5">
          {node.children!.map((child) => (
            <TreeNodeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              currentPath={currentPath}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

const FileSidebar = ({ currentPath, onSelect }: FileSidebarProps) => {
  const { t } = useTranslation("files");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useFileBlockData("tree");
  const treeNodes = (data?.data ?? []) as FileTreeNode[];

  const filterNode = (node: FileTreeNode, q: string): FileTreeNode | null => {
    if (!q) return node;
    const matchSelf = node.name.toLowerCase().includes(q);
    const filteredChildren = node.children
      ?.map((c) => filterNode(c, q))
      .filter(Boolean) as FileTreeNode[] | undefined;

    if (matchSelf || (filteredChildren && filteredChildren.length > 0)) {
      return { ...node, children: filteredChildren };
    }
    return null;
  };

  const filteredTree = search.trim()
    ? (treeNodes
        .map((n) => filterNode(n, search.toLowerCase()))
        .filter(Boolean) as FileTreeNode[])
    : treeNodes;

  return (
    <aside className="flex h-full flex-col p-4 sm:p-5">
      <h2 className="mb-3 text-sm font-semibold text-slate-800 dark:text-white">
        {t("tree.title")}
      </h2>

      {/* Search */}
      <div className="relative mb-3">
        <FiSearch
          size={12}
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("labels.noResults")}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-7 pr-2 text-xs text-slate-700 outline-none transition focus:border-sky-400 focus:ring-1 focus:ring-sky-400/20 dark:border-white/[0.08] dark:bg-slate-900 dark:text-slate-200 dark:focus:border-sky-500"
        />
      </div>

      {/* Tree */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-6 animate-pulse rounded-lg bg-slate-100 dark:bg-white/[0.05]"
              style={{ width: `${70 + i * 8}%` }}
            />
          ))}
        </div>
      ) : (
        <ul className="space-y-0.5">
          {/* "All" root node */}
          <li>
            <button
              type="button"
              onClick={() => onSelect("")}
              className={[
                "flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm transition-colors",
                currentPath === ""
                  ? "bg-sky-50 font-medium text-sky-600 dark:bg-sky-500/10 dark:text-sky-300"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/[0.05]",
              ].join(" ")}
            >
              <FiFolder
                size={14}
                className={
                  currentPath === ""
                    ? "text-sky-500"
                    : "text-amber-400 dark:text-amber-300"
                }
              />
              <span>{t("sections.recent.title")}</span>
            </button>
          </li>

          {filteredTree.map((node) => (
            <TreeNodeRow
              key={node.id}
              node={node}
              depth={0}
              currentPath={currentPath}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </aside>
  );
};

export default FileSidebar;
