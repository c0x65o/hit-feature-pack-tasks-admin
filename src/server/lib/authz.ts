import { requireActionPermission } from '@hit/feature-pack-auth-core/server/lib/action-check';
import { requireEntityAuthz, type EntityAuthzOp } from '@hit/feature-pack-auth-core/server/lib/schema-authz';

const JOB_CORE_SUPPORTED_MODES = ['none', 'all'] as const;

export async function requireJobCoreEntityAuthz(
  request: Request,
  args: { entityKey: string; op: EntityAuthzOp }
) {
  return requireEntityAuthz(request, {
    entityKey: args.entityKey,
    op: args.op,
    supportedModes: [...JOB_CORE_SUPPORTED_MODES],
    fallbackMode: 'none',
    logPrefix: 'Job-Core',
  });
}

export async function requireJobCoreExecute(request: Request) {
  return requireActionPermission(request, 'job-core.list.execute', { logPrefix: 'Job-Core' });
}
