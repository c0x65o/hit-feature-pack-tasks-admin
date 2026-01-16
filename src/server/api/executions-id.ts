/**
 * GET /api/job-core/executions/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { hitTaskExecutions } from '@/lib/feature-pack-schemas';
import { requireJobCoreEntityAuthz } from '../lib/authz';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authz = await requireJobCoreEntityAuthz(request, {
      entityKey: 'job-core.execution',
      op: 'detail',
    });
    if (authz instanceof Response) return authz;

    const { id } = await params;
    const execId = String(id || '').trim();
    if (!execId) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const db = getDb();
    const [row] = await db
      .select()
      .from(hitTaskExecutions)
      .where(eq(hitTaskExecutions.id as any, execId as any) as any)
      .limit(1);

    if (!row) return NextResponse.json({ error: 'Execution not found' }, { status: 404 });
    return NextResponse.json(row);
  } catch (error: any) {
    const msg = String(error?.message || error || 'Failed to fetch execution');
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

