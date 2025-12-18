'use client';

import React from 'react';
import { ArrowLeft, CheckCircle, XCircle, Clock, AlertCircle, ListChecks, PlayCircle } from 'lucide-react';
import { useUi, type BreadcrumbItem } from '@hit/ui-kit';
import { formatDateTime } from '@hit/sdk';
import { useTaskExecution, type TaskExecution as TaskExecutionType } from '../hooks/useTasks';

interface TaskExecutionProps {
  taskName: string;
  executionId: string;
  onNavigate?: (path: string) => void;
}

export function TaskExecution({ taskName, executionId, onNavigate }: TaskExecutionProps) {
  const { Page, Card, Button, Badge, Alert, Spinner } = useUi();
  const { execution, loading, error, refresh } = useTaskExecution(taskName, executionId);

  const navigate = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else if (typeof window !== 'undefined') {
      window.location.href = path;
    }
  };

  if (loading) {
    return (
      <Page title="Execution Details">
        <Spinner />
      </Page>
    );
  }

  if (error || !execution) {
    return (
      <Page title="Execution Details">
        <Alert variant="error" title="Error loading execution">
          {error?.message || 'Execution not found'}
        </Alert>
      </Page>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'failed':
        return <XCircle className="text-red-500" size={20} />;
      case 'running':
        return <Clock className="text-yellow-500" size={20} />;
      default:
        return <AlertCircle className="text-gray-500" size={20} />;
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

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Jobs', href: '/admin/tasks', icon: <ListChecks size={14} /> },
    { label: taskName, href: `/admin/tasks/${encodeURIComponent(taskName)}`, icon: <PlayCircle size={14} /> },
    { label: `Execution ${execution.id.slice(0, 8)}` },
  ];

  return (
    <Page
      title="Execution Details"
      breadcrumbs={breadcrumbs}
      onNavigate={navigate}
    >
      {/* Status Card */}
      <div className="mb-6">
        <Card>
          <div className="flex items-center gap-4">
            {getStatusIcon(execution.status)}
            <div className="flex-1">
              <h3 className="text-lg font-semibold">Execution {execution.id.slice(0, 8)}</h3>
              <p className="text-sm text-gray-500">
                Task: {execution.task_name}
              </p>
            </div>
            <div className="text-right">
              {getStatusBadge(execution.status)}
            </div>
          </div>
        </Card>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <h3 className="text-lg font-semibold mb-4">Execution Information</h3>
          <dl className="space-y-2">
            <div>
              <dt className="text-sm text-gray-500">Status</dt>
              <dd>{getStatusBadge(execution.status)}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Execution Type</dt>
              <dd>
                <Badge variant={execution.execution_type === 'simple' ? 'info' : 'warning'}>
                  {execution.execution_type}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Triggered By</dt>
              <dd className="text-sm">
                {execution.triggered_by === 'cron' ? (
                  <Badge variant="info">Cron Schedule</Badge>
                ) : execution.triggered_by === 'system' || execution.triggered_by === 'manual' ? (
                  <Badge variant="default">Manual</Badge>
                ) : execution.triggered_by ? (
                  <span>{execution.triggered_by}</span>
                ) : (
                  <Badge variant="default">System</Badge>
                )}
              </dd>
            </div>
            {execution.k8s_job_name && (
              <div>
                <dt className="text-sm text-gray-500">K8s Job</dt>
                <dd className="text-sm font-mono">{execution.k8s_job_name}</dd>
              </div>
            )}
          </dl>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold mb-4">Timing</h3>
          <dl className="space-y-2">
            <div>
              <dt className="text-sm text-gray-500">Started</dt>
              <dd className="text-sm">
                {execution.started_at ? formatDateTime(execution.started_at) : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Completed</dt>
              <dd className="text-sm">
                {execution.completed_at ? formatDateTime(execution.completed_at) : '—'}
              </dd>
            </div>
            {execution.duration_ms && (
              <div>
                <dt className="text-sm text-gray-500">Duration</dt>
                <dd className="text-sm">
                  {execution.duration_ms < 1000
                    ? `${execution.duration_ms}ms`
                    : `${(execution.duration_ms / 1000).toFixed(2)}s`}
                </dd>
              </div>
            )}
            {execution.exit_code !== null && (
              <div>
                <dt className="text-sm text-gray-500">Exit Code</dt>
                <dd className="text-sm font-mono">
                  {execution.exit_code === 0 ? (
                    <span className="text-green-600">{execution.exit_code}</span>
                  ) : (
                    <span className="text-red-600">{execution.exit_code}</span>
                  )}
                </dd>
              </div>
            )}
            {execution.rows_affected !== null && (
              <div>
                <dt className="text-sm text-gray-500">Rows Affected</dt>
                <dd className="text-sm">{execution.rows_affected}</dd>
              </div>
            )}
          </dl>
        </Card>
      </div>

      {/* Error */}
      {execution.error && (
        <div className="mb-6">
          <Card>
            <h3 className="text-lg font-semibold mb-4 text-red-600">Error</h3>
            <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm font-mono overflow-x-auto whitespace-pre-wrap">
              <code>{execution.error}</code>
            </pre>
          </Card>
        </div>
      )}

      {/* Output */}
      {execution.output && (
        <div className="mb-6">
          <Card>
            <h3 className="text-lg font-semibold mb-4">Output</h3>
            <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm font-mono overflow-x-auto whitespace-pre-wrap">
              <code>{execution.output}</code>
            </pre>
          </Card>
        </div>
      )}

      {/* Logs */}
      {execution.logs && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">Logs</h3>
          <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm font-mono overflow-x-auto whitespace-pre-wrap">
            <code>{execution.logs}</code>
          </pre>
        </Card>
      )}
    </Page>
  );
}

export default TaskExecution;

