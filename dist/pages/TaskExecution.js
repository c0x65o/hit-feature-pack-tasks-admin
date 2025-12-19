'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CheckCircle, XCircle, Clock, AlertCircle, ListChecks, PlayCircle, RefreshCw } from 'lucide-react';
import { useUi } from '@hit/ui-kit';
import { formatDateTime } from '@hit/sdk';
import { useTaskExecution } from '../hooks/useTasks';
export function TaskExecution({ name, id, onNavigate }) {
    const taskName = name;
    const executionId = id;
    const { Page, Card, Button, Badge, Alert, Spinner } = useUi();
    const { execution, loading, error, refresh } = useTaskExecution(taskName, executionId);
    const navigate = (path) => {
        if (onNavigate) {
            onNavigate(path);
        }
        else if (typeof window !== 'undefined') {
            window.location.href = path;
        }
    };
    if (loading) {
        return (_jsx(Page, { title: "Execution Details", children: _jsx(Spinner, {}) }));
    }
    if (error || !execution) {
        return (_jsx(Page, { title: "Execution Details", children: _jsx(Alert, { variant: "error", title: "Error loading execution", children: error?.message || 'Execution not found' }) }));
    }
    const getStatusIcon = (status) => {
        switch (status) {
            case 'success':
                return _jsx(CheckCircle, { className: "text-green-500", size: 20 });
            case 'failed':
                return _jsx(XCircle, { className: "text-red-500", size: 20 });
            case 'running':
                return _jsx(Clock, { className: "text-yellow-500", size: 20 });
            default:
                return _jsx(AlertCircle, { className: "text-gray-500", size: 20 });
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
    const breadcrumbs = [
        { label: 'Jobs', href: '/admin/tasks', icon: _jsx(ListChecks, { size: 14 }) },
        { label: taskName, href: `/admin/tasks/${encodeURIComponent(taskName)}`, icon: _jsx(PlayCircle, { size: 14 }) },
        { label: `Execution ${execution.id.slice(0, 8)}` },
    ];
    return (_jsxs(Page, { title: "Execution Details", breadcrumbs: breadcrumbs, onNavigate: navigate, actions: _jsxs(Button, { variant: "secondary", onClick: refresh, disabled: loading, children: [_jsx(RefreshCw, { size: 16, className: `mr-2 ${loading ? 'animate-spin' : ''}` }), "Refresh"] }), children: [_jsx("div", { className: "mb-6", children: _jsx(Card, { children: _jsxs("div", { className: "flex items-center gap-4", children: [getStatusIcon(execution.status), _jsxs("div", { className: "flex-1", children: [_jsxs("h3", { className: "text-lg font-semibold", children: ["Execution ", execution.id.slice(0, 8)] }), _jsxs("p", { className: "text-sm text-gray-500", children: ["Task: ", execution.task_name] })] }), _jsx("div", { className: "text-right", children: getStatusBadge(execution.status) })] }) }) }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 mb-6", children: [_jsxs(Card, { children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: "Execution Information" }), _jsxs("dl", { className: "space-y-2", children: [_jsxs("div", { children: [_jsx("dt", { className: "text-sm text-gray-500", children: "Status" }), _jsx("dd", { children: getStatusBadge(execution.status) })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-sm text-gray-500", children: "Execution Type" }), _jsx("dd", { children: _jsx(Badge, { variant: execution.execution_type === 'simple' ? 'info' : 'warning', children: execution.execution_type }) })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-sm text-gray-500", children: "Triggered By" }), _jsx("dd", { className: "text-sm", children: execution.triggered_by === 'cron' ? (_jsx(Badge, { variant: "info", children: "Cron Schedule" })) : execution.triggered_by === 'system' || execution.triggered_by === 'manual' ? (_jsx(Badge, { variant: "default", children: "Manual" })) : execution.triggered_by ? (_jsx("span", { children: execution.triggered_by })) : (_jsx(Badge, { variant: "default", children: "System" })) })] }), execution.k8s_job_name && (_jsxs("div", { children: [_jsx("dt", { className: "text-sm text-gray-500", children: "K8s Job" }), _jsx("dd", { className: "text-sm font-mono", children: execution.k8s_job_name })] }))] })] }), _jsxs(Card, { children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: "Timing" }), _jsxs("dl", { className: "space-y-2", children: [_jsxs("div", { children: [_jsx("dt", { className: "text-sm text-gray-500", children: "Started" }), _jsx("dd", { className: "text-sm", children: execution.started_at ? formatDateTime(execution.started_at) : '—' })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-sm text-gray-500", children: "Completed" }), _jsx("dd", { className: "text-sm", children: execution.completed_at ? formatDateTime(execution.completed_at) : '—' })] }), execution.duration_ms && (_jsxs("div", { children: [_jsx("dt", { className: "text-sm text-gray-500", children: "Duration" }), _jsx("dd", { className: "text-sm", children: execution.duration_ms < 1000
                                                    ? `${execution.duration_ms}ms`
                                                    : `${(execution.duration_ms / 1000).toFixed(2)}s` })] })), execution.exit_code !== null && (_jsxs("div", { children: [_jsx("dt", { className: "text-sm text-gray-500", children: "Exit Code" }), _jsx("dd", { className: "text-sm font-mono", children: execution.exit_code === 0 ? (_jsx("span", { className: "text-green-600", children: execution.exit_code })) : (_jsx("span", { className: "text-red-600", children: execution.exit_code })) })] })), execution.rows_affected !== null && (_jsxs("div", { children: [_jsx("dt", { className: "text-sm text-gray-500", children: "Rows Affected" }), _jsx("dd", { className: "text-sm", children: execution.rows_affected })] }))] })] })] }), execution.error && (_jsx("div", { className: "mb-6", children: _jsxs(Card, { children: [_jsx("h3", { className: "text-lg font-semibold mb-4 text-red-600", children: "Error" }), _jsx("pre", { className: "bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm font-mono overflow-x-auto whitespace-pre-wrap", children: _jsx("code", { children: execution.error }) })] }) })), execution.output && (_jsx("div", { className: "mb-6", children: _jsxs(Card, { children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: "Output" }), _jsx("pre", { className: "bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm font-mono overflow-x-auto whitespace-pre-wrap", children: _jsx("code", { children: execution.output }) })] }) })), execution.logs && (_jsxs(Card, { children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: "Logs" }), _jsx("pre", { className: "bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm font-mono overflow-x-auto whitespace-pre-wrap", children: _jsx("code", { children: execution.logs }) })] }))] }));
}
export default TaskExecution;
//# sourceMappingURL=TaskExecution.js.map