// src/cms/types/workflow.ts
import { FormManager } from "@/cms/components/interface/FormField";
import type { UserGroup, UserProfile } from "@/core/types/user";
import type { BaseEntity, WorkflowStep, WorkflowTrigger, WorkflowVariable } from "@/cms/types";
import type { CaseStatus } from "@/cms/types/case";
import type { RequestStatus } from "@/cms/types/inventoryRequest";
// import { string } from "zod";

export type ConnectionType = {
  id: string;
  source: string;
  target: string;
  label?: string;
};

export type DecisionSelection = Record<string, "yes" | "no">;

export type NodeType =
  | "start"
  | "process"
  | "dispatch"
  | "decision"
  | "sla"
  | "end";

export type Position = {
  x: number;
  y: number;
}

export type Status =
  | "draft"
  | "active"
  | "inactive"
  | "testing";

export type WorkflowConnection = {
  id: string;
  source: string;
  target: string;
  label?: "yes" | "no";
};

export type WorkflowMetadata = {
  title: string;
  description?: string;
  status?: string;
  totalSla?: number;
  wfType?: string;
};

export type WorkflowNode = {
  id: string;
  type: NodeType;
  position: Position;
  data: {
    label: string;
    description?: string;
    config?: Record<string, unknown>;
  };
}

export interface BaseNode {
  id: string;
  type: NodeType;
  position: Position;
  data: {
    label: string;
    description?: string;
    config?: Record<string, unknown>;
  };
};

export interface Connection {
  id: string;
  source: string;
  target: string;
  label?: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface Workflow extends BaseEntity {
  orgId: string;
  wfId: string;
  title: string;
  desc: string;
  active: boolean;
  publish: boolean;
  locks: boolean;
  versions: string;
}

export interface WorkflowAnalytics {
  totalWorkflows: number;
  activeWorkflows: number;
  publishedWorkflows: number;
  draftWorkflows: number;
  lockedWorkflows: number;
}

export interface WorkflowCreateData {
  name: string;
  description: string;
  category: string;
  steps: WorkflowStep[];
  triggers: WorkflowTrigger[];
  variables?: WorkflowVariable[];
  tags?: string[];
}

export interface WorkflowData {
  nodes: BaseNode[]; 
  connections: Connection[];
  metadata: {
    title: string;
    description: string;
    status: Status;
    totalSla?: number;
    createdAt?: string;
    updatedAt?: string;
    wfType?: string;
  };
}

export interface WorkflowEditorComponentProps {
  caseStatuses?: CaseStatus[];
  forms?: FormManager[];
  requestStatuses?: RequestStatus[];
  userGroup?: UserGroup[];
  users?: UserProfile[];
  workflowAction?: string;
  workflowData?: WorkflowData;
  workflowId?: string;
  initialData?: WorkflowData;
  onSave?: (data: WorkflowData) => void;
}

export interface WorkflowPagination {
  currentPage: number;
  pageSize: number;
  totalFiltered: number;
  totalPage: number;
  totalRecords: number;
}

export interface WorkflowQueryParams {
  start?: number;
  length?: number;
  search?: string;
  wfType?: string;
}

export interface WorkflowState {
  metadata: WorkflowMetadata;
  nodes: BaseNode[];
  connections: WorkflowConnection[];
  selectedNodeId?: string;
  ui: {
    isDraggingNode?: string;
    isConnecting?: string;
    tempConnection?: Position;
  };
}

// [ deprecate ] Editor v3.0 - use BaseNode instead
// export type NodeType = {
//   id: string;
//   type: string;
//   position: Position;
//   data: {
//     label: string;
//     description?: string;
//     config?: Record<string, unknown>;
//   };
// };
