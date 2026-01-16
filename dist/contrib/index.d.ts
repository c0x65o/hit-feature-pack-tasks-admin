/**
 * Job-core contrib
 *
 * Job-core is now schema-driven. No custom list/detail widgets are needed.
 * Action handlers are provided for the headerActions defined in the entity schema.
 */
export type PackContrib = {
    actionHandlers?: Record<string, (args: any) => Promise<void> | void>;
};
export declare const contrib: PackContrib;
export default contrib;
//# sourceMappingURL=index.d.ts.map