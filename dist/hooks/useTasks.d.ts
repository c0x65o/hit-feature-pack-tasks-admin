export interface Task {
    id: string;
    project_slug: string;
    name: string;
    description: string | null;
    command: string | null;
    script: string | null;
    sql: string | null;
    cron: string | null;
    service_name: string | null;
    execution_type: string;
    enabled: boolean;
    metadata: Record<string, unknown>;
    cronjob_name?: string | null;
    schedule_enabled?: boolean;
    last_run?: string | null;
    next_run?: string | null;
    created_at: string | null;
    updated_at: string | null;
}
export interface TaskExecution {
    id: string;
    task_definition_id: string;
    project_slug: string;
    task_name: string;
    status: string;
    execution_type: string;
    triggered_by: string | null;
    k8s_job_name: string | null;
    started_at: string | null;
    completed_at: string | null;
    logs: string | null;
    error: string | null;
    output: string | null;
    exit_code: number | null;
    duration_ms: number | null;
    rows_affected: number | null;
    data: Record<string, unknown> | null;
    created_at: string;
}
export interface TaskSchedule {
    id: string;
    task_definition_id: string;
    project_slug: string;
    task_name: string;
    cronjob_name: string | null;
    cron_schedule: string;
    enabled: boolean;
    last_run: string | null;
    next_run: string | null;
    created_at: string;
    updated_at: string;
}
interface UseQueryOptions {
    limit?: number;
    offset?: number;
}
interface AllExecutionsOptions extends UseQueryOptions {
    status?: string;
    taskName?: string;
}
export declare function useTasks(): {
    tasks: Task[];
    loading: boolean;
    error: Error | null;
    refresh: () => Promise<void>;
};
export declare function useTask(taskName: string): {
    task: Task | null;
    loading: boolean;
    error: Error | null;
    refresh: () => Promise<void>;
};
export declare function useTaskExecutions(taskName: string, options?: UseQueryOptions): {
    executions: TaskExecution[];
    total: number;
    loading: boolean;
    error: Error | null;
    refresh: () => Promise<void>;
};
export declare function useTaskExecution(taskName: string, executionId: string): {
    execution: TaskExecution | null;
    loading: boolean;
    error: Error | null;
    refresh: () => Promise<void>;
};
export declare function useTaskMutations(): {
    executeTask: (taskName: string, triggeredBy?: string) => Promise<TaskExecution>;
    updateSchedule: (taskName: string, enabled: boolean) => Promise<TaskSchedule>;
    loading: boolean;
    error: Error | null;
};
export declare function useAllExecutions(options?: AllExecutionsOptions): {
    executions: TaskExecution[];
    total: number;
    loading: boolean;
    error: Error | null;
    refresh: () => Promise<void>;
};
export declare function useSchedules(): {
    schedules: TaskSchedule[];
    loading: boolean;
    error: Error | null;
    refresh: () => Promise<void>;
};
export {};
//# sourceMappingURL=useTasks.d.ts.map