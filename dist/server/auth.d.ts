import { NextRequest } from 'next/server';
export interface User {
    sub: string;
    email: string;
    roles?: string[];
}
/**
 * Extract user from JWT token in cookies or Authorization header
 */
export declare function extractUserFromRequest(request: NextRequest): User | null;
//# sourceMappingURL=auth.d.ts.map