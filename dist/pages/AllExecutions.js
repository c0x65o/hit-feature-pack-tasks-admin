'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useUi } from '@hit/ui-kit';
import { formatDateTime, formatRelativeTime } from '@hit/sdk';
import { useAllExecutions } from '../hooks/useTasks';
export function AllExecutions({ onNavigate }) {
    const { Page, Card, Button, Badge, DataTable, Alert, Select } = useUi();
    const [statusFilter, setStatusFilter] = useState('');
    const { executions, total, loading, error, refresh } = useAllExecutions({
        limit: 50,
        status: statusFilter || undefined,
    });
    const navigate = (path) => {
        if (onNavigate) {
            onNavigate(path);
        }
        else if (typeof window !== 'undefined') {
            window.location.href = path;
        }
    };
    const getStatusIcon = (status) => {
        switch (status) {
            case 'success':
                return _jsx(CheckCircle, { className: "text-green-500", size: 16 });
            case 'failed':
                return _jsx(XCircle, { className: "text-red-500", size: 16 });
            case 'running':
                return _jsx(Clock, { className: "text-yellow-500 animate-spin", size: 16 });
            case 'pending':
                return _jsx(Clock, { className: "text-gray-500", size: 16 });
            default:
                return _jsx(AlertCircle, { className: "text-gray-500", size: 16 });
        }
    };
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
    const statusOptions = [
        { value: '', label: 'All Statuses' },
        { value: 'success', label: 'Success' },
        { value: 'failed', label: 'Failed' },
        { value: 'running', label: 'Running' },
        { value: 'pending', label: 'Pending' },
    ];
    return (_jsxs(Page, { title: "Ran Jobs", description: "View all job execution history", actions: _jsxs("div", { className: "flex gap-2 items-center", children: [_jsx(Select, { value: statusFilter, onChange: (value) => setStatusFilter(value), options: statusOptions, style: { marginBottom: 0 } }), _jsx(Button, { variant: "primary", onClick: refresh, children: "Refresh" })] }), children: [error && (_jsx(Alert, { variant: "error", title: "Error loading executions", children: error.message })), _jsxs(Card, { children: [_jsx(DataTable, { columns: [
                            {
                                key: 'status',
                                label: 'Status',
                                render: (value) => (_jsxs("div", { className: "flex items-center gap-2", children: [getStatusIcon(String(value)), getStatusBadge(String(value))] })),
                            },
                            {
                                key: 'task_name',
                                label: 'Job Name',
                                sortable: true,
                                render: (value, row) => (_jsx("span", { role: "button", tabIndex: 0, style: { cursor: 'pointer' }, className: "font-medium text-blue-600 dark:text-blue-400 hover:underline", onClick: () => navigate(`/admin/tasks/${encodeURIComponent(String(value))}`), onKeyDown: (e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            navigate(`/admin/tasks/${encodeURIComponent(String(value))}`);
                                        }
                                    }, children: String(value) })),
                            },
                            {
                                key: 'triggered_by',
                                label: 'Triggered By',
                                render: (value) => {
                                    const triggeredBy = value ? String(value) : 'system';
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
                                sortable: true,
                                render: (value) => (_jsx("div", { className: "text-sm", children: value ? (_jsxs(_Fragment, { children: [_jsx("div", { children: formatDateTime(String(value)) }), _jsx("div", { className: "text-gray-500 text-xs", children: formatRelativeTime(String(value)) })] })) : ('—') })),
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
                                    if (ms < 60000)
                                        return `${(ms / 1000).toFixed(2)}s`;
                                    return `${(ms / 60000).toFixed(2)}m`;
                                },
                            },
                            {
                                key: 'exit_code',
                                label: 'Exit',
                                render: (value) => {
                                    if (value === null || value === undefined)
                                        return '—';
                                    const code = Number(value);
                                    return (_jsx("span", { className: `font-mono ${code === 0 ? 'text-green-600' : 'text-red-600'}`, children: code }));
                                },
                            },
                            {
                                key: 'actions',
                                label: '',
                                align: 'right',
                                sortable: false,
                                hideable: false,
                                render: (_, row) => {
                                    const execution = row;
                                    return (_jsx(Button, { variant: "ghost", size: "sm", onClick: () => navigate(`/admin/tasks/${encodeURIComponent(execution.task_name)}/executions/${execution.id}`), children: "View" }));
                                },
                            },
                        ], data: executions.map((ex) => ({
                            id: ex.id,
                            status: ex.status,
                            task_name: ex.task_name,
                            triggered_by: ex.triggered_by,
                            started_at: ex.started_at,
                            completed_at: ex.completed_at,
                            duration_ms: ex.duration_ms,
                            exit_code: ex.exit_code,
                        })), emptyMessage: "No job executions found. Jobs will appear here after they run.", loading: loading, searchable: true, exportable: true, showColumnVisibility: true }), total > 0 && (_jsxs("div", { className: "mt-4 text-sm text-gray-500", children: ["Showing ", executions.length, " of ", total, " executions"] }))] })] }));
}
export default AllExecutions;
//# sourceMappingURL=AllExecutions.js.map