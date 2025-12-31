'use client';

import React from 'react';
import { useUi } from '@hit/ui-kit';
import { formatDateTime, formatRelativeTime } from '@hit/sdk';
import { RefreshCw } from 'lucide-react';
import { useAiTraces } from '../hooks/useAiTraces';

interface AiTracesProps {
  onNavigate?: (path: string) => void;
}

export function AiTraces({ onNavigate }: AiTracesProps) {
  const { Page, Card, Button, DataTable, Alert, Badge } = useUi();
  const { traces, traceDir, retentionDays, loading, error, refresh } = useAiTraces({ limit: 100 });

  const navigate = (path: string) => {
    if (onNavigate) onNavigate(path);
    else if (typeof window !== 'undefined') window.location.href = path;
  };

  return (
    <Page
      title="AI Traces"
      description={`Admin-only per-run telemetry for the AI agent${
        retentionDays ? ` (${retentionDays}-day retention)` : ''
      }`}
      actions={
        <div className="flex gap-2 items-center">
          <Button variant="primary" onClick={refresh} disabled={loading}>
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </Button>
        </div>
      }
    >
      {traceDir && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Trace storage: <span className="font-mono">{traceDir}</span>
        </div>
      )}
      {error && (
        <Alert variant="error" title="Error loading AI traces">
          {error.message}
        </Alert>
      )}

      <Card>
        <DataTable
          loading={loading}
          data={traces as any[]}
          emptyMessage="No traces yet. Traces will appear here as the AI agent is used."
          columns={[
            {
              key: 'startedAtMs',
              label: 'When',
              render: (value: unknown) => {
                const ms = typeof value === 'number' ? value : null;
                if (!ms) return <span className="text-gray-500">—</span>;
                const iso = new Date(ms).toISOString();
                return (
                  <div className="flex flex-col">
                    <span className="font-medium">{formatRelativeTime(iso)}</span>
                    <span className="text-xs text-gray-500">{formatDateTime(iso)}</span>
                  </div>
                );
              },
            },
            {
              key: 'requestId',
              label: 'Request ID',
              sortable: true,
              render: (value: unknown) => (
                <span
                  role="button"
                  tabIndex={0}
                  className="font-mono text-blue-600 dark:text-blue-400 hover:underline"
                  onClick={() => navigate(`/admin/ai/traces/${encodeURIComponent(String(value))}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      navigate(`/admin/ai/traces/${encodeURIComponent(String(value))}`);
                    }
                  }}
                >
                  {String(value)}
                </span>
              ),
            },
            {
              key: 'user',
              label: 'User',
              render: (_: unknown, row?: Record<string, unknown>) => {
                const u = row?.user as any;
                const email = u?.email ? String(u.email) : null;
                return email ? <span className="font-medium">{email}</span> : <span className="text-gray-500">—</span>;
              },
            },
            {
              key: 'pathname',
              label: 'Path',
              render: (value: unknown) =>
                value ? <span className="font-mono text-xs">{String(value)}</span> : <span className="text-gray-500">—</span>,
            },
            {
              key: 'durationMs',
              label: 'Duration',
              sortable: true,
              render: (value: unknown) => {
                const ms = typeof value === 'number' ? value : null;
                if (ms == null) return <span className="text-gray-500">—</span>;
                const secs = Math.round(ms / 100) / 10;
                const variant = ms > 30000 ? 'error' : ms > 15000 ? 'warning' : 'success';
                return <Badge variant={variant as any}>{secs}s</Badge>;
              },
            },
            {
              key: 'health',
              label: 'Status',
              render: (_: unknown, row?: Record<string, unknown>) => {
                const h = (row as any)?.health as any;
                const status = h?.status as string | undefined;
                const non2xx = typeof h?.non2xxCount === 'number' ? h.non2xxCount : 0;
                const http5xx = typeof h?.http5xxCount === 'number' ? h.http5xxCount : 0;
                const llmErr = typeof h?.llmErrorCount === 'number' ? h.llmErrorCount : 0;

                if (!status) return <span className="text-gray-500">—</span>;

                if (status === 'ok') return <Badge variant="success">OK</Badge>;
                if (status === 'auto_healed') {
                  return (
                    <Badge variant="warning">
                      Auto-healed ({non2xx} http err{non2xx === 1 ? '' : 's'}, {http5xx} 5xx, {llmErr} llm)
                    </Badge>
                  );
                }
                return (
                  <Badge variant="error">
                    Error ({non2xx} http err{non2xx === 1 ? '' : 's'}, {http5xx} 5xx, {llmErr} llm)
                  </Badge>
                );
              },
            },
          ]}
        />
      </Card>
    </Page>
  );
}

export default AiTraces;

