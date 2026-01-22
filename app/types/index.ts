// types/index.ts

export type Priority = 'low' | 'medium' | 'urgent';

export type TaskStatus = 'todo' | 'in-progress' | 'finished';

export interface Task {
  id: string;
  title: string;
  project: string;
  priority: Priority;
  status: TaskStatus;
  createdAt: string; // ISO string
  startedAt?: string; // ISO string (when moved to in-progress)
  completedAt?: string; // ISO string (when moved to finished)
}

export type ColumnType = {
  id: TaskStatus;
  title: string;
};