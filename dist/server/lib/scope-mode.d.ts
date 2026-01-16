export type ScopeMode = 'none' | 'all';
export type ScopeVerb = 'read' | 'write' | 'delete';
export type ScopeEntity = 'list' | 'results';
/**
 * Resolve effective scope mode using a tree:
 * - job-core default: job-core.{verb}.scope.{mode}
 * - entity override: job-core.{entity}.{verb}.scope.{mode}
 * - fallback: own
 *
 * Precedence if multiple are granted: most restrictive wins.
 */
export declare function resolveJobCoreScopeMode(request: Request, args: {
    verb: ScopeVerb;
    entity?: ScopeEntity;
}): Promise<ScopeMode>;
//# sourceMappingURL=scope-mode.d.ts.map