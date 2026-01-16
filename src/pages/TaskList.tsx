'use client';

import React, { useState, useEffect } from 'react';
import { CirclePlay, Clock, Play } from 'lucide-react';
import { useUi } from '@hit/ui-kit';
import { formatRelativeTime } from '@hit/sdk';
import { useTasks, useTaskMutations, type Task } from '../hooks/useTasks';

interface TaskListProps {
  onNavigate?: (path: string) => void;
}

// Helper to get current user email from token
function getCurrentUserEmail(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const token = localStorage.getItem('hit_token') || localStorage.getItem('auth_token');
    if (!token) return null;
    
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      return payload.email || payload.sub || null;
    }
  } catch (e) {
    // Token parsing failed
  }
  
  return null;
}

// Helper to fetch current user from /me endpoint
async function fetchCurrentUserEmail(): Promise<string | null> {
  try {
    const response = await fetch('/api/auth/me', {
      credentials: 'include',
    });
    if (response.ok) {
      const data = await response.json();
      return data.email || null;
    }
  } catch (e) {
    // Fallback to token parsing
  }
  
  return getCurrentUserEmail();
}

export function TaskList({ onNavigate }: TaskListProps) {
  const { Page, Card, Button, Badge, DataTable, Alert } = useUi();
  const { tasks, loading, error, refresh } = useTasks();
  const { executeTask, loading: executing, error: mutationError } = useTaskMutations();
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [executingTask, setExecutingTask] = useState<string | null>(null);
  
  // Tasks now include schedule info (last_run, next_run, etc.) directly
  // No need for separate schedules endpoint

  // Get current user email on mount
  useEffect(() => {
    fetchCurrentUserEmail().then(setCurrentUserEmail);
  }, []);

  const navigate = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else if (typeof window !== 'undefined') {
      window.location.href = path;
    }
  };

  const handleExecute = async (taskName: string) => {
    try {
      setExecutingTask(taskName);
      const triggeredBy = currentUserEmail || 'manual';
      await executeTask(taskName, triggeredBy);
      // Refresh the task list to update last_run times
      refresh();
    } catch (err) {
      // Error handled by hook
    } finally {
      setExecutingTask(null);
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
      title="Jobs"
      description="Manage and monitor job executions"
      actions={
        <div className="flex gap-2">
          <Button variant="primary" onClick={refresh}>
            Refresh
          </Button>
        </div>
      }
    >
      {error && (
        <Alert variant="error" title="Error loading jobs">
          {error.message}
        </Alert>
      )}
      {mutationError && (
        <Alert variant="error" title="Error running job">
          {mutationError.message}
        </Alert>
      )}

      <Card>
        <DataTable
          columns={[
            {
              key: 'name',
              label: 'Name',
              sortable: true,
              render: (_: unknown, row?: Record<string, unknown>) => (
                <div className="flex items-center gap-2">
                  <CirclePlay size={16} className="text-gray-500" />
                  <span className="font-medium">{String(row?.name)}</span>
                </div>
              ),
            },
            {
              key: 'description',
              label: 'Description',
              render: (value: unknown) => (
                <span className="text-gray-600 dark:text-gray-400">
                  {value ? String(value) : '—'}
                </span>
              ),
            },
            {
              key: 'execution_type',
              label: 'Type',
              render: (value: unknown) => getExecutionTypeBadge(String(value)),
            },
            {
              key: 'cron',
              label: 'Schedule',
              render: (value: unknown) => (
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
              render: (_: unknown, row?: Record<string, unknown>) => getStatusBadge(row as unknown as Task),
            },
            {
              key: 'last_run',
              label: 'Last Run',
              sortable: true,
              render: (value: unknown) =>
                value ? formatRelativeTime(String(value)) : '—',
            },
            {
              key: 'actions',
              label: '',
              align: 'right' as const,
              sortable: false,
              hideable: false,
              render: (_: unknown, row?: Record<string, unknown>) => {
                const task = row as unknown as Task;
                const isExecuting = executingTask === task.name;
                return (
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleExecute(task.name)}
                      disabled={isExecuting || executing}
                      loading={isExecuting}
                    >
                      <Play size={14} className="mr-1" />
                      Run
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/admin/jobs/${encodeURIComponent(task.name)}`)}
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
            last_run: task.last_run || null, // Schedule info now in task
          }))}
          emptyMessage="No jobs found. Jobs are automatically loaded from hit.yaml. Make sure jobs are defined in your hit.yaml file."
          loading={loading}
          searchable
          exportable
          showColumnVisibility
          tableId="admin.tasks"
          onRefresh={refresh}
          refreshing={loading}
          searchDebounceMs={400}
        />
      </Card>
    </Page>
  );
}

export default TaskList;

