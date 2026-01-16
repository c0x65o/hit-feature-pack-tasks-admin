/**
 * POST /api/job-core/tasks/[id]/run
 *
 * Inserts a row into hit_task_executions with status='queued'.
 * The tasks worker will pick it up and execute it.
 */
import fs from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { hitTaskExecutions } from '@/lib/feature-pack-schemas';
import { extractUserFromRequest } from '../auth';
import { requireJobCoreExecute } from '../lib/authz';
function loadTasksManifest() {
    const p = path.join(process.cwd(), '.hit', 'generated', 'hit_tasks_manifest.json');
    const raw = fs.readFileSync(p, 'utf8');
    const json = JSON.parse(raw || '{}');
    const tasks = json && typeof json.tasks === 'object' ? json.tasks : {};
    return tasks || {};
}
export async function POST(request, { params }) {
    try {
        const denied = await requireJobCoreExecute(request);
        if (denied)
            return denied;
        const user = extractUserFromRequest(request);
        const { id } = await params;
        const name = String(id || '').trim();
        if (!name)
            return NextResponse.json({ error: 'Missing id' }, { status: 400 });
        const tasksObj = loadTasksManifest();
        const t = tasksObj[name];
        if (!t)
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        const body = await request.json().catch(() => ({}));
        const triggeredByRaw = body?.triggeredBy ?? body?.triggered_by ?? null;
        const triggeredBy = (typeof triggeredByRaw === 'string' && triggeredByRaw.trim()) ||
            (user?.email && String(user.email).trim()) ||
            'manual';
        const db = getDb();
        const [created] = await db
            .insert(hitTaskExecutions)
            .values({
            taskName: name,
            serviceName: t.service_name ?? null,
            triggeredBy,
            status: 'queued',
            logs: '',
        })
            .returning();
        return NextResponse.json(created || { ok: true });
    }
    catch (error) {
        const msg = String(error?.message || error || 'Failed to enqueue task');
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
//# sourceMappingURL=tasks-id-run.js.map