/**
 * POST /api/job-core/tasks/[id]/run
 *
 * Inserts a row into hit_task_executions with status='queued'.
 * The tasks worker will pick it up and execute it.
 */
import { NextRequest } from 'next/server';
type RouteParams = {
    params: Promise<{
        id: string;
    }>;
};
export declare function POST(request: NextRequest, { params }: RouteParams): Promise<Response>;
export {};
//# sourceMappingURL=tasks-id-run.d.ts.map