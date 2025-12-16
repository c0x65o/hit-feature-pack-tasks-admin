'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { PlayCircle, ListChecks, RefreshCw } from 'lucide-react';
import { useUi } from '@hit/ui-kit';
import { formatDateTime } from '@hit/sdk';
import { useTask, useTaskExecutions, useTaskMutations } from '../hooks/useTasks';
// Helper to get current user email from token
function getCurrentUserEmail() {
    if (typeof window === 'undefined')
        return null;
    try {
        // Try to get token from localStorage
        const token = localStorage.getItem('hit_token') || localStorage.getItem('auth_token');
        if (!token)
            return null;
        // Decode JWT token to get email
        const parts = token.split('.');
        if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            return payload.email || payload.sub || null;
        }
    }
    catch (e) {
        // Token parsing failed, try fetching from /me endpoint
    }
    return null;
}
// Helper to fetch current user from /me endpoint
async function fetchCurrentUserEmail() {
    try {
        const response = await fetch('/api/proxy/auth/me', {
            credentials: 'include',
        });
        if (response.ok) {
            const data = await response.json();
            return data.email || null;
        }
    }
    catch (e) {
        // Fallback to token parsing
    }
    return getCurrentUserEmail();
}
export function TaskDetail({ taskName, onNavigate }) {
    const { Page, Card, Button, Badge, DataTable, Alert, Spinner } = useUi();
    const { task, loading: taskLoading, error: taskError, refresh: refreshTask } = useTask(taskName);
    const { executions, total, loading: executionsLoading, refresh: refreshExecutions } = useTaskExecutions(taskName, { limit: 20 });
    const { executeTask, updateSchedule, loading: mutating } = useTaskMutations();
    const [currentUserEmail, setCurrentUserEmail] = useState(null);
    // Get current user email on mount
    useEffect(() => {
        fetchCurrentUserEmail().then(setCurrentUserEmail);
    }, []);
    const navigate = (path) => {
        if (onNavigate) {
            onNavigate(path);
        }
        else if (typeof window !== 'undefined') {
            window.location.href = path;
        }
    };
    const handleExecute = async () => {
        try {
            // Pass current user email as triggered_by, or 'manual' if not available
            const triggeredBy = currentUserEmail || 'manual';
            await executeTask(taskName, triggeredBy);
            refreshExecutions();
        }
        catch (err) {
            // Error handled by hook
        }
    };
    const handleToggleSchedule = async (enabled) => {
        try {
            await updateSchedule(taskName, enabled);
            refreshTask();
        }
        catch (err) {
            // Error handled by hook
        }
    };
    const handleRefresh = () => {
        refreshTask();
        refreshExecutions();
    };
    if (taskLoading) {
        return (_jsx(Page, { title: "Task Details", children: _jsx(Spinner, {}) }));
    }
    if (taskError || !task) {
        return (_jsx(Page, { title: "Task Details", children: _jsx(Alert, { variant: "error", title: "Error loading task", children: taskError?.message || 'Task not found' }) }));
    }
    const getStatusBadge = (status) => {
        switch (status) {
            case 'success':
                return _jsx(Badge, { variant: "success", children: "Success" });
            case 'failed':
                return _jsx(Badge, { variant: "error", children: "Failed" });
            case 'running':
                return _jsx(Badge, { variant: "warning", children: "Running" });
            case 'pending':
                return _jsx(Badge, { variant: "default", children: "Pending" });
            default:
                return _jsx(Badge, { variant: "default", children: status });
        }
    };
    const breadcrumbs = [
        { label: 'Tasks', href: '/admin/tasks', icon: _jsx(ListChecks, { size: 14 }) },
        { label: task.name },
    ];
    return (_jsxs(Page, { title: task.name, description: task.description || undefined, breadcrumbs: breadcrumbs, onNavigate: navigate, actions: _jsxs("div", { className: "flex gap-2", children: [task.cron && (_jsx(Button, { variant: task.enabled ? "secondary" : "primary", onClick: () => handleToggleSchedule(!task.enabled), loading: mutating, children: task.enabled ? 'Disable Schedule' : 'Enable Schedule' })), _jsxs(Button, { variant: "primary", onClick: handleExecute, loading: mutating, children: [_jsx(PlayCircle, { size: 16, className: "mr-2" }), "Execute Now"] }), _jsxs(Button, { variant: "secondary", onClick: handleRefresh, loading: taskLoading || executionsLoading, children: [_jsx(RefreshCw, { size: 16, className: "mr-2" }), "Refresh"] })] }), children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 mb-6", children: [_jsxs(Card, { children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: "Task Information" }), _jsxs("dl", { className: "space-y-2", children: [_jsxs("div", { children: [_jsx("dt", { className: "text-sm text-gray-500", children: "Name" }), _jsx("dd", { className: "text-sm font-medium", children: task.name })] }), task.description && (_jsxs("div", { children: [_jsx("dt", { className: "text-sm text-gray-500", children: "Description" }), _jsx("dd", { className: "text-sm", children: task.description })] })), _jsxs("div", { children: [_jsx("dt", { className: "text-sm text-gray-500", children: "Execution Type" }), _jsx("dd", { children: _jsx(Badge, { variant: task.execution_type === 'simple' ? 'info' : 'warning', children: task.execution_type }) })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-sm text-gray-500", children: "Status" }), _jsx("dd", { children: _jsx(Badge, { variant: task.enabled ? 'success' : 'default', children: task.enabled ? 'Enabled' : 'Disabled' }) })] }), task.cron && (_jsxs("div", { children: [_jsx("dt", { className: "text-sm text-gray-500", children: "Schedule" }), _jsx("dd", { className: "text-sm font-mono", children: task.cron })] })), task.service_name && (_jsxs("div", { children: [_jsx("dt", { className: "text-sm text-gray-500", children: "Service" }), _jsx("dd", { className: "text-sm", children: task.service_name })] }))] })] }), _jsxs(Card, { children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: "Configuration" }), task.sql && (_jsxs("div", { className: "mb-4", children: [_jsx("dt", { className: "text-sm text-gray-500 mb-2", children: "SQL Query" }), _jsx("pre", { className: "bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm font-mono overflow-x-auto", children: _jsx("code", { children: task.sql }) })] })), task.command && (_jsxs("div", { className: "mb-4", children: [_jsx("dt", { className: "text-sm text-gray-500 mb-2", children: "Command" }), _jsx("pre", { className: "bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm font-mono overflow-x-auto", children: _jsx("code", { children: task.command }) })] })), task.script && (_jsxs("div", { children: [_jsx("dt", { className: "text-sm text-gray-500 mb-2", children: "Script" }), _jsx("pre", { className: "bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm font-mono overflow-x-auto", children: _jsx("code", { children: task.script }) })] }))] })] }), _jsxs(Card, { children: [_jsxs("h3", { className: "text-lg font-semibold mb-4", children: ["Execution History (", total, ")"] }), _jsx(DataTable, { columns: [
                            {
                                key: 'status',
                                label: 'Status',
                                render: (value) => getStatusBadge(String(value)),
                            },
                            {
                                key: 'triggered_by',
                                label: 'Triggered By',
                                render: (value) => {
                                    const triggeredBy = value ? String(value) : 'system';
                                    // Show badge for cron vs manual vs user
                                    if (triggeredBy === 'cron') {
                                        return _jsx(Badge, { variant: "info", children: "Cron" });
                                    }
                                    else if (triggeredBy === 'system' || triggeredBy === 'manual') {
                                        return _jsx(Badge, { variant: "default", children: "Manual" });
                                    }
                                    else {
                                        return _jsx("span", { className: "text-sm", children: triggeredBy });
                                    }
                                },
                            },
                            {
                                key: 'started_at',
                                label: 'Started',
                                render: (value) => value ? formatDateTime(String(value)) : '—',
                            },
                            {
                                key: 'completed_at',
                                label: 'Completed',
                                render: (value) => value ? formatDateTime(String(value)) : '—',
                            },
                            {
                                key: 'duration_ms',
                                label: 'Duration',
                                render: (value) => {
                                    if (!value)
                                        return '—';
                                    const ms = Number(value);
                                    if (ms < 1000)
                                        return `${ms}ms`;
                                    return `${(ms / 1000).toFixed(2)}s`;
                                },
                            },
                            {
                                key: 'exit_code',
                                label: 'Exit Code',
                                render: (value) => {
                                    if (value === null || value === undefined)
                                        return '—';
                                    const code = Number(value);
                                    return (_jsx("span", { className: code === 0 ? 'text-green-600' : 'text-red-600', children: code }));
                                },
                            },
                            {
                                key: 'actions',
                                label: '',
                                align: 'right',
                                render: (_, row) => (_jsx(Button, { variant: "ghost", size: "sm", onClick: () => navigate(`/admin/tasks/${encodeURIComponent(taskName)}/executions/${row.id}`), children: "View" })),
                            },
                        ], data: executions.map((ex) => ({
                            id: ex.id,
                            status: ex.status,
                            triggered_by: ex.triggered_by,
                            started_at: ex.started_at,
                            completed_at: ex.completed_at,
                            duration_ms: ex.duration_ms,
                            exit_code: ex.exit_code,
                        })), emptyMessage: "No executions yet", loading: executionsLoading })] })] }));
}
export default TaskDetail;
//# sourceMappingURL=TaskDetail.js.map