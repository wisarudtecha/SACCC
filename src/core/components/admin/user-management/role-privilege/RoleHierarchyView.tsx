// /src/components/admin/user-management/role-privilege/RoleHierarchyView.tsx
import React, { useState } from "react";
import {
  ArrowRightIcon,
  ChevronDownIcon,
  // LockIcon
} from "@/core/icons";
import type { RoleHierarchy } from "@/core/types/role";
// import roles from "@/mocks/roles.json";

const RoleHierarchyContent: React.FC<{ hierarchy: RoleHierarchy[] }> = ({ hierarchy }) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const toggleNode = (roleId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(roleId)) {
      newExpanded.delete(roleId);
    }
    else {
      newExpanded.add(roleId);
    }
    setExpandedNodes(newExpanded);
  };

  const renderNode = (node: RoleHierarchy, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.role.id);
    const hasChildren = node.children.length > 0;

    return (
      <div key={node.role.id}>
        <div 
          className={`flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg ${
            level > 0 ? 'ml-' + (level * 6) : ''
          }`}
        >
          <div className="flex items-center flex-1">
            {hasChildren && (
              <button
                onClick={() => toggleNode(node.role.id)}
                className="mr-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
              >
                {isExpanded ? (
                  <ChevronDownIcon className="w-4 h-4" />
                ) : (
                  <ArrowRightIcon className="w-4 h-4" />
                )}
              </button>
            )}
            {/*
            <div className={`p-2 rounded-lg ${node.role.color} mr-3`}>
              <LockIcon className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center">
                <span className="font-medium text-gray-900 dark:text-white">
                  {node.role.name}
                </span>
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                  Level {node.role.level}
                </span>
                {node.role.isSystem && (
                  <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                    System
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{node.role.description}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-900 dark:text-white">{node.role.userCount} users</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {node.inheritedPermissions.length} permissions
              </div>
            </div>
            */}
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div>
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Role Hierarchy</h3>
        <button
          // onClick={() => setExpandedNodes(new Set(roles.map(r => r.id)))}
          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Expand All
        </button>
      </div>
      <div className="space-y-2">
        {hierarchy.map(node => renderNode(node))}
      </div>
    </div>
  );
};

export default RoleHierarchyContent;
