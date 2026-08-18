// /src/types/index.ts
/**
 * Core TypeScript type definitions for CMS
 * Comprehensive type system for the entire application
 */

import { Customer } from "@/cms/store/api/custommerApi";
import type { Workflow } from "@/cms/types/workflow";

export type ChartType = "line" | "bar" | "pie" | "area" | "scatter" | "gauge" | "heatmap";
export type EscalationAction = "notify_manager" | "reassign" | "increase_priority" | "send_email";
export type FilterOperator = "equals" | "not_equals" | "contains" | "not_contains" | "greater_than" | "less_than" | "between" | "in" | "not_in" | "is_null" | "is_not_null";
export type FormFieldType = "text" | "email" | "password" | "number" | "date" | "time" | "select" | "multiselect" | "checkbox" | "radio" | "textarea" | "file" | "location";
export type NotificationChannel = "ticket_assigned" | "ticket_updated" | "sla_breach" | "workflow_completed";
export type NotificationPriority = "low" | "medium" | "high" | "urgent";
export type NotificationType = "info" | "success" | "warning" | "error" | "system";
export type Permission = "read" | "write" | "delete" | "admin" | "manage_users" | "manage_workflows";
export type Role = string;
export type SLAStatus = "on_time" | "warning" | "breached";
export type TicketCategory = "bug" | "feature" | "support" | "incident" | "change_request";
export type TicketPriority = "low" | "medium" | "high" | "urgent";
export type TicketStatus = "open" | "in_progress" | "pending" | "resolved" | "closed";
export type TimelineAction = "created" | "updated" | "assigned" | "commented" | "status_changed" | "completed";
export type TriggerEvent = "ticket_created" | "ticket_updated" | "status_changed" | "sla_warning" | "manual";
export type Variant = "primary" | "success" | "error" | "warning" | "info" | "light" | "dark" | "outline" | "outline-primary" | "outline-success" | "outline-error"
  | "outline-warning" | "outline-info" | "ghost" | "ghost-primary" | "ghost-success" | "ghost-error" | "ghost-warning" | "ghost-info" | "secondary" | "emergency"
  | "outline-no-transparent";
export type WidgetType = "chart" | "table" | "metric" | "map" | "timeline" | "kanban" | "custom";
export type WorkflowStepType = "start" | "end" | "task" | "decision" | "parallel" | "merge" | "timer";

// ===================================================================
// Base Entity Types
// ===================================================================

export interface BaseEntity {
  id: string | number;
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy: string;
  updatedBy: string;
}

export interface sourceInterface {
  id: string;
  name: string;
}

export interface Custommer extends Customer {
  name: string;
}

export interface DropdownOption {
  id: string;
  name: string;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
  frequency: "immediate" | "hourly" | "daily";
  channels: NotificationChannel[];
}

export interface WidgetConfig {
  title: string;
  dataSource: DataSource;
  chartType?: ChartType;
  filters?: WidgetFilter[];
  refreshInterval?: number;
  customSettings?: Record<string, unknown>;
}

export interface WidgetLayout {
  id: string;
  type: WidgetType;
  position: { x: number; y: number; w: number; h: number };
  config: WidgetConfig;
}

export interface DashboardPreferences {
  layout: WidgetLayout[];
  defaultView: "dashboard" | "tickets" | "workflows";
}

// ===================================================================
// User & Authentication Types
// ===================================================================

export interface UserPreferences {
  theme: "light" | "dark" | "auto";
  language: "en" | "th" | "zh";
  notifications: NotificationPreferences;
  dashboard: DashboardPreferences;
}

export interface User extends BaseEntity {
  user: string;
  username: string;
  name: string;
  avatar?: string;
  role: Role;
  mobileNo?: string;
  firstName?: string;
  lastName?: string;
  department: string;
  email?: string;
  permissions: Permission[];
  lastLogin?: Date;
  isActive: boolean;
  photo: string;
  preferences: UserPreferences;
}

// ===================================================================
// Ticket Management Types
// ===================================================================

export interface Attachment {
  id: string;
  filename: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface Comment extends BaseEntity {
  ticketId: string;
  content: string;
  author: User;
  isInternal: boolean;
  attachments: Attachment[];
}

export interface Ticket extends BaseEntity {
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  assigneeId?: string;
  assignee?: User;
  reporterId: string;
  reporter: User;
  tags: string[];
  customFields: Record<string, unknown>;
  attachments: Attachment[];
  comments: Comment[];
  workflowId?: string;
  workflow?: Workflow;
  sla: SLAConfig;
  location?: GeoLocation;
  timeline: TimelineEvent[];
}

// ===================================================================
// Workflow Types
// ===================================================================

export interface EscalationRule {
  level: number;
  triggerAfter: number;
  assignTo: string;
  actions: EscalationAction[];
}

export interface WorkflowStepConfig {
  assignee?: string;
  requiredFields?: string[];
  autoComplete?: boolean;
  timeLimit?: number;
  escalationRules?: EscalationRule[];
}

export interface WorkflowCondition {
  field: string;
  operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than";
  value: unknown;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: WorkflowStepType;
  config: WorkflowStepConfig;
  position: { x: number; y: number };
  connections: string[];
  conditions?: WorkflowCondition[];
}

export interface WorkflowTrigger {
  id: string;
  event: TriggerEvent;
  conditions: WorkflowCondition[];
}

export interface WorkflowVariable {
  name: string;
  type: "string" | "number" | "boolean" | "date" | "user" | "ticket";
  defaultValue?: unknown;
  required: boolean;
}

// ===================================================================
// SLA & Monitoring Types
// ===================================================================

export interface BusinessHours {
  timezone: string;
  workdays: number[];
  startTime: string;
  endTime: string;
  holidays: Date[];
}

export interface SLAConfig {
  id: string;
  name: string;
  responseTime: number;
  resolutionTime: number;
  businessHours: BusinessHours;
  escalationRules: EscalationRule[];
  status: SLAStatus;
}

// ===================================================================
// Dashboard & Widget Types
// ===================================================================

export interface DashboardFilter extends Filter {
  global: boolean;
  widgetIds?: string[];
}

export interface DashboardConfig {
  id: string;
  name: string;
  layout: WidgetLayout[];
  filters: DashboardFilter[];
  isDefault: boolean;
  isShared: boolean;
  sharedWith: string[];
}

export interface DataAggregation {
  groupBy: string[];
  metrics: MetricDefinition[];
  timeRange: TimeRange;
}

export interface DataSource {
  type: "tickets" | "workflows" | "users" | "sla" | "custom";
  endpoint?: string;
  query?: string;
  aggregation?: DataAggregation;
}

export interface MetricDefinition {
  field: string;
  function: "count" | "sum" | "avg" | "min" | "max";
  alias?: string;
}

export interface TimeRange {
  start: Date;
  end: Date;
  period?: "hour" | "day" | "week" | "month" | "quarter" | "year";
}

// ===================================================================
// GIS & Location Types
// ===================================================================

export interface GeoLocation {
  latitude: number;
  longitude: number;
  address?: string;
  accuracy?: number;
}

export interface MapLayer {
  id: string;
  name: string;
  type: "feature" | "tile" | "vector";
  url: string;
  visible: boolean;
  opacity: number;
}

export interface MapConfig {
  center: GeoLocation;
  zoom: number;
  basemap: string;
  layers: MapLayer[];
}

// ===================================================================
// Notification Types
// ===================================================================

export interface NotificationAction {
  label: string;
  action: string;
  style: "primary" | "secondary" | "danger";
}

export interface Notification extends BaseEntity {
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  recipient: string;
  isRead: boolean;
  actions?: NotificationAction[];
  metadata?: Record<string, unknown>;
}

// ===================================================================
// Timeline & Activity Types
// ===================================================================

export interface FieldChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
  displayName: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: Date;
  actor: User;
  action: TimelineAction;
  target: string;
  targetType: "ticket" | "workflow" | "user" | "sop";
  changes?: FieldChange[];
  metadata?: Record<string, unknown>;
}

// ===================================================================
// Form & UI Types
// ===================================================================

export interface ValidationRule {
  type: "required" | "min" | "max" | "pattern" | "custom";
  value?: unknown;
  message: string;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string;
}

export interface ConditionalRule {
  field: string;
  operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than";
  value: unknown;
  action: "show" | "hide" | "enable" | "disable" | "require";
}

export interface FormField {
  name: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  validation?: ValidationRule[];
  options?: SelectOption[];
  dependsOn?: string[];
  conditional?: ConditionalRule;
}

// ===================================================================
// Filter Types
// ===================================================================

export interface Filter {
  id: string;
  field: string;
  operator: FilterOperator;
  value: unknown;
  displayName: string;
}

export interface WidgetFilter extends Filter {
  locked: boolean;
}

// ===================================================================
// API Response Types
// ===================================================================

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
}

export interface ApiResponse<T> {
  success?: boolean;
  status?: boolean;
  message?: string;
  msg?: string;
  data?: T;
  errors?: Record<string, string[]>;
  desc?: string;
  pagination?: PaginationInfo;
  meta?: {
    timestamp: string;
    requestId: string;
  };
  pageSize?: number;
  totalFiltered?: number;
  totalPage?: number;
  totalRecords?: number
  currentPage?: number
}

// ===================================================================
// State Management Types
// ===================================================================

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  sessionTimeout: number | null;
  failedAttempts: number;
  isLocked: boolean;
}

export interface TicketState {
  tickets: Ticket[];
  currentTicket: Ticket | null;
  filters: Filter[];
  pagination: PaginationInfo;
  isLoading: boolean;
  error: string | null;
  selectedTickets: string[];
}

export interface WorkflowState {
  workflows: Workflow[];
  currentWorkflow: Workflow | null;
  templates: Workflow[];
  isDesignerOpen: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface NotificationState {
  notifications?: Notification[];
  unreadCount?: number;
  preferences?: NotificationPreferences;
  isLoading?: boolean;
  error?: string | null;
  show?: boolean;
  type?: "success" | "error" | "warning" | "info";
  title?: string;
  message?: string;
}

export interface UIState {
  sidebarCollapsed: boolean;
  theme: "light" | "dark" | "auto";
  language: "en" | "th" | "zh";
  loading: Record<string, boolean>;
  modals: Record<string, boolean>;
  toasts: ToastMessage[];
}

export interface RealtimeState {
  connected: boolean;
  lastPing: Date | null;
  activeUsers: User[];
  events: RealtimeEvent[];
}

export interface AppState {
  auth: AuthState;
  tickets: TicketState;
  workflows: WorkflowState;
  notifications: NotificationState;
  ui: UIState;
  realtime: RealtimeState;
}

export interface ToastMessage {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  actions?: NotificationAction[];
}

export interface RealtimeEvent {
  id: string;
  type: string;
  data: unknown;
  timestamp: Date;
}

// ===================================================================
// Component Props Types
// ===================================================================

export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  testId?: string;
}

export interface ButtonProps extends BaseComponentProps {
  variant?: "primary" | "secondary" | "tertiary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
}

export interface InputProps extends BaseComponentProps {
  type?: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  error?: string;
  label?: string;
  hint?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
}

export interface LoadingProps extends BaseComponentProps {
  size?: "sm" | "md" | "lg";
  variant?: "spinner" | "skeleton" | "dots";
  text?: string;
}
