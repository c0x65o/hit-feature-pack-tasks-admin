/**
 * GET /api/job-core/executions/[id]
 */
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { hitTaskExecutions } from '@/lib/feature-pack-schemas';
import { requireJobCoreEntityAuthz } from '../lib/authz';
export async function GET(request, { params }) {
    try {
        const authz = await requireJobCoreEntityAuthz(request, {
            entityKey: 'job-core.execution',
            op: 'detail',
        });
        if (authz instanceof Response)
            return authz;
        const { id } = await params;
        const execId = String(id || '').trim();
        if (!execId)
            return NextResponse.json({ error: 'Missing id' }, { status: 400 });
        const db = getDb();
        const [row] = await db
            .select()
            .from(hitTaskExecutions)
            .where(eq(hitTaskExecutions.id, execId))
            .limit(1);
        if (!row)
            return NextResponse.json({ error: 'Execution not found' }, { status: 404 });
        return NextResponse.json(row);
    }
    catch (error) {
        const msg = String(error?.message || error || 'Failed to fetch execution');
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
//# sourceMappingURL=executions-id.js.map