import { resolveScopeMode, type ScopeMode as CoreScopeMode } from '@hit/feature-pack-auth-core/server/lib/scope-mode';

// Job-core entities are system-level (no ownership or LDD fields).
// We intentionally only support: none | all.
export type ScopeMode = 'none' | 'all';
export type ScopeVerb = 'read' | 'write' | 'delete';
// Authz entity names align with permissions.yaml + route authz (list/results).
export type ScopeEntity = 'list' | 'results';

/**
 * Resolve effective scope mode using a tree:
 * - job-core default: job-core.{verb}.scope.{mode}
 * - entity override: job-core.{entity}.{verb}.scope.{mode}
 * - fallback: own
 *
 * Precedence if multiple are granted: most restrictive wins.
 */
export async function resolveJobCoreScopeMode(
  request: Request,
  args: { verb: ScopeVerb; entity?: ScopeEntity }
): Promise<ScopeMode> {
  const m = await resolveScopeMode(request as Parameters<typeof resolveScopeMode>[0], {
    pack: 'job-core',
    verb: args.verb,
    entity: args.entity,
    supportedModes: ['none', 'all'] satisfies CoreScopeMode[],
    // If nothing is configured, lock system entities down by default.
    // Admins will still get access via auth-core template defaults in action evaluation.
    fallbackMode: 'none',
    logPrefix: 'Job-Core',
  });
  return (m === 'all' ? 'all' : 'none') as ScopeMode;
}
