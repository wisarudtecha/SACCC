// /src/components/admin/user-management/AuditTrailViewer.tsx
import React, { useState, useMemo, ReactNode } from "react";
import { 
  Filter, 
  Download, 
  Search,  
  Edit,  
  Shield, 
  Lock, 
  Unlock,
  UserPlus,
  UserMinus,
  AlertTriangle,
  Clock,
  MapPin,
  Monitor,
  Smartphone,
  Globe,
  Activity,
  ChevronDown,
  ChevronRight,
  Settings,
  Key
} from "lucide-react";

// Types and Interfaces
interface User {
  id: string | number;
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
  department?: string;
}

interface AuditEvent {
  id: string;
  userId: string;
  timestamp: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  changes?: FieldChange[];
  ipAddress: string;
  userAgent: string;
  location?: string;
  sessionId: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "success" | "failed" | "pending";
  additionalData?: Record<string, unknown>;
}

interface FieldChange {
  field: string;
  oldValue: ReactNode;
  newValue: ReactNode;
  sensitive?: boolean;
}

interface AuditAction {
  type: "login" | "logout" | "create" | "update" | "delete" | "view" | "download" | "admin" | "security";
  category: "authentication" | "user_management" | "data_access" | "system_config" | "security" | "compliance";
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
}

interface AuditFilter {
  dateRange: {
    start: string;
    end: string;
  };
  actions: string[];
  severity: string[];
  status: string[];
  users: string[];
  search: string;
  ipAddress: string;
}

interface AuditTrailViewerProps {
  user?: User;
  isOpen?: boolean;
  onClose?: () => void;
}

// Mock Data and Configurations
const auditActions: Record<string, AuditAction> = {
  login: {
    type: "login",
    category: "authentication",
    description: "User Login",
    icon: Lock,
    color: "text-green-600"
  },
  logout: {
    type: "logout",
    category: "authentication",
    description: "User Logout",
    icon: Unlock,
    color: "text-blue-600"
  },
  failed_login: {
    type: "login",
    category: "security",
    description: "Failed Login Attempt",
    icon: AlertTriangle,
    color: "text-red-600"
  },
  user_create: {
    type: "create",
    category: "user_management",
    description: "User Created",
    icon: UserPlus,
    color: "text-green-600"
  },
  user_update: {
    type: "update",
    category: "user_management",
    description: "User Updated",
    icon: Edit,
    color: "text-blue-600"
  },
  user_delete: {
    type: "delete",
    category: "user_management",
    description: "User Deleted",
    icon: UserMinus,
    color: "text-red-600"
  },
  role_change: {
    type: "update",
    category: "security",
    description: "Role Changed",
    icon: Shield,
    color: "text-purple-600"
  },
  password_reset: {
    type: "security",
    category: "security",
    description: "Password Reset",
    icon: Key,
    color: "text-yellow-600"
  },
  data_export: {
    type: "download",
    category: "data_access",
    description: "Data Export",
    icon: Download,
    color: "text-orange-600"
  },
  settings_change: {
    type: "update",
    category: "system_config",
    description: "Settings Modified",
    icon: Settings,
    color: "text-gray-600"
  }
};

const generateMockAuditEvents = (user: User): AuditEvent[] => {
  const events: AuditEvent[] = [];
  const actionKeys = Object.keys(auditActions);
  const severities: AuditEvent["severity"][] = ["low", "medium", "high", "critical"];
  const statuses: AuditEvent["status"][] = ["success", "failed", "pending"];
  
  // Generate events for the past 30 days
  for (let i = 0; i < 50; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const hoursAgo = Math.floor(Math.random() * 24);
    const minutesAgo = Math.floor(Math.random() * 60);
    
    const timestamp = new Date();
    timestamp.setDate(timestamp.getDate() - daysAgo);
    timestamp.setHours(timestamp.getHours() - hoursAgo);
    timestamp.setMinutes(timestamp.getMinutes() - minutesAgo);
    
    const actionKey = actionKeys[Math.floor(Math.random() * actionKeys.length)];
    const action = auditActions[actionKey];
    
    const event: AuditEvent = {
      id: `audit_${i + 1}`,
      // userId: user?.id,
      userId: user?.id.toString(),
      timestamp: timestamp.toISOString(),
      action,
      resource: getResourceForAction(actionKey),
      resourceId: `res_${Math.random().toString(36).substr(2, 9)}`,
      ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
      userAgent: getRandomUserAgent(),
      location: getRandomLocation(),
      sessionId: `session_${Math.random().toString(36).substr(2, 12)}`,
      severity: severities[Math.floor(Math.random() * severities.length)],
      status: actionKey === "failed_login" ? "failed" : statuses[Math.floor(Math.random() * statuses.length)],
      changes: generateFieldChanges(actionKey),
      additionalData: generateAdditionalData(actionKey)
    };
    
    events.push(event);
  }
  
  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

const getResourceForAction = (actionKey: string): string => {
  const resources = {
    login: "Authentication System",
    logout: "Authentication System",
    failed_login: "Authentication System",
    user_create: "User Management",
    user_update: "User Management",
    user_delete: "User Management",
    role_change: "Role Management",
    password_reset: "Security System",
    data_export: "Data Management",
    settings_change: "System Configuration"
  };
  return resources[actionKey as keyof typeof resources] || "System";
};

const getRandomUserAgent = (): string => {
  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Android 14; Mobile; rv:120.0) Gecko/120.0 Firefox/120.0"
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)];
};

const getRandomLocation = (): string => {
  const locations = [
    "New York, NY, US",
    "London, UK",
    "Tokyo, JP",
    "Sydney, AU",
    "Toronto, CA",
    "Berlin, DE",
    "Singapore, SG",
    "Mumbai, IN"
  ];
  return locations[Math.floor(Math.random() * locations.length)];
};

const generateFieldChanges = (actionKey: string): FieldChange[] => {
  const changes: Record<string, FieldChange[]> = {
    user_update: [
      { field: "email", oldValue: "old@example.com", newValue: "new@example.com" },
      { field: "phone", oldValue: "+1-555-0123", newValue: "+1-555-0456" },
      { field: "department", oldValue: "IT", newValue: "Operations" }
    ],
    role_change: [
      { field: "role", oldValue: "Agent", newValue: "Supervisor" },
      { field: "permissions", oldValue: ["case_view", "case_create"], newValue: ["case_view", "case_create", "case_manage"] }
    ],
    password_reset: [
      { field: "password", oldValue: "********", newValue: "********", sensitive: true },
      { field: "password_changed_at", oldValue: "2025-06-15T10:30:00Z", newValue: "2025-07-16T14:20:00Z" }
    ]
  };
  return changes[actionKey] || [];
};

const generateAdditionalData = (actionKey: string): Record<string, unknown> => {
  const additionalData: Record<string, Record<string, unknown>> = {
    login: {
      method: "2FA",
      device_fingerprint: "fp_" + Math.random().toString(36).substr(2, 12),
      login_duration: Math.floor(Math.random() * 7200) + 300 // 5 minutes to 2 hours
    },
    data_export: {
      export_type: "CSV",
      record_count: Math.floor(Math.random() * 10000) + 100,
      file_size: `${Math.floor(Math.random() * 50) + 1}MB`
    },
    failed_login: {
      failure_reason: "Invalid credentials",
      attempt_number: Math.floor(Math.random() * 5) + 1,
      account_locked: Math.random() > 0.7
    }
  };
  return additionalData[actionKey] || {};
};

// Utility Functions
const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString() + " " + date.toLocaleTimeString();
};

const getSeverityColor = (severity: string): string => {
  const colors = {
    low: "text-green-600 bg-green-100 dark:bg-green-900/20",
    medium: "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20",
    high: "text-orange-600 bg-orange-100 dark:bg-orange-900/20",
    critical: "text-red-600 bg-red-100 dark:bg-red-900/20"
  };
  return colors[severity as keyof typeof colors] || colors.low;
};

const getStatusColor = (status: string): string => {
  const colors = {
    success: "text-green-600 bg-green-100 dark:bg-green-900/20",
    failed: "text-red-600 bg-red-100 dark:bg-red-900/20",
    pending: "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20"
  };
  return colors[status as keyof typeof colors] || colors.success;
};

const getDeviceIcon = (userAgent: string): React.ComponentType<React.SVGProps<SVGSVGElement>> => {
  if (userAgent.includes("iPhone") || userAgent.includes("Android")) return Smartphone;
  if (userAgent.includes("Windows") || userAgent.includes("Mac")) return Monitor;
  return Globe;
};

// Components
const AuditEventCard: React.FC<{
  event: AuditEvent;
  isExpanded: boolean;
  onToggleExpand: () => void;
}> = ({ event, isExpanded, onToggleExpand }) => {
  const Icon = event.action.icon;
  const DeviceIcon = getDeviceIcon(event.userAgent);

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-700`}>
            <Icon className={`w-5 h-5 ${event.action.color}`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                {event.action.description}
              </h4>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(event.severity)}`}>
                {event.severity}
              </span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                {event.status}
              </span>
            </div>
            
            <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {formatTimestamp(event.timestamp)}
              </span>
              <span className="flex items-center">
                <Globe className="w-3 h-3 mr-1" />
                {event.ipAddress}
              </span>
              {event.location && (
                <span className="flex items-center">
                  <MapPin className="w-3 h-3 mr-1" />
                  {event.location}
                </span>
              )}
              <span className="flex items-center">
                <DeviceIcon className="w-3 h-3 mr-1" />
                {event.userAgent.includes("Mobile") ? "Mobile" : "Desktop"}
              </span>
            </div>
          </div>
        </div>
        
        <button
          onClick={onToggleExpand}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Basic Information */}
            <div>
              <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Event Details</h5>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Resource:</span>
                  <span className="text-gray-900 dark:text-white">{event.resource}</span>
                </div>
                {event.resourceId && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Resource ID:</span>
                    <span className="text-gray-900 dark:text-white font-mono">{event.resourceId}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Session ID:</span>
                  <span className="text-gray-900 dark:text-white font-mono">{event.sessionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Category:</span>
                  <span className="text-gray-900 dark:text-white capitalize">{event.action.category.replace("_", " ")}</span>
                </div>
              </div>
            </div>

            {/* Technical Information */}
            <div>
              <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Technical Details</h5>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-gray-500 dark:text-gray-400 block">User Agent:</span>
                  <span className="text-gray-900 dark:text-white font-mono text-xs break-all">
                    {event.userAgent}
                  </span>
                </div>
                {Object.entries(event.additionalData || {}).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400 capitalize">
                      {key.replace("_", " ")}:
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      {typeof value === "boolean" ? (value ? "Yes" : "No") : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Field Changes */}
          {event.changes && event.changes.length > 0 && (
            <div className="mt-4">
              <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Changes Made</h5>
              <div className="space-y-2">
                {event.changes.map((change, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                        {change.field.replace("_", " ")}
                      </span>
                      {change.sensitive && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                          <Lock className="w-3 h-3 mr-1" />
                          Sensitive
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Previous:</span>
                        <div className="text-gray-900 dark:text-white font-mono bg-red-50 dark:bg-red-900/20 p-2 rounded mt-1">
                          {change.sensitive ? "••••••••" : JSON.stringify(change.oldValue)}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">New:</span>
                        <div className="text-gray-900 dark:text-white font-mono bg-green-50 dark:bg-green-900/20 p-2 rounded mt-1">
                          {change.sensitive ? "••••••••" : JSON.stringify(change.newValue)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const FilterPanel: React.FC<{
  filter: AuditFilter;
  onFilterChange: (filter: AuditFilter) => void;
  eventCount: number;
}> = ({ filter, onFilterChange, eventCount }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search audit logs..."
              value={filter.search}
              onChange={(e) => onFilterChange({ ...filter, search: e.target.value })}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 w-64"
            />
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
          >
            <Filter className="w-4 h-4 mr-2" />
            Advanced Filters
          </button>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {eventCount} events found
          </span>
          <button className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date Range</label>
            <div className="space-y-2">
              <input
                type="date"
                value={filter.dateRange.start}
                onChange={(e) => onFilterChange({
                  ...filter,
                  dateRange: { ...filter.dateRange, start: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
              <input
                type="date"
                value={filter.dateRange.end}
                onChange={(e) => onFilterChange({
                  ...filter,
                  dateRange: { ...filter.dateRange, end: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Actions</label>
            <select
              multiple
              value={filter.actions}
              onChange={(e) => onFilterChange({
                ...filter,
                actions: Array.from(e.target.selectedOptions, option => option.value)
              })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              size={4}
            >
              {Object.entries(auditActions).map(([key, action]) => (
                <option key={key} value={key}>{action.description}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Severity</label>
            <select
              multiple
              value={filter.severity}
              onChange={(e) => onFilterChange({
                ...filter,
                severity: Array.from(e.target.selectedOptions, option => option.value)
              })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              size={4}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
            <select
              multiple
              value={filter.status}
              onChange={(e) => onFilterChange({
                ...filter,
                status: Array.from(e.target.selectedOptions, option => option.value)
              })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              size={3}
            >
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">IP Address</label>
            <input
              type="text"
              value={filter.ipAddress}
              onChange={(e) => onFilterChange({ ...filter, ipAddress: e.target.value })}
              placeholder="192.168.1.1"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Main Component
const AuditTrailViewer: React.FC<AuditTrailViewerProps> = ({ user, isOpen }) => {
  const [auditEvents] = useState<AuditEvent[]>(() => generateMockAuditEvents(user!));
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<AuditFilter>({
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 30 days ago
      end: new Date().toISOString().split("T")[0] // today
    },
    actions: [],
    severity: [],
    status: [],
    users: [],
    search: "",
    ipAddress: ""
  });

  const filteredEvents = useMemo(() => {
    return auditEvents.filter(event => {
      // Date range filter
      const eventDate = new Date(event.timestamp).toISOString().split("T")[0];
      if (filter.dateRange.start && eventDate < filter.dateRange.start) return false;
      if (filter.dateRange.end && eventDate > filter.dateRange.end) return false;

      // Actions filter
      if (filter.actions.length > 0) {
        const actionKey = Object.keys(auditActions).find(key => 
          auditActions[key].description === event.action.description
        );
        if (!actionKey || !filter.actions.includes(actionKey)) return false;
      }

      // Severity filter
      if (filter.severity.length > 0 && !filter.severity.includes(event.severity)) return false;

      // Status filter
      if (filter.status.length > 0 && !filter.status.includes(event.status)) return false;

      // IP Address filter
      if (filter.ipAddress && !event.ipAddress.includes(filter.ipAddress)) return false;

      // Search filter
      if (filter.search) {
        const searchTerm = filter.search.toLowerCase();
        const searchableText = [
          event.action.description,
          event.resource,
          event.ipAddress,
          event.location,
          event.userAgent
        ].join(" ").toLowerCase();
        
        if (!searchableText.includes(searchTerm)) return false;
      }

      return true;
    });
  }, [auditEvents, filter]);

  const toggleEventExpansion = (eventId: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  if (!isOpen) return null;

  return (
    <div className="">
      <FilterPanel
        filter={filter}
        onFilterChange={setFilter}
        eventCount={filteredEvents.length}
      />

      <div className="space-y-4">
        {filteredEvents.length > 0 ? (
          filteredEvents.map(event => (
            <AuditEventCard
              key={event.id}
              event={event}
              isExpanded={expandedEvents.has(event.id)}
              onToggleExpand={() => toggleEventExpansion(event.id)}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No audit events found</h3>
            <p className="text-gray-500 dark:text-gray-400">
              Try adjusting your search criteria or date range.
            </p>
          </div>
        )}
      </div>
    </div>

    // <div className="fixed inset-0 z-50 overflow-y-auto">
    //   <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
    //     <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
    //     <div className="inline-block align-bottom bg-gray-50 dark:bg-gray-900 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
    //       <div className="bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
    //         <div className="flex items-center justify-between">
    //           <div>
    //             <h3 className="text-lg font-medium text-gray-900 dark:text-white">
    //               Audit Trail for {user?.firstName} {user?.lastName}
    //             </h3>
    //             <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
    //               {user?.email} • {user?.role} • {user?.department}
    //             </p>
    //           </div>
    //           <button
    //             onClick={onClose}
    //             className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
    //           >
    //             <X className="w-6 h-6" />
    //           </button>
    //         </div>
    //       </div>
    //       <div className="p-6 max-h-[80vh] overflow-y-auto">
    //         <FilterPanel
    //           filter={filter}
    //           onFilterChange={setFilter}
    //           eventCount={filteredEvents.length}
    //         />
    //         <div className="space-y-4">
    //           {filteredEvents.length > 0 ? (
    //             filteredEvents.map(event => (
    //               <AuditEventCard
    //                 key={event.id}
    //                 event={event}
    //                 isExpanded={expandedEvents.has(event.id)}
    //                 onToggleExpand={() => toggleEventExpansion(event.id)}
    //               />
    //             ))
    //           ) : (
    //             <div className="text-center py-12">
    //               <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
    //               <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No audit events found</h3>
    //               <p className="text-gray-500 dark:text-gray-400">
    //                 Try adjusting your search criteria or date range.
    //               </p>
    //             </div>
    //           )}
    //         </div>
    //       </div>
    //     </div>
    //   </div>
    // </div>
  );
};

export default AuditTrailViewer;
