/**
 * GET /api/job-core/tasks
 *
 * Lists tasks from `.hit/generated/hit_tasks_manifest.json` and enriches with:
 * - schedule_enabled (from hit_task_schedules)
 * - last_run (from hit_task_executions)
 *
 * This is intentionally DB-first and avoids auth-module dependencies.
 */
import fs from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { desc, inArray, sql } from 'drizzle-orm';
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
function parsePageParams(request) {
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get('page') || 1) || 1);
    const pageSize = Math.min(200, Math.max(1, Number(url.searchParams.get('pageSize') || 25) || 25));
    const search = String(url.searchParams.get('search') || '').trim().toLowerCase();
    return { page, pageSize, search };
}
export async function GET(request) {
    try {
        const authz = await requireJobCoreEntityAuthz(request, {
            entityKey: 'job-core.task',
            op: 'list',
        });
        if (authz instanceof Response)
            return authz;
        const { page, pageSize, search } = parsePageParams(request);
        const tasksObj = loadTasksManifest();
        const allNames = Object.keys(tasksObj).sort((a, b) => a.localeCompare(b));
        const filteredNames = search
            ? allNames.filter((name) => {
                const t = tasksObj[name] || {};
                const descTxt = String(t.description || '').toLowerCase();
                return name.toLowerCase().includes(search) || descTxt.includes(search);
            })
            : allNames;
        const total = filteredNames.length;
        const start = (page - 1) * pageSize;
        const pageNames = filteredNames.slice(start, start + pageSize);
        const db = getDb();
        // schedule_enabled
        const scheduleRows = pageNames.length > 0
            ? await db
                .select({ taskName: hitTaskSchedules.taskName, scheduleEnabled: hitTaskSchedules.scheduleEnabled })
                .from(hitTaskSchedules)
                .where(inArray(hitTaskSchedules.taskName, pageNames))
                .limit(1000)
            : [];
        const scheduleByName = new Map();
        for (const r of scheduleRows) {
            scheduleByName.set(String(r.taskName), Boolean(r.scheduleEnabled));
        }
        // last_run (completed_at max; fallback to enqueued_at max when running/queued)
        const lastRunRows = pageNames.length > 0
            ? await db
                .select({
                taskName: hitTaskExecutions.taskName,
                lastCompletedAt: sql `max(${hitTaskExecutions.completedAt})`,
                lastEnqueuedAt: sql `max(${hitTaskExecutions.enqueuedAt})`,
            })
                .from(hitTaskExecutions)
                .where(inArray(hitTaskExecutions.taskName, pageNames))
                .groupBy(hitTaskExecutions.taskName)
            : [];
        const lastRunByName = new Map();
        for (const r of lastRunRows) {
            const name = String(r.taskName);
            const v = String(r.lastCompletedAt || r.lastEnqueuedAt || '').trim();
            if (v)
                lastRunByName.set(name, v);
        }
        // Recent execution summary for this page (helps show status without extra calls)
        const latestExecRows = pageNames.length > 0
            ? await db
                .select({
                id: hitTaskExecutions.id,
                taskName: hitTaskExecutions.taskName,
                status: hitTaskExecutions.status,
                enqueuedAt: hitTaskExecutions.enqueuedAt,
            })
                .from(hitTaskExecutions)
                .where(inArray(hitTaskExecutions.taskName, pageNames))
                .orderBy(desc(hitTaskExecutions.enqueuedAt))
                .limit(5000)
            : [];
        const latestByName = new Map();
        for (const r of latestExecRows) {
            const name = String(r.taskName);
            if (!latestByName.has(name))
                latestByName.set(name, r);
        }
        const items = pageNames.map((name) => {
            const t = tasksObj[name] || {};
            const cron = t.cron ?? null;
            const scheduleEnabled = scheduleByName.get(name);
            const enabled = cron ? (scheduleEnabled === undefined ? true : Boolean(scheduleEnabled)) : true;
            const lastRun = lastRunByName.get(name) || null;
            const latest = latestByName.get(name) || null;
            return {
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
            };
        });
        return NextResponse.json({
            items,
            pagination: { page, pageSize, total },
        });
    }
    catch (error) {
        const msg = String(error?.message || error || 'Failed to list tasks');
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
//# sourceMappingURL=tasks.js.map