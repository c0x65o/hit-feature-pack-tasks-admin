import { type EntityAuthzOp } from '@hit/feature-pack-auth-core/server/lib/schema-authz';
export declare function requireJobCoreEntityAuthz(request: Request, args: {
    entityKey: string;
    op: EntityAuthzOp;
}): Promise<Response | import("@hit/feature-pack-auth-core/server/lib/schema-authz").EntityAuthzResult>;
export declare function requireJobCoreExecute(request: Request): Promise<Response | null>;
//# sourceMappingURL=authz.d.ts.map