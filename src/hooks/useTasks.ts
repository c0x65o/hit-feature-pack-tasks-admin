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
  // Schedule fields (merged from TaskSchedule)
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

// Get the tasks API URL - use proxy route to tasks module
function getTasksUrl(): string {
  // Use proxy route to tasks module which reads from hit.yaml config
  return '/api/proxy/tasks/hit/tasks';
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

// For task definitions (from hit.yaml)
async function fetchTasks<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${getTasksUrl()}${endpoint}`;
  
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

// For execution history/schedules (from tasks module)
async function fetchTasksModule<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `/api/proxy/tasks${endpoint}`;
  
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
    // Check if response is HTML (error page) instead of JSON
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      // If it's HTML, it's likely a 404 page - throw a proper error
      throw new TasksError(res.status, `Endpoint not found: ${endpoint}`);
    }
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
      // Task definitions come from hit.yaml via local API
      const data = await fetchTasks<TaskListResponse>('');
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
      // Get single task from hit.yaml via local API
      const data = await fetchTasks<TaskListResponse>('');
      const found = data.tasks.find(t => t.name === taskName);
      setTask(found || null);
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
      // Execution history comes from tasks module
      const url = `/hit/tasks/${encodeURIComponent(taskName)}/executions${query ? `?${query}` : ''}`;
      const data = await fetchTasksModule<ExecutionListResponse>(url);
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
      // Execution details come from tasks module
      const data = await fetchTasksModule<TaskExecution>(
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
      // Execute via local API route that adds project context
      const data = await fetchTasks<TaskExecution>(
        `/${encodeURIComponent(taskName)}/execute`,
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
      // Schedules are managed by tasks module
      const data = await fetchTasksModule<TaskSchedule>(
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
      // Schedules come from tasks module - gracefully handle if endpoint doesn't exist
      try {
        const data = await fetchTasksModule<ScheduleListResponse>('/hit/tasks/schedules');
        setSchedules(data.schedules || []);
      } catch (err) {
        // If schedules endpoint doesn't exist (404), that's OK - just use empty array
        if (err instanceof TasksError && err.status === 404) {
          setSchedules([]);
        } else {
          // For other errors, log but don't fail - schedules are optional
          console.warn('Failed to fetch schedules:', err);
          setSchedules([]);
        }
      }
    } catch (err) {
      // Don't set error for schedules - they're optional
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { schedules, loading, error, refresh };
}

