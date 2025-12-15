'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { PlayCircle, Clock } from 'lucide-react';
import { useUi } from '@hit/ui-kit';
import { formatRelativeTime } from '@hit/sdk';
import { useTasks, useSchedules } from '../hooks/useTasks';
export function TaskList({ onNavigate }) {
    const { Page, Card, Button, Badge, DataTable, Alert, Spinner } = useUi();
    const { tasks, loading, error, refresh } = useTasks();
    const { schedules } = useSchedules();
    // Create a map of task name to last_run time from schedules
    const lastRunMap = new Map();
    schedules.forEach((schedule) => {
        lastRunMap.set(schedule.task_name, schedule.last_run);
    });
    const navigate = (path) => {
        if (onNavigate) {
            onNavigate(path);
        }
        else if (typeof window !== 'undefined') {
            window.location.href = path;
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
    return (_jsxs(Page, { title: "Tasks", description: "Manage and monitor task executions", actions: _jsx("div", { className: "flex gap-2", children: _jsx(Button, { variant: "primary", onClick: refresh, children: "Refresh" }) }), children: [error && (_jsx(Alert, { variant: "error", title: "Error loading tasks", children: error.message })), _jsx(Card, { children: _jsx(DataTable, { columns: [
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
                                return (_jsx("div", { className: "flex items-center justify-end gap-2", children: _jsx(Button, { variant: "ghost", size: "sm", onClick: () => navigate(`/admin/tasks/${encodeURIComponent(task.name)}`), children: "View" }) }));
                            },
                        },
                    ], data: tasks.map((task) => ({
                        name: task.name,
                        description: task.description,
                        execution_type: task.execution_type,
                        cron: task.cron,
                        enabled: task.enabled,
                        last_run: lastRunMap.get(task.name) || null,
                    })), emptyMessage: "No tasks found. Tasks are automatically loaded from hit.yaml. Make sure tasks are defined in your hit.yaml file.", loading: loading, searchable: true, exportable: true, showColumnVisibility: true }) })] }));
}
export default TaskList;
//# sourceMappingURL=TaskList.js.map