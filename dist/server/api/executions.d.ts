/**
 * GET /api/job-core/executions
 *
 * DB-first list API for hit_task_executions.
 * Supports filters used by schema-driven pages:
 * - page, pageSize, search, sortBy, sortOrder
 * - task_name (from embedded tables) and status
 */
import { NextRequest } from 'next/server';
export declare function GET(request: NextRequest): Promise<Response>;
//# sourceMappingURL=executions.d.ts.map