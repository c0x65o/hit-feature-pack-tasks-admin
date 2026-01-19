-- hit:schema-only
-- Auto-generated from pack schema; app Drizzle migrations handle tables.

CREATE TABLE "hit_task_executions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_name" text NOT NULL,
	"service_name" text,
	"triggered_by" text,
	"status" text DEFAULT 'queued' NOT NULL,
	"enqueued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"exit_code" integer,
	"duration_ms" integer,
	"error" text,
	"logs" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hit_task_schedules" (
	"task_name" text PRIMARY KEY NOT NULL,
	"schedule_enabled" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "hit_task_executions_task_name_idx" ON "hit_task_executions" USING btree ("task_name");--> statement-breakpoint
CREATE INDEX "hit_task_executions_status_idx" ON "hit_task_executions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "hit_task_executions_enqueued_at_idx" ON "hit_task_executions" USING btree ("enqueued_at");