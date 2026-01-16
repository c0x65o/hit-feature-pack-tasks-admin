/**
 * GET /api/job-core/executions/[id]
 */
import { NextRequest } from 'next/server';
type RouteParams = {
    params: Promise<{
        id: string;
    }>;
};
export declare function GET(request: NextRequest, { params }: RouteParams): Promise<Response>;
export {};
//# sourceMappingURL=executions-id.d.ts.map