'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { CirclePlay, Clock, Play } from 'lucide-react';
import { useUi } from '@hit/ui-kit';
import { formatRelativeTime } from '@hit/sdk';
import { useTasks, useTaskMutations } from '../hooks/useTasks';
// Helper to get current user email from token
function getCurrentUserEmail() {
    if (typeof window === 'undefined')
        return null;
    try {
        const token = localStorage.getItem('hit_token') || localStorage.getItem('auth_token');
        if (!token)
            return null;
        const parts = token.split('.');
        if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            return payload.email || payload.sub || null;
        }
    }
    catch (e) {
        // Token parsing failed
    }
    return null;
}
// Helper to fetch current user from /me endpoint
async function fetchCurrentUserEmail() {
    try {
        const response = await fetch('/api/auth/me', {
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
export function TaskList({ onNavigate }) {
    const { Page, Card, Button, Badge, DataTable, Alert } = useUi();
    const { tasks, loading, error, refresh } = useTasks();
    const { executeTask, loading: executing, error: mutationError } = useTaskMutations();
    const [currentUserEmail, setCurrentUserEmail] = useState(null);
    const [executingTask, setExecutingTask] = useState(null);
    // Tasks now include schedule info (last_run, next_run, etc.) directly
    // No need for separate schedules endpoint
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
    const handleExecute = async (taskName) => {
        try {
            setExecutingTask(taskName);
            const triggeredBy = currentUserEmail || 'manual';
            await executeTask(taskName, triggeredBy);
            // Refresh the task list to update last_run times
            refresh();
        }
        catch (err) {
            // Error handled by hook
        }
        finally {
            setExecutingTask(null);
        }
    };
    const getStatusBadge = (task) => {
        if (!task.enabled) {
            return _jsx(Badge, { variant: "default", children: "Disabled" });
        }
        return _jsx(Badge, { variant: "success", children: "Enabled" });
    };
    const getExecutionTypeBadge = (executionType) => {
        if (executionType === 'simple') {
            return _jsx(Badge, { variant: "info", children: "Simple" });
        }
        return _jsx(Badge, { variant: "warning", children: "Complex" });
    };
    return (_jsxs(Page, { title: "Jobs", description: "Manage and monitor job executions", actions: _jsx("div", { className: "flex gap-2", children: _jsx(Button, { variant: "primary", onClick: refresh, children: "Refresh" }) }), children: [error && (_jsx(Alert, { variant: "error", title: "Error loading jobs", children: error.message })), mutationError && (_jsx(Alert, { variant: "error", title: "Error running job", children: mutationError.message })), _jsx(Card, { children: _jsx(DataTable, { columns: [
                        {
                            key: 'name',
                            label: 'Name',
                            sortable: true,
                            render: (_, row) => (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(CirclePlay, { size: 16, className: "text-gray-500" }), _jsx("span", { className: "font-medium", children: String(row?.name) })] })),
                        },
                        {
                            key: 'description',
                            label: 'Description',
                            render: (value) => (_jsx("span", { className: "text-gray-600 dark:text-gray-400", children: value ? String(value) : '—' })),
                        },
                        {
                            key: 'execution_type',
                            label: 'Type',
                            render: (value) => getExecutionTypeBadge(String(value)),
                        },
                        {
                            key: 'cron',
                            label: 'Schedule',
                            render: (value) => (_jsx("div", { className: "flex items-center gap-2", children: value ? (_jsxs(_Fragment, { children: [_jsx(Clock, { size: 14, className: "text-gray-500" }), _jsx("span", { className: "text-sm font-mono", children: String(value) })] })) : (_jsx("span", { className: "text-gray-400", children: "Manual" })) })),
                        },
                        {
                            key: 'enabled',
                            label: 'Status',
                            render: (_, row) => getStatusBadge(row),
                        },
                        {
                            key: 'last_run',
                            label: 'Last Run',
                            sortable: true,
                            render: (value) => value ? formatRelativeTime(String(value)) : '—',
                        },
                        {
                            key: 'actions',
                            label: '',
                            align: 'right',
                            sortable: false,
                            hideable: false,
                            render: (_, row) => {
                                const task = row;
                                const isExecuting = executingTask === task.name;
                                return (_jsxs("div", { className: "flex items-center justify-end gap-2", children: [_jsxs(Button, { variant: "primary", size: "sm", onClick: () => handleExecute(task.name), disabled: isExecuting || executing, loading: isExecuting, children: [_jsx(Play, { size: 14, className: "mr-1" }), "Run"] }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => navigate(`/admin/jobs/${encodeURIComponent(task.name)}`), children: "View" })] }));
                            },
                        },
                    ], data: tasks.map((task) => ({
                        name: task.name,
                        description: task.description,
                        execution_type: task.execution_type,
                        cron: task.cron,
                        enabled: task.enabled,
                        last_run: task.last_run || null, // Schedule info now in task
                    })), emptyMessage: "No jobs found. Jobs are automatically loaded from hit.yaml. Make sure jobs are defined in your hit.yaml file.", loading: loading, searchable: true, exportable: true, showColumnVisibility: true, tableId: "admin.tasks", onRefresh: refresh, refreshing: loading, searchDebounceMs: 400 }) })] }));
}
export default TaskList;
//# sourceMappingURL=TaskList.js.map