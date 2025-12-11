'use client';

import React from 'react';
import { PlayCircle, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useUi } from '@hit/ui-kit';
import { formatDate } from '@hit/sdk';
import { useTasks, type Task } from '../hooks/useTasks';

interface TaskListProps {
  onNavigate?: (path: string) => void;
}

export function TaskList({ onNavigate }: TaskListProps) {
  const { Page, Card, Button, Badge, DataTable, Alert, Spinner } = useUi();
  const { tasks, loading, error, refresh } = useTasks();

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
        <Button variant="primary" onClick={refresh}>
          Refresh
        </Button>
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
              render: (_, row) => getStatusBadge(row as Task),
            },
            {
              key: 'created_at',
              label: 'Created',
              sortable: true,
              render: (value) =>
                value ? formatDate(String(value)) : '—',
            },
            {
              key: 'actions',
              label: '',
              align: 'right' as const,
              sortable: false,
              hideable: false,
              render: (_, row) => {
                const task = row as Task;
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
            created_at: task.created_at,
          }))}
          emptyMessage="No tasks found"
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

