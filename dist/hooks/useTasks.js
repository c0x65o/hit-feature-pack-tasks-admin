'use client';
/**
 * Jobs Admin API hooks
 */
import { useState, useEffect, useCallback } from 'react';
// Get the tasks API URL - use proxy route to tasks module
function getTasksUrl() {
    // Use proxy route to tasks module which reads from hit.yaml config
    return '/api/proxy/tasks/hit/tasks';
}
function getAuthHeaders() {
    if (typeof window === 'undefined')
        return {};
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
    constructor(status, detail) {
        super(detail);
        this.name = 'TasksError';
        this.status = status;
        this.detail = detail;
    }
}
// For task definitions (from hit.yaml)
async function fetchTasks(endpoint, options) {
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
async function fetchTasksModule(endpoint, options) {
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
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const refresh = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            // Task definitions come from hit.yaml via local API
            const data = await fetchTasks('');
            setTasks(data.tasks);
        }
        catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch tasks'));
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        refresh();
    }, [refresh]);
    return { tasks, loading, error, refresh };
}
export function useTask(taskName) {
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const refresh = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            // Get single task from hit.yaml via local API
            const data = await fetchTasks('');
            const found = data.tasks.find(t => t.name === taskName);
            setTask(found || null);
        }
        catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch task'));
        }
        finally {
            setLoading(false);
        }
    }, [taskName]);
    useEffect(() => {
        refresh();
    }, [refresh]);
    return { task, loading, error, refresh };
}
export function useTaskExecutions(taskName, options) {
    const [executions, setExecutions] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const refresh = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const params = new URLSearchParams();
            if (options?.limit)
                params.append('limit', options.limit.toString());
            if (options?.offset)
                params.append('offset', options.offset.toString());
            const query = params.toString();
            // Execution history comes from tasks module
            const url = `/hit/tasks/${encodeURIComponent(taskName)}/executions${query ? `?${query}` : ''}`;
            const data = await fetchTasksModule(url);
            setExecutions(data.executions);
            setTotal(data.total);
        }
        catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch executions'));
        }
        finally {
            setLoading(false);
        }
    }, [taskName, options?.limit, options?.offset]);
    useEffect(() => {
        refresh();
    }, [refresh]);
    return { executions, total, loading, error, refresh };
}
export function useTaskExecution(taskName, executionId) {
    const [execution, setExecution] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const refresh = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            // Execution details come from tasks module
            const data = await fetchTasksModule(`/hit/tasks/${encodeURIComponent(taskName)}/executions/${encodeURIComponent(executionId)}`);
            setExecution(data);
        }
        catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch execution'));
        }
        finally {
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
    const [error, setError] = useState(null);
    const executeTask = useCallback(async (taskName, triggeredBy) => {
        try {
            setLoading(true);
            setError(null);
            // Execute via local API route that adds project context
            const data = await fetchTasks(`/${encodeURIComponent(taskName)}/execute`, {
                method: 'POST',
                body: JSON.stringify({ triggered_by: triggeredBy }),
            });
            return data;
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to execute task');
            setError(error);
            throw error;
        }
        finally {
            setLoading(false);
        }
    }, []);
    const updateSchedule = useCallback(async (taskName, enabled) => {
        try {
            setLoading(true);
            setError(null);
            // Schedules are managed by tasks module
            const data = await fetchTasksModule(`/hit/tasks/${encodeURIComponent(taskName)}/schedule`, {
                method: 'POST',
                body: JSON.stringify({ enabled }),
            });
            return data;
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to update schedule');
            setError(error);
            throw error;
        }
        finally {
            setLoading(false);
        }
    }, []);
    return { executeTask, updateSchedule, loading, error };
}
export function useAllExecutions(options) {
    const [executions, setExecutions] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const refresh = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const params = new URLSearchParams();
            if (options?.limit)
                params.append('limit', options.limit.toString());
            if (options?.offset)
                params.append('offset', options.offset.toString());
            if (options?.status)
                params.append('status', options.status);
            if (options?.taskName)
                params.append('task_name', options.taskName);
            const query = params.toString();
            const url = `/hit/tasks/executions/all${query ? `?${query}` : ''}`;
            const data = await fetchTasksModule(url);
            setExecutions(data.executions);
            setTotal(data.total);
        }
        catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch executions'));
        }
        finally {
            setLoading(false);
        }
    }, [options?.limit, options?.offset, options?.status, options?.taskName]);
    useEffect(() => {
        refresh();
    }, [refresh]);
    return { executions, total, loading, error, refresh };
}
export function useSchedules() {
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const refresh = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            // Schedules come from tasks module - gracefully handle if endpoint doesn't exist
            try {
                const data = await fetchTasksModule('/hit/tasks/schedules');
                setSchedules(data.schedules || []);
            }
            catch (err) {
                // If schedules endpoint doesn't exist (404), that's OK - just use empty array
                if (err instanceof TasksError && err.status === 404) {
                    setSchedules([]);
                }
                else {
                    // For other errors, log but don't fail - schedules are optional
                    console.warn('Failed to fetch schedules:', err);
                    setSchedules([]);
                }
            }
        }
        catch (err) {
            // Don't set error for schedules - they're optional
            setSchedules([]);
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        refresh();
    }, [refresh]);
    return { schedules, loading, error, refresh };
}
//# sourceMappingURL=useTasks.js.map