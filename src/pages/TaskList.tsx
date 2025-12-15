'use client';

import React from 'react';
import { PlayCircle, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useUi } from '@hit/ui-kit';
import { formatRelativeTime } from '@hit/sdk';
import { useTasks, useSchedules, type Task } from '../hooks/useTasks';

interface TaskListProps {
  onNavigate?: (path: string) => void;
}

export function TaskList({ onNavigate }: TaskListProps) {
  const { Page, Card, Button, Badge, DataTable, Alert, Spinner } = useUi();
  const { tasks, loading, error, refresh } = useTasks();
  const { schedules } = useSchedules();
  
  // Create a map of task name to last_run time from schedules
  const lastRunMap = new Map<string, string | null>();
  schedules.forEach((schedule) => {
    lastRunMap.set(schedule.task_name, schedule.last_run);
  });

  const navigate = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else if (typeof window !== 'undefined') {
      window.location.href = path;
    }
  };


  const getStatusBadge = (task: Task) => {
    if (!task.enabled) {
      return <Badge variant="default">Disabled</Badge>;
    }
    return <Badge variant="success">Enabled</Badge>;
  };

  const getExecutionTypeBadge = (executionType: string) => {
    if (executionType === 'simple') {
      return <Badge variant="info">Simple</Badge>;
    }
    return <Badge variant="warning">Complex</Badge>;
  };

  return (
    <Page
      title="Tasks"
      description="Manage and monitor task executions"
      actions={
        <div className="flex gap-2">
          <Button variant="primary" onClick={refresh}>
            Refresh
          </Button>
        </div>
      }
    >
      {error && (
        <Alert variant="error" title="Error loading tasks">
          {error.message}
        </Alert>
      )}

      <Card>
        <DataTable
          columns={[
            {
              key: 'name',
              label: 'Name',
              sortable: true,
              render: (_, row) => (
                <div className="flex items-center gap-2">
                  <PlayCircle size={16} className="text-gray-500" />
                  <span className="font-medium">{String(row.name)}</span>
                </div>
              ),
            },
            {
              key: 'description',
              label: 'Description',
              render: (value) => (
                <span className="text-gray-600 dark:text-gray-400">
                  {value ? String(value) : '—'}
                </span>
              ),
            },
            {
              key: 'execution_type',
              label: 'Type',
              render: (value) => getExecutionTypeBadge(String(value)),
            },
            {
              key: 'cron',
              label: 'Schedule',
              render: (value) => (
                <div className="flex items-center gap-2">
                  {value ? (
                    <>
                      <Clock size={14} className="text-gray-500" />
                      <span className="text-sm font-mono">{String(value)}</span>
                    </>
                  ) : (
                    <span className="text-gray-400">Manual</span>
                  )}
                </div>
              ),
            },
            {
              key: 'enabled',
              label: 'Status',
              render: (_, row) => getStatusBadge(row as unknown as Task),
            },
            {
              key: 'created_at',
              label: 'Last Run',
              sortable: true,
              render: (value) =>
                value ? formatRelativeTime(String(value)) : '—',
            },
            {
              key: 'actions',
              label: '',
              align: 'right' as const,
              sortable: false,
              hideable: false,
              render: (_, row) => {
                const task = row as unknown as Task;
                return (
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/admin/tasks/${encodeURIComponent(task.name)}`)}
                    >
                      View
                    </Button>
                  </div>
                );
              },
            },
          ]}
          data={tasks.map((task) => ({
            name: task.name,
            description: task.description,
            execution_type: task.execution_type,
            cron: task.cron,
            enabled: task.enabled,
            last_run: lastRunMap.get(task.name) || null,
          }))}
          emptyMessage="No tasks found. Tasks are automatically loaded from hit.yaml. Make sure tasks are defined in your hit.yaml file."
          loading={loading}
          searchable
          exportable
          showColumnVisibility
        />
      </Card>
    </Page>
  );
}

export default TaskList;

