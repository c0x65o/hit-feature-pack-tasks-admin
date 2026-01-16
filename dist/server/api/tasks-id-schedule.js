/**
 * PUT /api/job-core/tasks/[id]/schedule
 *
 * Upserts hit_task_schedules.schedule_enabled for a task.
 */
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { hitTaskSchedules } from '@/lib/feature-pack-schemas';
import { requireJobCoreEntityAuthz } from '../lib/authz';
export async function PUT(request, { params }) {
    try {
        const authz = await requireJobCoreEntityAuthz(request, {
            entityKey: 'job-core.task',
            op: 'edit',
        });
        if (authz instanceof Response)
            return authz;
        const { id } = await params;
        const name = String(id || '').trim();
        if (!name)
            return NextResponse.json({ error: 'Missing id' }, { status: 400 });
        const body = await request.json().catch(() => ({}));
        const enabledRaw = body?.enabled ?? body?.schedule_enabled;
        const enabled = Boolean(enabledRaw);
        const db = getDb();
        // Try update first (common case).
        const updated = await db
            .update(hitTaskSchedules)
            .set({ scheduleEnabled: enabled, updatedAt: new Date() })
            .where(eq(hitTaskSchedules.taskName, name))
            .returning();
        const row = Array.isArray(updated) && updated.length > 0 ? updated[0] : null;
        if (row)
            return NextResponse.json(row);
        const inserted = await db
            .insert(hitTaskSchedules)
            .values({ taskName: name, scheduleEnabled: enabled, updatedAt: new Date() })
            .returning();
        return NextResponse.json((Array.isArray(inserted) && inserted[0]) || { ok: true });
    }
    catch (error) {
        const msg = String(error?.message || error || 'Failed to update schedule');
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
//# sourceMappingURL=tasks-id-schedule.js.map