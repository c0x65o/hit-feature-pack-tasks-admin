import { requireActionPermission } from '@hit/feature-pack-auth-core/server/lib/action-check';
import { requireEntityAuthz } from '@hit/feature-pack-auth-core/server/lib/schema-authz';
const JOB_CORE_SUPPORTED_MODES = ['none', 'all'];
export async function requireJobCoreEntityAuthz(request, args) {
    return requireEntityAuthz(request, {
        entityKey: args.entityKey,
        op: args.op,
        supportedModes: [...JOB_CORE_SUPPORTED_MODES],
        fallbackMode: 'none',
        logPrefix: 'Job-Core',
    });
}
export async function requireJobCoreExecute(request) {
    return requireActionPermission(request, 'job-core.list.execute', { logPrefix: 'Job-Core' });
}
//# sourceMappingURL=authz.js.map