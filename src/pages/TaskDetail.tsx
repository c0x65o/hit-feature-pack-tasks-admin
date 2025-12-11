'use client';

import React, { useState } from 'react';
import { PlayCircle, Clock, CheckCircle, XCircle, AlertCircle, Calendar } from 'lucide-react';
import { useUi } from '@hit/ui-kit';
import { formatDate } from '@hit/sdk';
import { useTask, useTaskExecutions, useTaskMutations, type Task } from '../hooks/useTasks';

interface TaskDetailProps {
  taskName: string;
  onNavigate?: (path: string) => void;
}

export function TaskDetail({ taskName, onNavigate }: TaskDetailProps) {
  const { Page, Card, Button, Badge, DataTable, Alert, Spinner, CodeBlock } = useUi();
  const { task, loading: taskLoading, error: taskError, refresh: refreshTask } = useTask(taskName);
  const { executions, total, loading: executionsLoading, refresh: refreshExecutions } = useTaskExecutions(taskName, { limit: 20 });
  const { executeTask, updateSchedule, loading: mutating } = useTaskMutations();

  const navigate = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else if (typeof window !== 'undefined') {
      window.location.href = path;
    }
  };

  const handleExecute = async () => {
    try {
      await executeTask(taskName);
      refreshExecutions();
    } catch (err) {
      // Error handled by hook
    }
  };

  const handleToggleSchedule = async (enabled: boolean) => {
    try {
      await updateSchedule(taskName, enabled);
      refreshTask();
    } catch (err) {
      // Error handled by hook
    }
  };

  if (taskLoading) {
    return (
      <Page title="Task Details">
        <Spinner />
      </Page>
    );
  }

  if (taskError || !task) {
    return (
      <Page title="Task Details">
        <Alert variant="error" title="Error loading task">
          {taskError?.message || 'Task not found'}
        </Alert>
      </Page>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="success">Success</Badge>;
      case 'failed':
        return <Badge variant="error">Failed</Badge>;
      case 'running':
        return <Badge variant="warning">Running</Badge>;
      case 'pending':
        return <Badge variant="default">Pending</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <Page
      title={task.name}
      description={task.description || undefined}
      actions={
        <div className="flex gap-2">
          {task.cron && (
            <Button
              variant={task.enabled ? "warning" : "primary"}
              onClick={() => handleToggleSchedule(!task.enabled)}
              loading={mutating}
            >
              {task.enabled ? 'Disable Schedule' : 'Enable Schedule'}
            </Button>
          )}
          <Button variant="primary" onClick={handleExecute} loading={mutating}>
            <PlayCircle size={16} className="mr-2" />
            Execute Now
          </Button>
        </div>
      }
    >
      {/* Task Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <h3 className="text-lg font-semibold mb-4">Task Information</h3>
          <dl className="space-y-2">
            <div>
              <dt className="text-sm text-gray-500">Name</dt>
              <dd className="text-sm font-medium">{task.name}</dd>
            </div>
            {task.description && (
              <div>
                <dt className="text-sm text-gray-500">Description</dt>
                <dd className="text-sm">{task.description}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm text-gray-500">Execution Type</dt>
              <dd>
                <Badge variant={task.execution_type === 'simple' ? 'info' : 'warning'}>
                  {task.execution_type}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Status</dt>
              <dd>
                <Badge variant={task.enabled ? 'success' : 'default'}>
                  {task.enabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </dd>
            </div>
            {task.cron && (
              <div>
                <dt className="text-sm text-gray-500">Schedule</dt>
                <dd className="text-sm font-mono">{task.cron}</dd>
              </div>
            )}
            {task.service_name && (
              <div>
                <dt className="text-sm text-gray-500">Service</dt>
                <dd className="text-sm">{task.service_name}</dd>
              </div>
            )}
          </dl>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold mb-4">Configuration</h3>
          {task.sql && (
            <div className="mb-4">
              <dt className="text-sm text-gray-500 mb-2">SQL Query</dt>
              <CodeBlock language="sql">{task.sql}</CodeBlock>
            </div>
          )}
          {task.command && (
            <div className="mb-4">
              <dt className="text-sm text-gray-500 mb-2">Command</dt>
              <CodeBlock>{task.command}</CodeBlock>
            </div>
          )}
          {task.script && (
            <div>
              <dt className="text-sm text-gray-500 mb-2">Script</dt>
              <CodeBlock>{task.script}</CodeBlock>
            </div>
          )}
        </Card>
      </div>

      {/* Execution History */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">Execution History ({total})</h3>
        <DataTable
          columns={[
            {
              key: 'status',
              label: 'Status',
              render: (value) => getStatusBadge(String(value)),
            },
            {
              key: 'triggered_by',
              label: 'Triggered By',
              render: (value) => value || 'system',
            },
            {
              key: 'started_at',
              label: 'Started',
              render: (value) => value ? formatDate(String(value)) : '—',
            },
            {
              key: 'completed_at',
              label: 'Completed',
              render: (value) => value ? formatDate(String(value)) : '—',
            },
            {
              key: 'duration_ms',
              label: 'Duration',
              render: (value) => {
                if (!value) return '—';
                const ms = Number(value);
                if (ms < 1000) return `${ms}ms`;
                return `${(ms / 1000).toFixed(2)}s`;
              },
            },
            {
              key: 'actions',
              label: '',
              align: 'right' as const,
              render: (_, row) => (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    navigate(`/admin/tasks/${encodeURIComponent(taskName)}/executions/${row.id}`)
                  }
                >
                  View
                </Button>
              ),
            },
          ]}
          data={executions.map((ex) => ({
            id: ex.id,
            status: ex.status,
            triggered_by: ex.triggered_by,
            started_at: ex.started_at,
            completed_at: ex.completed_at,
            duration_ms: ex.duration_ms,
          }))}
          emptyMessage="No executions yet"
          loading={executionsLoading}
        />
      </Card>
    </Page>
  );
}

export default TaskDetail;

