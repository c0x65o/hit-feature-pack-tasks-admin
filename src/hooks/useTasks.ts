'use client';

/**
 * Tasks Admin API hooks
 */

import { useState, useEffect, useCallback } from 'react';

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

interface TaskListResponse {
  tasks: Task[];
  total: number;
}

interface ExecutionListResponse {
  executions: TaskExecution[];
  total: number;
}

interface ScheduleListResponse {
  schedules: TaskSchedule[];
  total: number;
}

interface UseQueryOptions {
  limit?: number;
  offset?: number;
}

// Get the tasks module URL from environment or defaults
function getTasksUrl(): string {
  if (typeof window !== 'undefined') {
    const win = window as unknown as Record<string, string>;
    return win.NEXT_PUBLIC_HIT_TASKS_URL || '/api/proxy/tasks';
  }
  return '/api/proxy/tasks';
}

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  
  // Try to get token from localStorage (consistent with other feature packs)
  const token = localStorage.getItem('hit_token');
  if (token) {
    return { 'Authorization': `Bearer ${token}` };
  }
  
  // Also check for cookies (httpOnly tokens)
  // The proxy endpoint should handle auth via cookies automatically
  // So we can return empty headers and let the proxy handle it
  return {};
}

class TasksError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = 'TasksError';
    this.status = status;
    this.detail = detail;
  }
}

async function fetchWithAuth<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const tasksUrl = getTasksUrl();
  const url = `${tasksUrl}${endpoint}`;
  
  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ detail: res.statusText }));
    const detail = errorBody.detail || errorBody.message || `Request failed: ${res.status}`;
    throw new TasksError(res.status, detail);
  }

  return res.json();
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchWithAuth<TaskListResponse>('/hit/tasks');
      setTasks(data.tasks);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch tasks'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { tasks, loading, error, refresh };
}

export function useTask(taskName: string) {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchWithAuth<Task>(`/hit/tasks/${encodeURIComponent(taskName)}`);
      setTask(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch task'));
    } finally {
      setLoading(false);
    }
  }, [taskName]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { task, loading, error, refresh };
}

export function useTaskExecutions(taskName: string, options?: UseQueryOptions) {
  const [executions, setExecutions] = useState<TaskExecution[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());
      
      const query = params.toString();
      const url = `/hit/tasks/${encodeURIComponent(taskName)}/executions${query ? `?${query}` : ''}`;
      const data = await fetchWithAuth<ExecutionListResponse>(url);
      setExecutions(data.executions);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch executions'));
    } finally {
      setLoading(false);
    }
  }, [taskName, options?.limit, options?.offset]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { executions, total, loading, error, refresh };
}

export function useTaskExecution(taskName: string, executionId: string) {
  const [execution, setExecution] = useState<TaskExecution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchWithAuth<TaskExecution>(
        `/hit/tasks/${encodeURIComponent(taskName)}/executions/${encodeURIComponent(executionId)}`
      );
      setExecution(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch execution'));
    } finally {
      setLoading(false);
    }
  }, [taskName, executionId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { execution, loading, error, refresh };
}

export function useTaskMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const executeTask = useCallback(async (taskName: string, triggeredBy?: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchWithAuth<TaskExecution>(
        `/hit/tasks/${encodeURIComponent(taskName)}/execute`,
        {
          method: 'POST',
          body: JSON.stringify({ triggered_by: triggeredBy }),
        }
      );
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to execute task');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSchedule = useCallback(async (taskName: string, enabled: boolean) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchWithAuth<TaskSchedule>(
        `/hit/tasks/${encodeURIComponent(taskName)}/schedule`,
        {
          method: 'POST',
          body: JSON.stringify({ enabled }),
        }
      );
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update schedule');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return { executeTask, updateSchedule, loading, error };
}

export function useSchedules() {
  const [schedules, setSchedules] = useState<TaskSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchWithAuth<ScheduleListResponse>('/hit/tasks/schedules');
      setSchedules(data.schedules);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch schedules'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { schedules, loading, error, refresh };
}

