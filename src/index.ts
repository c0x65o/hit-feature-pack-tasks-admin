/**
 * @hit/feature-pack-tasks-admin
 * 
 * Admin dashboard feature pack for task management.
 * 
 * Components are exported individually for optimal tree-shaking.
 * When used with the route loader system, only the requested component is bundled.
 */

// Pages - exported individually for tree-shaking
export {
  TaskList,
  TaskListPage,
  TaskDetail,
  TaskDetailPage,
  TaskExecution,
  TaskExecutionPage,
} from './pages/index';

// Hooks
export * from './hooks/useTasks';

