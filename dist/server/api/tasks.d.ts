/**
 * GET /api/job-core/tasks
 *
 * Lists tasks from `.hit/generated/hit_tasks_manifest.json` and enriches with:
 * - schedule_enabled (from hit_task_schedules)
 * - last_run (from hit_task_executions)
 *
 * This is intentionally DB-first and avoids auth-module dependencies.
 */
import { NextRequest } from 'next/server';
export declare function GET(request: NextRequest): Promise<Response>;
//# sourceMappingURL=tasks.d.ts.map