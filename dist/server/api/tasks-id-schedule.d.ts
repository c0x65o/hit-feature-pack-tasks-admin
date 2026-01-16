/**
 * PUT /api/job-core/tasks/[id]/schedule
 *
 * Upserts hit_task_schedules.schedule_enabled for a task.
 */
import { NextRequest } from 'next/server';
type RouteParams = {
    params: Promise<{
        id: string;
    }>;
};
export declare function PUT(request: NextRequest, { params }: RouteParams): Promise<Response>;
export {};
//# sourceMappingURL=tasks-id-schedule.d.ts.map