'use client';

/**
 * Job-core contrib
 *
 * Job-core is now schema-driven. No custom list/detail widgets are needed.
 * Action handlers are provided for the headerActions defined in the entity schema.
 */

export type PackContrib = {
  actionHandlers?: Record<string, (args: any) => Promise<void> | void>;
};

export const contrib: PackContrib = {
  actionHandlers: {
    'job-core.task.run': async ({ record }: any) => {
      const name = String(record?.id || record?.name || '').trim();
      if (!name) throw new Error('Missing task id');
      const res = await fetch(`/api/job-core/tasks/${encodeURIComponent(name)}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(String(json?.error || `Failed to run task (${res.status})`));
      // UX: keep it simple; user can see the new execution in the embedded table and/or Results list.
      if (typeof window !== 'undefined') {
        // Best-effort refresh so the embedded executions table updates.
        window.location.reload();
      }
    },
    'job-core.task.toggleSchedule': async ({ record }: any) => {
      const name = String(record?.id || record?.name || '').trim();
      if (!name) throw new Error('Missing task id');
      const next = !Boolean(record?.enabled);
      const res = await fetch(`/api/job-core/tasks/${encodeURIComponent(name)}/schedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ enabled: next }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(String(json?.error || `Failed to update schedule (${res.status})`));
      if (typeof window !== 'undefined') window.location.reload();
    },
  },
};

export default contrib;
