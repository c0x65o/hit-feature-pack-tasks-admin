/**
 * GET /api/job-core/executions
 *
 * DB-first list API for hit_task_executions.
 * Supports filters used by schema-driven pages:
 * - page, pageSize, search, sortBy, sortOrder
 * - task_name (from embedded tables) and status
 */
import { NextResponse } from 'next/server';
import { and, asc, desc, eq, ilike, sql } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { hitTaskExecutions } from '@/lib/feature-pack-schemas';
import { requireJobCoreEntityAuthz } from '../lib/authz';
function parseListParams(request) {
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get('page') || 1) || 1);
    const pageSize = Math.min(200, Math.max(1, Number(url.searchParams.get('pageSize') || 25) || 25));
    const search = String(url.searchParams.get('search') || '').trim();
    const sortBy = String(url.searchParams.get('sortBy') || 'enqueuedAt').trim();
    const sortOrder = String(url.searchParams.get('sortOrder') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';
    const taskName = String(url.searchParams.get('task_name') || url.searchParams.get('taskName') || '').trim();
    const status = String(url.searchParams.get('status') || '').trim();
    return { page, pageSize, search, sortBy, sortOrder, taskName, status };
}
function resolveSortColumn(sortBy) {
    const k = sortBy;
    if (k === 'task_name' || k === 'taskName')
        return hitTaskExecutions.taskName;
    if (k === 'status')
        return hitTaskExecutions.status;
    if (k === 'enqueued_at' || k === 'enqueuedAt')
        return hitTaskExecutions.enqueuedAt;
    if (k === 'started_at' || k === 'startedAt')
        return hitTaskExecutions.startedAt;
    if (k === 'completed_at' || k === 'completedAt')
        return hitTaskExecutions.completedAt;
    if (k === 'duration_ms' || k === 'durationMs')
        return hitTaskExecutions.durationMs;
    return hitTaskExecutions.enqueuedAt;
}
export async function GET(request) {
    try {
        const authz = await requireJobCoreEntityAuthz(request, {
            entityKey: 'job-core.execution',
            op: 'list',
        });
        if (authz instanceof Response)
            return authz;
        const { page, pageSize, search, sortBy, sortOrder, taskName, status } = parseListParams(request);
        const db = getDb();
        const conditions = [];
        if (taskName)
            conditions.push(eq(hitTaskExecutions.taskName, taskName));
        if (status)
            conditions.push(eq(hitTaskExecutions.status, status));
        if (search)
            conditions.push(ilike(hitTaskExecutions.taskName, `%${search}%`));
        const where = conditions.length > 0 ? and(...conditions) : undefined;
        const [{ count }] = (await db
            .select({ count: sql `count(*)` })
            .from(hitTaskExecutions)
            .where(where)
            .limit(1)) || [];
        const total = Number(count || 0);
        const sortCol = resolveSortColumn(sortBy);
        const orderBy = sortOrder === 'asc' ? asc(sortCol) : desc(sortCol);
        const items = await db
            .select()
            .from(hitTaskExecutions)
            .where(where)
            .orderBy(orderBy)
            .limit(pageSize)
            .offset((page - 1) * pageSize);
        return NextResponse.json({
            items: items || [],
            pagination: { page, pageSize, total },
        });
    }
    catch (error) {
        const msg = String(error?.message || error || 'Failed to list executions');
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
//# sourceMappingURL=executions.js.map