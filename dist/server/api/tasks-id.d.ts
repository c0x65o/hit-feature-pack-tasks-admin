/**
 * GET /api/job-core/tasks/[id]
 *
 * Returns a single task definition from `.hit/generated/hit_tasks_manifest.json`,
 * plus schedule_enabled (DB) and recent execution info.
 */
import { NextRequest } from 'next/server';
type RouteParams = {
    params: Promise<{
        id: string;
    }>;
};
export declare function GET(request: NextRequest, { params }: RouteParams): Promise<Response>;
export {};
//# sourceMappingURL=tasks-id.d.ts.map