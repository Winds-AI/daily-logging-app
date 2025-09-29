import React, { useState, useEffect } from 'react';
import { Task, User, THEME_COLORS, ThemeColor } from '../types';
import { CloseIcon, PlusIcon, TrashIcon, EditIcon, CheckIcon } from './icons';

interface DrawerProps {
  user: User;
  tasks: Task[];
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (user: User, taskText: string) => void;
  onToggleTask: (user: User, taskId: string) => void;
  onUpdateTask: (user: User, taskId: string, newText: string) => void;
  onDeleteTask: (user: User, taskId: string) => void;
  position: 'left' | 'right';
  theme: {
    drawerBg: string;
    drawerText: string;
    drawerHeaderBg: string;
    inputBg: string;
    buttonColor: string;
    accentColor: string;
  };
  selectedThemeColor: ThemeColor;
  onThemeChange: (color: ThemeColor) => void;
}

const colorSwatchClasses: Record<ThemeColor, string> = {
    fuchsia: 'bg-fuchsia-500 hover:bg-fuchsia-400',
    cyan: 'bg-cyan-500 hover:bg-cyan-400',
    emerald: 'bg-emerald-500 hover:bg-emerald-400',
    orange: 'bg-orange-500 hover:bg-orange-400',
    rose: 'bg-rose-500 hover:bg-rose-400',
};

const Drawer: React.FC<DrawerProps> = ({
  user,
  tasks,
  isOpen,
  onClose,
  onAddTask,
  onToggleTask,
  onUpdateTask,
  onDeleteTask,
  position,
  theme,
  selectedThemeColor,
  onThemeChange
}) => {
  const [newTaskText, setNewTaskText] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskText, setEditingTaskText] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setEditingTaskId(null);
    }
  }, [isOpen]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskText.trim()) {
      onAddTask(user, newTaskText);
      setNewTaskText('');
    }
  };
  
  const handleEditClick = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingTaskText(task.text);
  };
  
  const handleUpdateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTaskId && editingTaskText.trim()) {
      onUpdateTask(user, editingTaskId, editingTaskText);
      setEditingTaskId(null);
      setEditingTaskText('');
    }
  };

  const transformClass =
    position === 'left'
      ? isOpen
        ? 'translate-x-0'
        : '-translate-x-full'
      : isOpen
      ? 'translate-x-0'
      : 'translate-x-full';

  return (
    <>
      <div
        className={`fixed top-0 ${position === 'left' ? 'left-0' : 'right-0'} z-30 h-full w-full max-w-sm sm:max-w-xs ${theme.drawerBg} ${theme.drawerText} shadow-lg transition-transform duration-300 ease-in-out ${transformClass} flex flex-col`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`drawer-title-${user}`}
      >
        <header className={`flex items-center justify-between p-4 border-b ${theme.drawerHeaderBg}`}>
          <h2 id={`drawer-title-${user}`} className="text-xl font-semibold">{user}'s Tasks</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10" aria-label="Close task list">
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>

        <div className={`p-4 border-b ${theme.drawerHeaderBg}`}>
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Theme Color</h3>
            <div className="flex justify-around">
                {Object.entries(THEME_COLORS).map(([colorKey, colorName]) => (
                    <button
                        key={colorKey}
                        onClick={() => onThemeChange(colorKey as ThemeColor)}
                        className={`w-8 h-8 rounded-full focus:outline-none ring-offset-2 ring-offset-gray-800 transition-all duration-150 ${colorSwatchClasses[colorKey as ThemeColor]} ${selectedThemeColor === colorKey ? 'ring-2 ring-white' : 'ring-0 ring-transparent'}`}
                        aria-label={`Set theme to ${colorName}`}
                    />
                ))}
            </div>
        </div>
        
        <div className="flex-grow p-4 overflow-y-auto">
          <ul className="space-y-2">
            {tasks.map((task) => (
              <li key={task.id} className="flex items-center p-3 sm:p-2 rounded-md hover:bg-white/5 min-h-[48px] sm:min-h-[44px]">
                {editingTaskId === task.id ? (
                  <form onSubmit={handleUpdateTask} className="flex items-center w-full space-x-2">
                    <input
                      type="text"
                      value={editingTaskText}
                      onChange={(e) => setEditingTaskText(e.target.value)}
                      className={`w-full ${theme.inputBg} border border-gray-500 rounded-md py-2 sm:py-1 px-3 sm:px-2 focus:outline-none focus:ring-2 ${theme.accentColor} text-gray-100 placeholder-gray-400 text-base`}
                      autoFocus
                      aria-label="Edit task input"
                    />
                    <button type="submit" className="text-gray-400 hover:text-green-400 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Save task">
                      <CheckIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                     <button type="button" onClick={() => setEditingTaskId(null)} className="text-gray-400 hover:text-gray-100 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Cancel edit">
                      <CloseIcon className="w-5 h-5" />
                    </button>
                  </form>
                ) : (
                  <>
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => onToggleTask(user, task.id)}
                      className={`w-5 h-5 rounded border-gray-500 bg-transparent ${theme.accentColor} focus:ring-2 ${theme.accentColor} min-w-[20px] min-h-[20px]`}
                    />
                    <span className={`ml-3 flex-grow ${task.completed ? 'line-through text-gray-400' : ''} text-sm sm:text-base`}>
                      {task.text}
                    </span>
                    <button onClick={() => handleEditClick(task)} className="ml-2 text-gray-500 hover:text-yellow-400 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label={`Edit task: ${task.text}`}>
                      <EditIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => onDeleteTask(user, task.id)} className="ml-2 text-gray-500 hover:text-red-500 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label={`Delete task: ${task.text}`}>
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>

        <form onSubmit={handleAddTask} className={`p-3 sm:p-4 border-t ${theme.drawerHeaderBg} flex items-center space-x-2`}>
          <input
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="Add new task..."
            className={`w-full ${theme.inputBg} border border-gray-500 rounded-md py-2.5 sm:py-2 px-3 focus:outline-none focus:ring-2 ${theme.accentColor} text-gray-100 placeholder-gray-400 text-base`}
            aria-label="New task input"
          />
          <button type="submit" className={`${theme.buttonColor} text-white rounded-md p-2.5 sm:p-2 flex items-center justify-center hover:opacity-90 transition-opacity min-w-[44px] min-h-[44px]`} aria-label="Add task">
            <PlusIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </form>
      </div>
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50"
          onClick={onClose}
          aria-hidden="true"
        ></div>
      )}
    </>
  );
};

export default Drawer;
