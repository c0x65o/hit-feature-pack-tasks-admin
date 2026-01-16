/**
 * Job Core schema (minimal, Postgres-first)
 *
 * These tables are used by the platform tasks worker:
 *   .hit/generated/hit_tasks_worker.cjs
 *
 * They intentionally live in the app DB (no CAC/K8s runtime dependencies).
 */
import { boolean, integer, pgTable, text, timestamp, uuid, index } from 'drizzle-orm/pg-core';
export const hitTaskSchedules = pgTable('hit_task_schedules', {
    taskName: text('task_name').primaryKey(),
    scheduleEnabled: boolean('schedule_enabled').notNull().default(true),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
export const hitTaskExecutions = pgTable('hit_task_executions', {
    id: uuid('id').primaryKey().defaultRandom(),
    taskName: text('task_name').notNull(),
    serviceName: text('service_name'),
    triggeredBy: text('triggered_by'),
    status: text('status').notNull().default('queued'), // queued | running | success | failed
    enqueuedAt: timestamp('enqueued_at', { withTimezone: true }).notNull().defaultNow(),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    exitCode: integer('exit_code'),
    durationMs: integer('duration_ms'),
    error: text('error'),
    logs: text('logs').notNull().default(''),
}, (t) => ({
    taskNameIdx: index('hit_task_executions_task_name_idx').on(t.taskName),
    statusIdx: index('hit_task_executions_status_idx').on(t.status),
    enqueuedAtIdx: index('hit_task_executions_enqueued_at_idx').on(t.enqueuedAt),
}));
//# sourceMappingURL=job-core.js.map