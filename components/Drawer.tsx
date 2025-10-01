import React, { useState, useEffect } from 'react';
import { Task, User, THEME_COLORS, ThemeColor, SelfImprovement } from '../types';
import { CloseIcon, PlusIcon, TrashIcon, EditIcon, CheckIcon } from './icons';

type DrawerView = 'tasks' | 'improvements';

interface DrawerProps {
  user: User;
  tasks: Task[];
  selfImprovements: SelfImprovement[];
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (user: User, taskText: string) => void;
  onToggleTask: (user: User, taskId: string) => void;
  onUpdateTask: (user: User, taskId: string, newText: string) => void;
  onDeleteTask: (user: User, taskId: string) => void;
  onUpdateSelfImprovement: (id: string, newText: string) => void;
  onDeleteSelfImprovement: (id: string) => void;
  onToggleSelfImprovement: (id: string, completed: boolean) => void;
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
  selfImprovements,
  isOpen,
  onClose,
  onAddTask,
  onToggleTask,
  onUpdateTask,
  onDeleteTask,
  onUpdateSelfImprovement,
  onDeleteSelfImprovement,
  onToggleSelfImprovement,
  position,
  theme,
  selectedThemeColor,
  onThemeChange,
}) => {
  const [activeView, setActiveView] = useState<DrawerView>('tasks');
  const [newTaskText, setNewTaskText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setEditingId(null);
      setActiveView('tasks');
    }
  }, [isOpen]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskText.trim()) {
      onAddTask(user, newTaskText);
      setNewTaskText('');
    }
  };

  const handleEditClick = (item: Task | SelfImprovement) => {
    setEditingId(item.id);
    setEditingText('improvement_text' in item ? item.improvement_text : item.text);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !editingText.trim()) return;

    if (activeView === 'tasks') {
      onUpdateTask(user, editingId, editingText);
    } else {
      onUpdateSelfImprovement(editingId, editingText);
    }
    setEditingId(null);
    setEditingText('');
  };

  const transformClass =
    position === 'left'
      ? isOpen
        ? 'translate-x-0'
        : '-translate-x-full'
      : isOpen
      ? 'translate-x-0'
      : 'translate-x-full';

  const accentColorClass = `focus:ring-${selectedThemeColor}-500`;

  const renderTaskList = () => (
    <ul className="space-y-2">
      {tasks.map((task) => (
        <li key={task.id} className="flex items-center p-3 sm:p-2 rounded-md hover:bg-white/5 min-h-[48px] sm:min-h-[44px]">
          {editingId === task.id ? (
            renderEditForm()
          ) : (
            <>
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => onToggleTask(user, task.id)}
                className={`w-5 h-5 rounded border-gray-500 bg-transparent ${theme.accentColor} focus:ring-2 ${accentColorClass} min-w-[20px] min-h-[20px]`}
              />
              <span className={`ml-3 flex-grow ${task.completed ? 'line-through text-gray-400' : ''} text-sm sm:text-base`}>
                {task.text}
              </span>
              <button onClick={() => handleEditClick(task)} className="ml-2 text-gray-500 hover:text-yellow-400 p-2" aria-label={`Edit task: ${task.text}`}>
                <EditIcon className="w-5 h-5" />
              </button>
              <button onClick={() => onDeleteTask(user, task.id)} className="ml-2 text-gray-500 hover:text-red-500 p-2" aria-label={`Delete task: ${task.text}`}>
                <TrashIcon className="w-5 h-5" />
              </button>
            </>
          )}
        </li>
      ))}
    </ul>
  );

  const renderImprovementList = () => (
    <ul className="space-y-3">
      {selfImprovements.map((item) => (
        <li key={item.id} className="p-3 rounded-md hover:bg-white/5">
          {editingId === item.id ? (
            renderEditForm()
          ) : (
            <div className="flex items-start">
              <input
                type="checkbox"
                checked={item.completed}
                onChange={() => onToggleSelfImprovement(item.id, !item.completed)}
                className={`mt-1 w-5 h-5 rounded border-gray-500 bg-transparent ${theme.accentColor} focus:ring-2 ${accentColorClass} min-w-[20px] min-h-[20px]`}
                disabled={item.user_text !== user}
              />
              <div className="ml-3 flex-grow">
                <span className={`${item.completed ? 'line-through text-gray-400' : ''} text-sm sm:text-base`}>
                  {item.improvement_text}
                </span>
                <p className={`text-xs text-gray-400 mt-1 ${item.completed ? 'line-through' : ''}`}>
                  {item.motivational_subtitle}
                </p>
              </div>
              {item.user_text === user && (
                <div className="flex items-center ml-2">
                  <button onClick={() => handleEditClick(item)} className="text-gray-500 hover:text-yellow-400 p-2" aria-label={`Edit improvement: ${item.improvement_text}`}>
                    <EditIcon className="w-5 h-5" />
                  </button>
                  <button onClick={() => onDeleteSelfImprovement(item.id)} className="text-gray-500 hover:text-red-500 p-2" aria-label={`Delete improvement: ${item.improvement_text}`}>
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              )}
               {item.user_text !== user && (
                 <span className="text-xs font-semibold text-gray-500 ml-2 px-2 py-1 rounded-full bg-white/10">{item.user_text}</span>
               )}
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  const renderEditForm = () => (
     <form onSubmit={handleUpdate} className="flex items-center w-full space-x-2">
      <input
        type="text"
        value={editingText}
        onChange={(e) => setEditingText(e.target.value)}
        className={`w-full ${theme.inputBg} border border-gray-500 rounded-md py-2 sm:py-1 px-3 sm:px-2 focus:outline-none focus:ring-2 ${theme.accentColor} text-gray-100 placeholder-gray-400 text-base`}
        autoFocus
        aria-label="Edit item"
      />
      <button type="submit" className="text-gray-400 hover:text-green-400 p-2" aria-label="Save changes">
        <CheckIcon className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>
      <button type="button" onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-100 p-2" aria-label="Cancel edit">
        <CloseIcon className="w-5 h-5" />
      </button>
    </form>
  )

  return (
    <>
      <div
        className={`fixed top-0 ${position === 'left' ? 'left-0' : 'right-0'} z-30 h-full w-full max-w-sm sm:max-w-xs ${theme.drawerBg} ${theme.drawerText} shadow-lg transition-transform duration-300 ease-in-out ${transformClass} flex flex-col`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`drawer-title-${user}`}
      >
        <header className={`flex items-center justify-between p-4 border-b ${theme.drawerHeaderBg}`}>
          <h2 id={`drawer-title-${user}`} className="text-xl font-semibold">{user}'s Space</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10" aria-label="Close panel">
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>

        <div className={`p-2 border-b ${theme.drawerHeaderBg}`}>
          <div className="flex bg-black/20 rounded-md p-1 space-x-1">
            <button
              onClick={() => setActiveView('tasks')}
              className={`w-1/2 rounded p-1.5 text-sm font-semibold transition-colors duration-200 ${activeView === 'tasks' ? `${theme.buttonColor} text-white shadow-sm` : 'text-gray-400 hover:bg-white/5'}`}
            >
              Tasks
            </button>
            <button
              onClick={() => setActiveView('improvements')}
              className={`w-1/2 rounded p-1.5 text-sm font-semibold transition-colors duration-200 ${activeView === 'improvements' ? `${theme.buttonColor} text-white shadow-sm` : 'text-gray-400 hover:bg-white/5'}`}
            >
              Improvements
            </button>
          </div>
        </div>

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
          {activeView === 'tasks' ? renderTaskList() : renderImprovementList()}
        </div>

        {activeView === 'tasks' && (
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
        )}
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
