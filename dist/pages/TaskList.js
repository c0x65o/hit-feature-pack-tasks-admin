'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { PlayCircle, Clock } from 'lucide-react';
import { useUi } from '@hit/ui-kit';
import { formatDate } from '@hit/sdk';
import { useTasks } from '../hooks/useTasks';
export function TaskList({ onNavigate }) {
    const { Page, Card, Button, Badge, DataTable, Alert, Spinner } = useUi();
    const { tasks, loading, error, refresh } = useTasks();
    const [syncing, setSyncing] = useState(false);
    const [syncError, setSyncError] = useState(null);
    const [syncSuccess, setSyncSuccess] = useState(false);
    const navigate = (path) => {
        if (onNavigate) {
            onNavigate(path);
        }
        else if (typeof window !== 'undefined') {
            window.location.href = path;
        }
    };
    const handleSyncTasks = async () => {
        try {
            setSyncing(true);
            setSyncError(null);
            setSyncSuccess(false);
            const tasksUrl = typeof window !== 'undefined'
                ? window.NEXT_PUBLIC_HIT_TASKS_URL || '/api/proxy/tasks'
                : '/api/proxy/tasks';
            const token = typeof window !== 'undefined' ? localStorage.getItem('hit_token') : null;
            // Try to get project slug from URL or use a default approach
            let projectSlug = null;
            if (typeof window !== 'undefined') {
                const pathMatch = window.location.pathname.match(/\/projects\/([^\/]+)/);
                if (pathMatch) {
                    projectSlug = pathMatch[1];
                }
            }
            // Try to fetch manifest from CAC API first
            let tasks = {};
            let response = null;
            if (projectSlug) {
                try {
                    // Fetch manifest from CAC
                    const cacResponse = await fetch(`/api/projects/${projectSlug}/manifest`, {
                        headers: {
                            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                        },
                        credentials: 'include',
                    });
                    if (cacResponse.ok) {
                        const manifestData = await cacResponse.json();
                        tasks = manifestData.manifest?.tasks || {};
                    }
                }
                catch (e) {
                    console.warn('Failed to fetch manifest from CAC:', e);
                }
            }
            // If we have tasks, use the regular sync endpoint
            if (Object.keys(tasks).length > 0) {
                response = await fetch(`${tasksUrl}/hit/tasks/sync`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                    },
                    credentials: 'include',
                    body: JSON.stringify({ tasks }),
                });
            }
            else {
                // Fallback: try sync-from-manifest (might work if config has tasks)
                response = await fetch(`${tasksUrl}/hit/tasks/sync-from-manifest`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                    },
                    credentials: 'include',
                });
            }
            if (!response || !response.ok) {
                const errorBody = await response?.json().catch(() => ({ detail: response?.statusText || 'Unknown error' }));
                throw new Error(errorBody.detail || errorBody.message || `Sync failed: ${response?.status || 'Unknown'}`);
            }
            const result = await response.json();
            setSyncSuccess(true);
            // Refresh task list
            await refresh();
            // Clear success message after 3 seconds
            setTimeout(() => setSyncSuccess(false), 3000);
        }
        catch (err) {
            setSyncError(err instanceof Error ? err.message : 'Failed to sync tasks. Make sure tasks are defined in hit.yaml and the project has been deployed.');
        }
        finally {
            setSyncing(false);
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
    return (_jsxs(Page, { title: "Tasks", description: "Manage and monitor task executions", actions: _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: "secondary", onClick: handleSyncTasks, loading: syncing, children: "Sync Tasks" }), _jsx(Button, { variant: "primary", onClick: refresh, children: "Refresh" })] }), children: [error && (_jsx(Alert, { variant: "error", title: "Error loading tasks", children: error.message })), syncError && (_jsx(Alert, { variant: "error", title: "Sync failed", onClose: () => setSyncError(null), children: syncError })), syncSuccess && (_jsx(Alert, { variant: "success", title: "Tasks synced successfully", onClose: () => setSyncSuccess(false), children: "Tasks have been synced from hit.yaml. You may need to refresh to see them." })), _jsx(Card, { children: _jsx(DataTable, { columns: [
                        {
                            key: 'name',
                            label: 'Name',
                            sortable: true,
                            render: (_, row) => (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(PlayCircle, { size: 16, className: "text-gray-500" }), _jsx("span", { className: "font-medium", children: String(row.name) })] })),
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
                            key: 'created_at',
                            label: 'Created',
                            sortable: true,
                            render: (value) => value ? formatDate(String(value)) : '—',
                        },
                        {
                            key: 'actions',
                            label: '',
                            align: 'right',
                            sortable: false,
                            hideable: false,
                            render: (_, row) => {
                                const task = row;
                                return (_jsx("div", { className: "flex items-center justify-end gap-2", children: _jsx(Button, { variant: "ghost", size: "sm", onClick: () => navigate(`/admin/tasks/${encodeURIComponent(task.name)}`), children: "View" }) }));
                            },
                        },
                    ], data: tasks.map((task) => ({
                        name: task.name,
                        description: task.description,
                        execution_type: task.execution_type,
                        cron: task.cron,
                        enabled: task.enabled,
                        created_at: task.created_at,
                    })), emptyMessage: "No tasks found. Tasks are synced from hit.yaml during deployment. Click 'Sync Tasks' to manually sync them now.", loading: loading, searchable: true, exportable: true, showColumnVisibility: true }) })] }));
}
export default TaskList;
//# sourceMappingURL=TaskList.js.map