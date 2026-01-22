'use client';

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, X, Pencil, Trash2, Clock, Calendar, CheckCircle2, Circle } from 'lucide-react';
import { Task, TaskStatus, Priority } from '@/types';
import { format, differenceInMinutes, differenceInHours } from 'date-fns';

// Utility for class names
function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: 'todo', title: 'To Do' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'finished', title: 'Completed' },
];

// Updated Colors for Dark Mode High Contrast
const PRIORITY_STYLES: Record<Priority, string> = {
  low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  urgent: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

export default function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  
  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    project: '',
    priority: 'low' as Priority,
  });

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem('kanban-tasks');
    if (saved) {
      setTasks(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('kanban-tasks', JSON.stringify(tasks));
    }
  }, [tasks, isMounted]);

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const task = tasks.find((t) => t.id === draggableId);
    if (!task) return;

    const newStatus = destination.droppableId as TaskStatus;
    const now = new Date().toISOString();
    
    const updatedTask = { ...task, status: newStatus };

    if (newStatus === 'in-progress' && task.status !== 'in-progress') {
      if (!updatedTask.startedAt) updatedTask.startedAt = now; 
      updatedTask.completedAt = undefined;
    }

    if (newStatus === 'finished') {
      updatedTask.completedAt = now;
      if (!updatedTask.startedAt) updatedTask.startedAt = now;
    }

    if (newStatus === 'todo') {
      updatedTask.startedAt = undefined;
      updatedTask.completedAt = undefined;
    }

    const newTasks = Array.from(tasks);
    const taskIndex = newTasks.findIndex((t) => t.id === draggableId);
    newTasks.splice(taskIndex, 1);
    newTasks.push(updatedTask);
    
    setTasks(newTasks);
  };

  const openAddDialog = () => {
    setEditingTask(null);
    setFormData({ title: '', project: '', priority: 'low' });
    setIsDialogOpen(true);
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setFormData({ title: task.title, project: task.project, priority: task.priority });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.title.trim()) return;

    if (editingTask) {
      setTasks((prev) =>
        prev.map((t) => (t.id === editingTask.id ? { ...t, ...formData } : t))
      );
    } else {
      const newTask: Task = {
        id: crypto.randomUUID(),
        title: formData.title,
        project: formData.project,
        priority: formData.priority,
        status: 'todo',
        createdAt: new Date().toISOString(),
      };
      setTasks((prev) => [...prev, newTask]);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      setIsDialogOpen(false);
    }
  };

  const getDuration = (task: Task) => {
    if (!task.startedAt || !task.completedAt) return null;
    const start = new Date(task.startedAt);
    const end = new Date(task.completedAt);
    const minutes = differenceInMinutes(end, start);
    
    if (minutes < 60) return `${minutes}m`;
    const hours = differenceInHours(end, start);
    return `${hours}h ${minutes % 60}m`;
  };

  if (!isMounted) return null;

  return (
    // Main Container: Dark Mode Background
    <div className="min-h-screen bg-neutral-950 text-neutral-200 flex flex-col font-sans selection:bg-indigo-500/30">
      
      {/* Header */}
      <header className="px-8 py-6 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            Task Orchestrator
            </h1>
            <p className="text-xs text-neutral-500 mt-1 uppercase tracking-widest">Workspace</p>
        </div>
        <button
            onClick={openAddDialog}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-indigo-500/20"
        >
            <Plus size={18} /> New Task
        </button>
      </header>

      {/* Board Area */}
      <div className="flex-1 overflow-x-auto p-8">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-6 h-full min-w-max">
            {COLUMNS.map((col) => (
              <div key={col.id} className="w-[400px] flex flex-col">
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4 px-2">
                    <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", 
                            col.id === 'todo' ? 'bg-neutral-500' : 
                            col.id === 'in-progress' ? 'bg-indigo-500' : 'bg-emerald-500'
                        )} />
                        <h2 className="font-medium text-neutral-300 tracking-wide text-sm">{col.title}</h2>
                    </div>
                    <span className="bg-neutral-800 text-neutral-400 py-0.5 px-2.5 rounded-md text-xs font-mono">
                        {tasks.filter((t) => t.status === col.id).length}
                    </span>
                </div>

                {/* Drop Zone */}
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={cn(
                        "flex-1 rounded-xl p-2 transition-colors border border-dashed border-transparent",
                        snapshot.isDraggingOver ? "bg-neutral-900/50 border-neutral-700" : "bg-transparent"
                      )}
                    >
                      {tasks
                        .filter((t) => t.status === col.id)
                        .map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onClick={() => openEditDialog(task)}
                                className={cn(
                                    "mb-3 bg-neutral-900 border border-neutral-800 p-4 rounded-xl group hover:border-neutral-700 transition-all cursor-grab active:cursor-grabbing",
                                    snapshot.isDragging ? "shadow-2xl shadow-black ring-2 ring-indigo-500/50 rotate-2" : "shadow-sm"
                                )}
                              >
                                <div className="flex justify-between items-start mb-3">
                                  <span
                                    className={cn(
                                      'text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider',
                                      PRIORITY_STYLES[task.priority]
                                    )}
                                  >
                                    {task.priority}
                                  </span>
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Pencil size={14} className="text-neutral-500 hover:text-indigo-400" />
                                  </div>
                                </div>
                                
                                <h3 className="text-neutral-200 font-medium leading-snug mb-1">{task.title}</h3>
                                
                                {task.project && (
                                  <p className="text-xs text-neutral-500 font-mono mb-4">{task.project}</p>
                                )}

                                <div className="flex items-center justify-between pt-3 border-t border-neutral-800/50">
                                    <div className="flex items-center gap-1.5 text-xs text-neutral-600">
                                        <Calendar size={12} />
                                        <span>{format(new Date(task.createdAt), 'MMM d')}</span>
                                    </div>

                                    {task.status === 'finished' && getDuration(task) && (
                                    <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium bg-emerald-500/5 px-2 py-0.5 rounded">
                                        <Clock size={12} />
                                        {getDuration(task)}
                                    </div>
                                    )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>

      {/* MODAL DIALOG */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 w-full max-w-md p-6 rounded-2xl shadow-2xl">
            <div className="flex justify-between items-center mb-6 border-b border-neutral-800 pb-4">
              <h3 className="text-lg font-semibold text-neutral-200">
                {editingTask ? 'Edit Task' : 'Create New Task'}
              </h3>
              <button onClick={() => setIsDialogOpen(false)} className="text-neutral-500 hover:text-neutral-300 transition">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Description</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-neutral-200 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition placeholder:text-neutral-700"
                  placeholder="Task title..."
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Project Context</label>
                <input
                  type="text"
                  value={formData.project}
                  onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-neutral-200 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition placeholder:text-neutral-700"
                  placeholder="e.g. Backend, UI Design"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">Priority Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['low', 'medium', 'urgent'] as Priority[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => setFormData({ ...formData, priority: p })}
                      className={cn(
                        'flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide border transition-all',
                        formData.priority === p
                          ? PRIORITY_STYLES[p] + ' ring-1 ring-offset-0 ' + (p==='urgent' ? 'ring-rose-500/50' : p==='medium' ? 'ring-amber-500/50' : 'ring-emerald-500/50')
                          : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:border-neutral-700'
                      )}
                    >
                      {formData.priority === p && <Circle size={8} fill="currentColor" />}
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8 pt-4 border-t border-neutral-800">
              {editingTask && (
                <button
                  onClick={() => handleDelete(editingTask.id)}
                  className="px-4 py-2.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition"
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              )}
              <div className="flex-1"></div>
              <button
                onClick={() => setIsDialogOpen(false)}
                className="px-5 py-2.5 text-neutral-400 hover:text-neutral-200 font-medium transition text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition font-medium text-sm shadow-lg shadow-indigo-900/20"
              >
                {editingTask ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}