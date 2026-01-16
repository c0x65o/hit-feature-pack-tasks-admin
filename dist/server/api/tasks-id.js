/**
 * GET /api/job-core/tasks/[id]
 *
 * Returns a single task definition from `.hit/generated/hit_tasks_manifest.json`,
 * plus schedule_enabled (DB) and recent execution info.
 */
import fs from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { desc, eq, sql } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { hitTaskExecutions, hitTaskSchedules } from '@/lib/feature-pack-schemas';
import { requireJobCoreEntityAuthz } from '../lib/authz';
function loadTasksManifest() {
    const p = path.join(process.cwd(), '.hit', 'generated', 'hit_tasks_manifest.json');
    const raw = fs.readFileSync(p, 'utf8');
    const json = JSON.parse(raw || '{}');
    const tasks = json && typeof json.tasks === 'object' ? json.tasks : {};
    return tasks || {};
}
export async function GET(request, { params }) {
    try {
        const authz = await requireJobCoreEntityAuthz(request, {
            entityKey: 'job-core.task',
            op: 'detail',
        });
        if (authz instanceof Response)
            return authz;
        const { id } = await params;
        const name = String(id || '').trim();
        if (!name)
            return NextResponse.json({ error: 'Missing id' }, { status: 400 });
        const tasksObj = loadTasksManifest();
        const t = tasksObj[name];
        if (!t)
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        const db = getDb();
        const [sched] = await db
            .select({ enabled: hitTaskSchedules.scheduleEnabled })
            .from(hitTaskSchedules)
            .where(eq(hitTaskSchedules.taskName, name))
            .limit(1);
        const [latest] = await db
            .select({
            id: hitTaskExecutions.id,
            status: hitTaskExecutions.status,
            enqueuedAt: hitTaskExecutions.enqueuedAt,
            startedAt: hitTaskExecutions.startedAt,
            completedAt: hitTaskExecutions.completedAt,
            exitCode: hitTaskExecutions.exitCode,
            durationMs: hitTaskExecutions.durationMs,
        })
            .from(hitTaskExecutions)
            .where(eq(hitTaskExecutions.taskName, name))
            .orderBy(desc(hitTaskExecutions.enqueuedAt))
            .limit(1);
        const [lastRunRow] = await db
            .select({
            lastCompletedAt: sql `max(${hitTaskExecutions.completedAt})`,
            lastEnqueuedAt: sql `max(${hitTaskExecutions.enqueuedAt})`,
        })
            .from(hitTaskExecutions)
            .where(eq(hitTaskExecutions.taskName, name))
            .limit(1);
        const cron = t.cron ?? null;
        const enabled = cron ? (sched ? Boolean(sched.enabled) : true) : true;
        const lastRun = String(lastRunRow?.lastCompletedAt || lastRunRow?.lastEnqueuedAt || '').trim() || null;
        return NextResponse.json({
            id: name,
            name,
            description: t.description ?? null,
            command: t.command ?? null,
            cron,
            service_name: t.service_name ?? null,
            enabled,
            last_run: lastRun,
            latest_execution_id: latest ? String(latest.id) : null,
            latest_status: latest ? String(latest.status) : null,
        });
    }
    catch (error) {
        const msg = String(error?.message || error || 'Failed to fetch task');
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
//# sourceMappingURL=tasks-id.js.map