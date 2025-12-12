'use client';

import React, { useState } from 'react';
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
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState(false);

  const navigate = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else if (typeof window !== 'undefined') {
      window.location.href = path;
    }
  };

  const handleSyncTasks = async () => {
    try {
      setSyncing(true);
      setSyncError(null);
      setSyncSuccess(false);
      
      const tasksUrl = typeof window !== 'undefined' 
        ? (window as unknown as Record<string, string>).NEXT_PUBLIC_HIT_TASKS_URL || '/api/proxy/tasks'
        : '/api/proxy/tasks';
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('hit_token') : null;
      
      // Try to get project slug from URL or use a default approach
      let projectSlug: string | null = null;
      if (typeof window !== 'undefined') {
        const pathMatch = window.location.pathname.match(/\/projects\/([^\/]+)/);
        if (pathMatch) {
          projectSlug = pathMatch[1];
        }
      }
      
      // Try to fetch manifest from CAC API first
      let tasks: Record<string, any> = {};
      let response: Response | null = null;
      
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
        } catch (e) {
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
      } else {
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
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Failed to sync tasks. Make sure tasks are defined in hit.yaml and the project has been deployed.');
    } finally {
      setSyncing(false);
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
          <Button variant="secondary" onClick={handleSyncTasks} loading={syncing}>
            Sync Tasks
          </Button>
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

      {syncError && (
        <Alert variant="error" title="Sync failed" onClose={() => setSyncError(null)}>
          {syncError}
        </Alert>
      )}

      {syncSuccess && (
        <Alert variant="success" title="Tasks synced successfully" onClose={() => setSyncSuccess(false)}>
          Tasks have been synced from hit.yaml. You may need to refresh to see them.
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
            created_at: task.created_at,
          }))}
          emptyMessage="No tasks found. Tasks are synced from hit.yaml during deployment. Click 'Sync Tasks' to manually sync them now."
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

