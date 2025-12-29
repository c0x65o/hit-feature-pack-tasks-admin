'use client';

import React, { useState } from 'react';
import { CirclePlay, Clock, CheckCircle, XCircle, AlertCircle, History, Filter } from 'lucide-react';
import { useUi } from '@hit/ui-kit';
import { formatDateTime, formatRelativeTime } from '@hit/sdk';
import { useAllExecutions, type TaskExecution } from '../hooks/useTasks';

interface AllExecutionsProps {
  onNavigate?: (path: string) => void;
}

export function AllExecutions({ onNavigate }: AllExecutionsProps) {
  const { Page, Card, Button, Badge, DataTable, Alert, Select } = useUi();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const { executions, total, loading, error, refresh } = useAllExecutions({
    limit: 50,
    status: statusFilter || undefined,
  });

  const navigate = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else if (typeof window !== 'undefined') {
      window.location.href = path;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="text-green-500" size={16} />;
      case 'failed':
        return <XCircle className="text-red-500" size={16} />;
      case 'running':
        return <Clock className="text-yellow-500 animate-spin" size={16} />;
      case 'pending':
        return <Clock className="text-gray-500" size={16} />;
      default:
        return <AlertCircle className="text-gray-500" size={16} />;
    }
  };

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

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'success', label: 'Success' },
    { value: 'failed', label: 'Failed' },
    { value: 'running', label: 'Running' },
    { value: 'pending', label: 'Pending' },
  ];

  return (
    <Page
      title="Ran Jobs"
      description="View all job execution history"
      actions={
        <div className="flex gap-2 items-center">
          <Select
            value={statusFilter}
            onChange={(value: string) => setStatusFilter(value)}
            options={statusOptions}
            style={{ marginBottom: 0 }}
          />
          <Button variant="primary" onClick={refresh}>
            Refresh
          </Button>
        </div>
      }
    >
      {error && (
        <Alert variant="error" title="Error loading executions">
          {error.message}
        </Alert>
      )}

      <Card>
        <DataTable
          columns={[
            {
              key: 'status',
              label: 'Status',
              render: (value: unknown) => (
                <div className="flex items-center gap-2">
                  {getStatusIcon(String(value))}
                  {getStatusBadge(String(value))}
                </div>
              ),
            },
            {
              key: 'task_name',
              label: 'Job Name',
              sortable: true,
              render: (value: unknown, row?: Record<string, unknown>) => (
                <span
                  role="button"
                  tabIndex={0}
                  style={{ cursor: 'pointer' }}
                  className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  onClick={() => navigate(`/admin/tasks/${encodeURIComponent(String(value))}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      navigate(`/admin/tasks/${encodeURIComponent(String(value))}`);
                    }
                  }}
                >
                  {String(value)}
                </span>
              ),
            },
            {
              key: 'triggered_by',
              label: 'Triggered By',
              render: (value: unknown) => {
                const triggeredBy = value ? String(value) : 'system';
                if (triggeredBy === 'cron') {
                  return <Badge variant="info">Cron</Badge>;
                } else if (triggeredBy === 'system' || triggeredBy === 'manual') {
                  return <Badge variant="default">Manual</Badge>;
                } else {
                  return <span className="text-sm">{triggeredBy}</span>;
                }
              },
            },
            {
              key: 'started_at',
              label: 'Started',
              sortable: true,
              render: (value: unknown) => (
                <div className="text-sm">
                  {value ? (
                    <>
                      <div>{formatDateTime(String(value))}</div>
                      <div className="text-gray-500 text-xs">{formatRelativeTime(String(value))}</div>
                    </>
                  ) : (
                    '—'
                  )}
                </div>
              ),
            },
            {
              key: 'completed_at',
              label: 'Completed',
              render: (value: unknown) => value ? formatDateTime(String(value)) : '—',
            },
            {
              key: 'duration_ms',
              label: 'Duration',
              render: (value: unknown) => {
                if (!value) return '—';
                const ms = Number(value);
                if (ms < 1000) return `${ms}ms`;
                if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
                return `${(ms / 60000).toFixed(2)}m`;
              },
            },
            {
              key: 'exit_code',
              label: 'Exit',
              render: (value: unknown) => {
                if (value === null || value === undefined) return '—';
                const code = Number(value);
                return (
                  <span className={`font-mono ${code === 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {code}
                  </span>
                );
              },
            },
            {
              key: 'actions',
              label: '',
              align: 'right' as const,
              sortable: false,
              hideable: false,
              render: (_: unknown, row?: Record<string, unknown>) => {
                const execution = row as unknown as TaskExecution;
                return (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      navigate(`/admin/tasks/${encodeURIComponent(execution.task_name)}/executions/${execution.id}`)
                    }
                  >
                    View
                  </Button>
                );
              },
            },
          ]}
          data={executions.map((ex) => ({
            id: ex.id,
            status: ex.status,
            task_name: ex.task_name,
            triggered_by: ex.triggered_by,
            started_at: ex.started_at,
            completed_at: ex.completed_at,
            duration_ms: ex.duration_ms,
            exit_code: ex.exit_code,
          }))}
          emptyMessage="No job executions found. Jobs will appear here after they run."
          loading={loading}
          searchable
          exportable
          showColumnVisibility
        />
        {total > 0 && (
          <div className="mt-4 text-sm text-gray-500">
            Showing {executions.length} of {total} executions
          </div>
        )}
      </Card>
    </Page>
  );
}

export default AllExecutions;

