import React, { useState, useMemo, useEffect, useRef } from 'react';
// Since this is a self-contained example, we'll mock the Link component.
import {
    Search,
    Filter,
    User as UserIcon,
    Activity,
    CheckCircle,
    XCircle,
    AlertCircle,
    ChevronDown,
    ChevronRight,
    Hash,
    FileText,
    Zap,
    RefreshCw,
    Plus,
    Trash2,
    Info,
    Loader2,
    ServerCrash,
    Settings,
    Database,
    Shield,
    Bell,
    Users,
    FolderOpen,
    LogIn,
    LogOut,
    Edit,
    Eye,
    Save,
    Upload,
    Download,
    Mail,
    Clock,
    MessageSquare,
    Layers,
    BarChart3,
    PieChart
} from 'lucide-react';
import PageBreadcrumb from '@/core/components/common/PageBreadCrumb';
import { useTranslation } from '@/core/hooks/useTranslation';
import Toast from '@/core/components/toast/Toast';
import { useGetUsersQuery } from '@/core/store/api/userApi';
import { useGetAuditLogsQuery, useLazyGetAuditLogsByUsernameQuery } from '@/core/store/api/auditApi';
import { User } from '@/cms/types';

// --- Local Interfaces ---
interface AuditLog {
    id: number;
    orgId: string;
    username: string;
    txId: string;
    uniqueId: string;
    mainFunc: string;
    subFunc: string;
    nameFunc: string;
    action: string;
    status: number;
    duration: number;
    newData: unknown;
    oldData: unknown;
    resData: unknown;
    message: string;
    createdAt: string;
}

interface AuditFilter {
    dateRange: {
        start: string;
        end: string;
    };
    username: string;
    mainFunc: string;
    subFunc: string;
    action: string;
    status: string;
    search: string;
}

const DataDisplay = ({ data }: {
    // data: any
    data: unknown
}) => {
    const { t } = useTranslation();

    if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
        return (
            <div className="text-center py-6">
                <div className="flex flex-col items-center gap-2 text-gray-400 dark:text-gray-500">
                    <Database className="w-6 h-6" />
                    <p className="text-sm italic">{t("common.no_data") || "No data available"}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-2 p-3 bg-white dark:bg-gray-800 rounded-md border font-mono text-xs max-h-64 overflow-y-auto">
            {Object.entries(data).map(([key, value]) => (
                <div key={key} className="flex justify-between items-start gap-3 py-1 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                    <span className="font-semibold text-gray-600 dark:text-gray-400 shrink-0 min-w-0">
                        {key}:
                    </span>
                    <span className="text-right break-all text-gray-800 dark:text-gray-200 min-w-0">
                        {typeof value === 'boolean' ? (
                            <span className={`px-1.5 py-0.5 rounded text-xs ${value ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                                {value ? 'true' : 'false'}
                            </span>
                        ) : value === null ? (
                            <span className="text-gray-400 italic">null</span>
                        ) : typeof value === 'object' ? (
                            <span className="text-purple-600 dark:text-purple-400">
                                {JSON.stringify(value, null, 2)}
                            </span>
                        ) : (
                            String(value)
                        )}
                    </span>
                </div>
            ))}
        </div>
    );
};

export default function AuditLog() {
    // --- STATE MANAGEMENT ---
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [usernames, setUsernames] = useState<string[]>([]);
    const [expandedLog, setExpandedLog] = useState<number | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [filter, setFilter] = useState<AuditFilter>({
        dateRange: { start: '', end: '' },
        username: '',
        mainFunc: '',
        subFunc: '',
        action: '',
        status: '',
        search: ''
    });

    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [usernameSearch, setUsernameSearch] = useState('');
    const [showUserDropdown, setShowUserDropdown] = useState(false);

    // Toast state - simplified for single toast management
    const [toast, setToast] = useState<{
        message: string;
        type: "success" | "error" | "info";
        show: boolean;
    }>({ message: "", type: "info", show: false });

    // const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Translation hook
    const { t } = useTranslation();

    // --- API HOOKS (replaces manual fetch) ---
    const {
        data: allLogsResponse,
        isLoading: isLogsLoading,
        isFetching: isLogsFetching,
        refetch: refetchAll,
        error: allLogsError
    } = useGetAuditLogsQuery({ start: 0, length: 100 });

    const [triggerUserLogs, {
        data: userLogsResponse,
        isFetching: isUserLogsFetching,
        error: userLogsError
    }] = useLazyGetAuditLogsByUsernameQuery();

    const { data: usersResponse } = useGetUsersQuery({ start: 0, length: 100 });

    const loading = isLogsLoading || isLogsFetching || isUserLogsFetching;

    // Combine error states
    const queryError = (allLogsError || userLogsError) as any;
    const error = queryError ? (queryError.data?.message || queryError.message || JSON.stringify(queryError)) : null;

    // Sync all-log results → local state
    useEffect(() => {
        if (!filter.username && allLogsResponse?.data) {
            setLogs(allLogsResponse.data);
        }
    }, [allLogsResponse, filter.username]);

    // Sync per-user log results → local state
    useEffect(() => {
        if (filter.username && userLogsResponse?.data) {
            setLogs(userLogsResponse.data);
        }
    }, [userLogsResponse, filter.username]);

    // Sync users list → username dropdown
    useEffect(() => {
        if (usersResponse?.data) {
            const names = usersResponse.data.map((u: User) => u.username);
            setUsernames([...new Set(names)].sort() as string[]);
        }
    }, [usersResponse]);

    // Refresh / re-fetch handler
    const handleRefreshLogs = () => {
        if (filter.username) {
            triggerUserLogs({ username: filter.username, start: 0, length: 100 });
        } else {
            refetchAll();
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (showUserDropdown && !(event.target as Element).closest('.user-dropdown')) {
                setShowUserDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showUserDropdown]);

    // Cleanup toast timeout on unmount
    useEffect(() => {
        return () => {
            if (toastTimeoutRef.current) {
                clearTimeout(toastTimeoutRef.current);
            }
        };
    }, []);

    // --- MEMOIZED COMPUTATIONS ---
    const uniqueValues = useMemo(() => {
        return {
            mainFuncs: [...new Set(logs.map(log => log.mainFunc))].sort(),
            subFuncs: [...new Set(logs.map(log => log.subFunc))].sort(),
            actions: [...new Set(logs.map(log => log.action))].sort()
        };
    }, [logs]); // Based on actual logs data

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const logDate = new Date(log.createdAt);
            const startDate = filter.dateRange.start ? new Date(filter.dateRange.start) : null;
            const endDate = filter.dateRange.end ? new Date(filter.dateRange.end) : null;

            if (startDate && logDate < startDate) return false;
            if (endDate && logDate > endDate) return false;

            if (filter.username && log.username !== filter.username) return false;
            if (filter.mainFunc && log.mainFunc !== filter.mainFunc) return false;
            if (filter.subFunc && log.subFunc !== filter.subFunc) return false;
            if (filter.action && log.action !== filter.action) return false;
            if (filter.status !== '' && log.status !== parseInt(filter.status)) return false;

            if (filter.search) {
                const searchLower = filter.search.toLowerCase();
                return (
                    log?.username?.toLowerCase()?.includes(searchLower) ||
                    log?.txId?.toLowerCase()?.includes(searchLower) ||
                    log?.message?.toLowerCase()?.includes(searchLower) ||
                    log?.mainFunc?.toLowerCase()?.includes(searchLower) ||
                    log?.action?.toLowerCase()?.includes(searchLower)
                );
            }

            return true;
        });
    }, [logs, filter]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filter, rowsPerPage]);

    const paginatedLogs = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        return filteredLogs.slice(startIndex, endIndex);
    }, [filteredLogs, currentPage, rowsPerPage]);

    const totalPages = Math.ceil(filteredLogs.length / rowsPerPage);

    // --- HELPER FUNCTIONS & HANDLERS ---
    const getFunctionIcon = (mainFunc: string, subFunc: string) => {
        const combined = `${mainFunc}.${subFunc}`.toLowerCase();

        // System functions
        if (mainFunc.toLowerCase().includes('system') || mainFunc.toLowerCase().includes('auth')) {
            if (combined.includes('login')) return { icon: LogIn, color: 'text-green-600 dark:text-green-400' };
            if (combined.includes('logout')) return { icon: LogOut, color: 'text-red-600 dark:text-red-400' };
            if (combined.includes('register')) return { icon: Users, color: 'text-blue-600 dark:text-blue-400' };
            return { icon: Shield, color: 'text-purple-600 dark:text-purple-400' };
        }

        // User functions
        if (mainFunc.toLowerCase().includes('user')) {
            if (combined.includes('create')) return { icon: Plus, color: 'text-green-600 dark:text-green-400' };
            if (combined.includes('update') || combined.includes('edit')) return { icon: Edit, color: 'text-orange-600 dark:text-orange-400' };
            if (combined.includes('delete')) return { icon: Trash2, color: 'text-red-600 dark:text-red-400' };
            if (combined.includes('view') || combined.includes('read')) return { icon: Eye, color: 'text-blue-600 dark:text-blue-400' };
            return { icon: UserIcon, color: 'text-indigo-600 dark:text-indigo-400' };
        }

        // Case functions
        if (mainFunc.toLowerCase().includes('case')) {
            if (combined.includes('assign')) return { icon: Users, color: 'text-purple-600 dark:text-purple-400' };
            if (combined.includes('create')) return { icon: Plus, color: 'text-green-600 dark:text-green-400' };
            if (combined.includes('update')) return { icon: Edit, color: 'text-orange-600 dark:text-orange-400' };
            if (combined.includes('delete')) return { icon: Trash2, color: 'text-red-600 dark:text-red-400' };
            return { icon: FolderOpen, color: 'text-amber-600 dark:text-amber-400' };
        }

        // Report functions
        if (mainFunc.toLowerCase().includes('report')) {
            if (combined.includes('export')) return { icon: Download, color: 'text-teal-600 dark:text-teal-400' };
            if (combined.includes('generate')) return { icon: BarChart3, color: 'text-blue-600 dark:text-blue-400' };
            if (combined.includes('delete')) return { icon: Trash2, color: 'text-red-600 dark:text-red-400' };
            return { icon: PieChart, color: 'text-emerald-600 dark:text-emerald-400' };
        }

        // Notification functions
        if (mainFunc.toLowerCase().includes('notification') || mainFunc.toLowerCase().includes('notify')) {
            if (combined.includes('send')) return { icon: Bell, color: 'text-yellow-600 dark:text-yellow-400' };
            if (combined.includes('create')) return { icon: Bell, color: 'text-green-600 dark:text-green-400' };
            if (combined.includes('email') || combined.includes('mail')) return { icon: Mail, color: 'text-blue-600 dark:text-blue-400' };
            return { icon: Bell, color: 'text-yellow-600 dark:text-yellow-400' };
        }

        // Settings functions
        if (mainFunc.toLowerCase().includes('settings') || mainFunc.toLowerCase().includes('config')) {
            return { icon: Settings, color: 'text-gray-600 dark:text-gray-400' };
        }

        // Database functions
        if (mainFunc.toLowerCase().includes('database') || mainFunc.toLowerCase().includes('backup')) {
            if (combined.includes('backup')) return { icon: Save, color: 'text-green-600 dark:text-green-400' };
            if (combined.includes('restore')) return { icon: Upload, color: 'text-blue-600 dark:text-blue-400' };
            return { icon: Database, color: 'text-indigo-600 dark:text-indigo-400' };
        }

        // Default based on action
        return { icon: Activity, color: 'text-gray-500 dark:text-gray-400' };
    };

    const getStatusBadge = (status: number) => {
        switch (status) {
            case 0: return {
                icon: CheckCircle,
                color: 'text-green-500 dark:text-green-400',
                bg: 'bg-green-100 dark:bg-green-900/30',
                text: t("audit_log.success") || "Success"
            };
            case -1: return {
                icon: XCircle,
                color: 'text-red-500 dark:text-red-400',
                bg: 'bg-red-100 dark:bg-red-900/30',
                text: t("audit_log.failed") || "Failed"
            };
            case -2: return {
                icon: AlertCircle,
                color: 'text-yellow-500 dark:text-yellow-400',
                bg: 'bg-yellow-100 dark:bg-yellow-900/30',
                text: t("audit_log.warning") || "Warning"
            };
            default: return {
                icon: AlertCircle,
                color: 'text-gray-500 dark:text-gray-400',
                bg: 'bg-gray-100 dark:bg-gray-700',
                text: t("audit_log.unknown") || "Unknown"
            };
        }
    };

    const getActionIcon = (action: string) => {
        switch (action.toLowerCase()) {
            case 'create': return { icon: Plus, color: 'text-green-500 dark:text-green-400' };
            case 'update':
            case 'edit': return { icon: Edit, color: 'text-orange-500 dark:text-orange-400' };
            case 'delete':
            case 'remove': return { icon: Trash2, color: 'text-red-500 dark:text-red-400' };
            case 'login':
            case 'signin': return { icon: LogIn, color: 'text-green-500 dark:text-green-400' };
            case 'logout':
            case 'signout': return { icon: LogOut, color: 'text-red-500 dark:text-red-400' };
            case 'view':
            case 'read':
            case 'get': return { icon: Eye, color: 'text-blue-500 dark:text-blue-400' };
            case 'save':
            case 'store': return { icon: Save, color: 'text-green-500 dark:text-green-400' };
            case 'upload': return { icon: Upload, color: 'text-blue-500 dark:text-blue-400' };
            case 'download':
            case 'export': return { icon: Download, color: 'text-purple-500 dark:text-purple-400' };
            case 'send':
            case 'notify': return { icon: Bell, color: 'text-yellow-500 dark:text-yellow-400' };
            case 'assign': return { icon: Users, color: 'text-purple-500 dark:text-purple-400' };
            default: return { icon: Activity, color: 'text-gray-500 dark:text-gray-400' };
        }
    };

    const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setRowsPerPage(Number(e.target.value));
    };

    const clearFilters = () => {
        setFilter({
            dateRange: { start: '', end: '' },
            username: '', mainFunc: '', subFunc: '', action: '', status: '', search: ''
        });
        setUsernameSearch('');
        setShowUserDropdown(false);
        // Remove toast notification for clear filters
    };

    // Handle username filter change and fetch specific user logs
    const handleUsernameChange = (username: string) => {
        setFilter({ ...filter, username });
        setUsernameSearch('');
        if (username) {
            triggerUserLogs({ username });
        }
        // If username is empty, the hook allLogsResponse will handle it
    };

    // Filter usernames for search
    const filteredUsernames = useMemo(() => {
        if (!usernameSearch) return usernames;
        return usernames.filter(username =>
            username.toLowerCase().includes(usernameSearch.toLowerCase())
        );
    }, [usernames, usernameSearch]);

    const breadcrumbItems = [
        { label: t("breadcrumb.home") || "Home", href: "/" },
        { label: t("breadcrumb.audit_log") || "Audit Log" }
    ];

    // --- RENDER ---
    return (
        <div className="bg-gray-50 dark:bg-gray-950 min-h-screen transition-colors duration-300 font-sans">
            <div
                // className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8"
                className="mx-auto p-4 sm:p-6 lg:p-8"
            >
                <PageBreadcrumb items={breadcrumbItems} />

                {/* Toast - Only show when needed */}
                {toast.show && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast({ message: "", type: "info", show: false })}
                        duration={4000}
                    />
                )}

                <div className="bg-white dark:bg-gray-900/50 rounded-xl shadow-sm p-6 mb-6 border border-gray-200 dark:border-gray-800">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <Activity className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {t("audit_log.title") || "Audit Log"}
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {t("audit_log.search_and_filter") || "Search and filter system audit logs"}
                                </p>
                            </div>
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            {filteredLogs.length} {t("audit_log.logs_found") || "logs found"}
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <div className="flex-1 w-full relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                // placeholder={t("audit_log.search_placeholder") || "ค้นหา ผู้ใช้, เลขธุรกรรม, ฟังก์ชั่น, การกระทำ..."} 
                                placeholder={t("audit_log.search_placeholder") || "ค้นหา ผู้ใช้, ฟังก์ชั่น, การกระทำ..."}
                                value={filter.search}
                                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={filter.status}
                                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">{t("audit_log.all_status") || "All Status"}</option>
                                <option value="0">{t("audit_log.success") || "Success"}</option>
                                <option value="-1">{t("audit_log.failed") || "Failed"}</option>
                                {/* <option value="2">{t("audit_log.warning") || "Warning"}</option> */}
                            </select>
                            <button
                                onClick={handleRefreshLogs}
                                className="group p-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 disabled:bg-blue-400 disabled:cursor-not-allowed"
                                title={t("audit_log.search_data") || "Search Data"}
                                disabled={loading}
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Search className="w-4 h-4" />
                                )}
                            </button>
                            <button
                                onClick={handleRefreshLogs}
                                className="group p-2.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white transition-all duration-200 disabled:bg-orange-400 disabled:cursor-not-allowed"
                                title={t("audit_log.refresh_data") || "Refresh Data"}
                                disabled={loading}
                            >
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-300'}`} />
                            </button>
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium border-2 ${showFilters
                                ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'
                                : 'border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800'
                                }`}
                        >
                            <Filter className="w-4 h-4" />
                            <span>{t("audit_log.filters") || "Filters"}</span>
                            {[filter.username, filter.mainFunc, filter.subFunc, filter.action, filter.status, filter.dateRange.start, filter.dateRange.end].filter(Boolean).length > 0 && (
                                <span className="ml-1 px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                                    {[filter.username, filter.mainFunc, filter.subFunc, filter.action, filter.status, filter.dateRange.start, filter.dateRange.end].filter(Boolean).length}
                                </span>
                            )}
                        </button>
                    </div>

                    {showFilters && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                            <div className="space-y-4">
                                {/* First row - Date range and Username */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div className="sm:col-span-2">
                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    {t("audit_log.start_date") || "Start Date/Time"}
                                                </label>
                                                <input
                                                    type="datetime-local"
                                                    value={filter.dateRange.start}
                                                    onChange={(e) => setFilter({ ...filter, dateRange: { ...filter.dateRange, start: e.target.value } })}
                                                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white dark:scheme-dark"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    {t("audit_log.end_date") || "End Date/Time"}
                                                </label>
                                                <input
                                                    type="datetime-local"
                                                    value={filter.dateRange.end}
                                                    onChange={(e) => setFilter({ ...filter, dateRange: { ...filter.dateRange, end: e.target.value } })}
                                                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white dark:scheme-dark"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            {t("audit_log.username") || "Username"}
                                        </label>
                                        <div className="relative user-dropdown">
                                            <button
                                                onClick={() => setShowUserDropdown(!showUserDropdown)}
                                                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-left flex items-center justify-between"
                                            >
                                                <span>{filter.username || t("audit_log.all_users") || "All Users"}</span>
                                                <ChevronDown className={`w-4 h-4 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} />
                                            </button>

                                            {showUserDropdown && (
                                                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-hidden">
                                                    {/* Search input inside dropdown */}
                                                    <div className="p-2 border-b border-gray-200 dark:border-gray-600">
                                                        <input
                                                            type="text"
                                                            placeholder={t('audit_log.search_users') || 'Search users...'}
                                                            value={usernameSearch}
                                                            onChange={(e) => setUsernameSearch(e.target.value)}
                                                            className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    </div>

                                                    {/* User options */}
                                                    <div className="max-h-40 overflow-y-auto">
                                                        <div
                                                            className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm text-gray-900 dark:text-white"
                                                            onClick={() => {
                                                                handleUsernameChange('');
                                                                setShowUserDropdown(false);
                                                            }}
                                                        >
                                                            {t("audit_log.all_users") || "All Users"}
                                                        </div>
                                                        {filteredUsernames.map(u => (
                                                            <div
                                                                key={u}
                                                                className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm text-gray-900 dark:text-white"
                                                                onClick={() => {
                                                                    handleUsernameChange(u);
                                                                    setShowUserDropdown(false);
                                                                }}
                                                            >
                                                                {u}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Second row - Function, Action, Clear button */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            {t("audit_log.function") || "Function"}
                                        </label>
                                        <select
                                            value={filter.mainFunc}
                                            onChange={(e) => setFilter({ ...filter, mainFunc: e.target.value })}
                                            className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        >
                                            <option value="">{t("audit_log.all_functions") || "All Functions"}</option>
                                            {uniqueValues.mainFuncs.map(func => <option key={func} value={func}>{func.charAt(0).toUpperCase() + func.slice(1)}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            {t("audit_log.action") || "Action"}
                                        </label>
                                        <select
                                            value={filter.action}
                                            onChange={(e) => setFilter({ ...filter, action: e.target.value })}
                                            className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        >
                                            <option value="">{t("audit_log.all_actions") || "All Actions"}</option>
                                            {uniqueValues.actions.map(a => <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex items-end">
                                        <button
                                            onClick={clearFilters}
                                            className="w-full text-center px-4 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                            {t("audit_log.clear_all") || "Clear All"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-white dark:bg-gray-900/50 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-800">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-900/70 border-b border-gray-200 dark:border-gray-800">
                                <tr>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        <div className="flex items-center gap-2">
                                            <UserIcon className="w-4 h-4" />
                                            {t("audit_log.user_transaction") || "User / Transaction / Time"}
                                        </div>
                                    </th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        <div className="flex items-center gap-2">
                                            <Layers className="w-4 h-4" />
                                            {t("audit_log.function") || "Function"}
                                        </div>
                                    </th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        <div className="flex items-center gap-2">
                                            <MessageSquare className="w-4 h-4" />
                                            {t("audit_log.message") || "Message"}
                                        </div>
                                    </th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        <div className="flex items-center gap-2">
                                            <Zap className="w-4 h-4" />
                                            {t("audit_log.action") || "Action"}
                                        </div>
                                    </th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4" />
                                            {t("audit_log.status") || "Status"}
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="text-center p-12">
                                            <div className="flex justify-center items-center gap-2 text-gray-500 dark:text-gray-400">
                                                <Loader2 className="w-6 h-6 animate-spin" />
                                                <span>{t("audit_log.loading_data") || "Loading Data..."}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : error ? (
                                    <tr>
                                        <td colSpan={5} className="text-center p-12">
                                            <div className="flex flex-col justify-center items-center gap-2 text-red-500">
                                                <ServerCrash className="w-8 h-8" />
                                                <span>{t("audit_log.error") || "Error"}: {error}</span>
                                                <span className="text-xs text-gray-400">
                                                    {t("audit_log.error_message") || "Please check the console or try again later."}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : paginatedLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center p-12">
                                            <div className="flex flex-col justify-center items-center gap-2 text-gray-500 dark:text-gray-400">
                                                <Search className="w-8 h-8" />
                                                <span>{t("audit_log.no_logs_found") || "No Logs Found"}</span>
                                                <span className="text-xs">
                                                    {t("audit_log.adjust_filters") || "Try adjusting your filters."}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedLogs.map((log) => {
                                        const isExpanded = expandedLog === log.id;
                                        const statusInfo = getStatusBadge(log.status);
                                        const actionInfo = getActionIcon(log.action);
                                        const functionInfo = getFunctionIcon(log.mainFunc, log.subFunc);
                                        return (
                                            <React.Fragment key={log.id}>
                                                <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/60 cursor-pointer transition-colors" onClick={() => setExpandedLog(isExpanded ? null : log.id)}>
                                                    {/* User / Transaction / Time Column */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="mt-1 shrink-0">
                                                                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <UserIcon className="w-3 h-3 text-blue-500" />
                                                                    <span className="font-medium text-gray-900 dark:text-white">{log.username}</span>
                                                                </div>

                                                                {/*
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <Hash className="w-3 h-3 text-gray-400" />
                                                                    <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">{log.txId}</span>
                                                                </div>
                                                                */}

                                                                <div className="flex items-center gap-2">
                                                                    <Clock className="w-3 h-3 text-gray-400" />
                                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                        {new Date(log.createdAt).toLocaleString()}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Function Column */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-start gap-2">
                                                            <functionInfo.icon className={`w-4 h-4 mt-0.5 ${functionInfo.color}`} />
                                                            <div>
                                                                <div className="font-medium text-gray-900 dark:text-white capitalize">
                                                                    {log.mainFunc}
                                                                </div>
                                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                    {log.subFunc} / {log.nameFunc}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Message Column */}
                                                    <td className="px-6 py-4">
                                                        <div className="max-w-xs">
                                                            <p className="text-sm text-gray-900 dark:text-white" title={log.message}>
                                                                {log.message.length > 80
                                                                    ? `${log.message.substring(0, 80)}...`
                                                                    : log.message
                                                                }
                                                            </p>
                                                            {log.message.length > 80 && (
                                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                                    {t("audit_log.click_to_view_full") || "Click to view full message"}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Action Column */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <actionInfo.icon className={`w-4 h-4 ${actionInfo.color}`} />
                                                            <span className="capitalize font-medium text-gray-900 dark:text-white">{log.action}</span>
                                                        </div>
                                                    </td>

                                                    {/* Status Column */}
                                                    <td className="px-6 py-4">
                                                        <span className={`flex items-center justify-center gap-2 px-2 py-1 text-xs font-medium rounded-full ${statusInfo.bg} ${statusInfo.color}`}>
                                                            <statusInfo.icon className="w-3 h-3" />
                                                            {statusInfo.text}
                                                        </span>
                                                        <div className="text-xs text-center text-gray-900 dark:text-white">{log.duration.toFixed(2)}</div>
                                                    </td>
                                                </tr>
                                                {isExpanded && (
                                                    <tr>
                                                        <td colSpan={5} className="p-0">
                                                            <div className="bg-gray-50 dark:bg-gray-800/50 p-6 border-t border-gray-200 dark:border-gray-700">
                                                                <div className="max-w-full space-y-6">
                                                                    {/* Header with additional info */}
                                                                    <div className="flex items-center justify-between">
                                                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                                            <Info className="w-5 h-5 text-blue-500" />
                                                                            {t("audit_log.log_details") || "Log Details"}
                                                                        </h3>
                                                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                                                            <span className="flex items-center gap-1">
                                                                                <Hash className="w-4 h-4" />
                                                                                {t("audit_log.duration") || "Duration"}: {log.duration}ms
                                                                            </span>
                                                                            <span className="flex items-center gap-1">
                                                                                <Hash className="w-4 h-4" />
                                                                                ID: {log.uniqueId}
                                                                            </span>
                                                                        </div>
                                                                    </div>

                                                                    {/* Full Message */}
                                                                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-900/30">
                                                                        <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
                                                                            <MessageSquare className="w-4 h-4" />
                                                                            {t("audit_log.full_message") || "Message"}
                                                                        </h4>
                                                                        <p className="text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 p-3 rounded border font-mono leading-relaxed">
                                                                            {log.message}
                                                                        </p>
                                                                    </div>

                                                                    {/* Data sections */}
                                                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                                                        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-900/30">
                                                                            <h4 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
                                                                                <FileText className="w-4 h-4" />
                                                                                {t("audit_log.old_data") || "Old Data"}
                                                                            </h4>
                                                                            <DataDisplay data={log.oldData} />
                                                                        </div>
                                                                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-900/30">
                                                                            <h4 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-3 flex items-center gap-2">
                                                                                <Plus className="w-4 h-4" />
                                                                                {t("audit_log.new_data") || "New Data"}
                                                                            </h4>
                                                                            <DataDisplay data={log.newData} />
                                                                        </div>
                                                                        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-900/30">
                                                                            <h4 className="text-sm font-semibold text-purple-700 dark:text-purple-400 mb-3 flex items-center gap-2">
                                                                                <Zap className="w-4 h-4" />
                                                                                {t("audit_log.response_data") || "Response Data"}
                                                                            </h4>
                                                                            <DataDisplay data={log.resData} />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                    {filteredLogs.length > 0 && (
                        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                    <span>{t("audit_log.rows_per_page") || "Rows per page"}:</span>
                                    <select value={rowsPerPage} onChange={handleRowsPerPageChange} className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                                        <option value={5}>5</option>
                                        <option value={10}>10</option>
                                        <option value={25}>25</option>
                                        <option value={50}>50</option>
                                        <option value={100}>100</option>
                                    </select>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {t("audit_log.showing") || "Showing"} <span className="font-medium text-gray-700 dark:text-gray-300">{(currentPage - 1) * rowsPerPage + 1}</span>-<span className="font-medium text-gray-700 dark:text-gray-300">{Math.min(currentPage * rowsPerPage, filteredLogs.length)}</span> {t("audit_log.of") || "of"} <span className="font-medium text-gray-700 dark:text-gray-300">{filteredLogs.length}</span> {t("audit_log.logs") || "logs"}
                                </p>
                                <div className="flex gap-2">
                                    <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-gray-300">
                                        {t("audit_log.previous") || "Previous"}
                                    </button>
                                    <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-gray-300">
                                        {t("audit_log.next") || "Next"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
