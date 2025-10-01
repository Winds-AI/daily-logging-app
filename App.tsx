import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import MessageList from './components/MessageList';
import MessageInput from './components/MessageInput';
import Drawer from './components/Drawer';
import PasswordAuth from './components/PasswordAuth';
import ImprovementConfirmationModal from './components/ImprovementConfirmationModal';
import { Message, Task, User, Theme, ThemeRecord, QueuedMessage, ThemeColor, SelfImprovement } from './types';
import { themes } from './themes';
import { transcribeAudio, getSuggestionForMessage, analyzeForSelfImprovement } from './services/api';
import * as db from './services/supabase';

interface UserSettings {
  themeColor: ThemeColor;
}

// Helper function to get initial state from localStorage for client-side state
function getInitialState<T>(key: string, fallback: T): T {
  try {
    const storedValue = localStorage.getItem(key);
    if (storedValue) {
      return JSON.parse(storedValue);
    }
  } catch (error) {
    console.error(`Error parsing localStorage key "${key}":`, error);
  }
  return fallback;
}

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [messageQueue, setMessageQueue] = useState<QueuedMessage[]>(() => getInitialState('chat_app_messageQueue', []));
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = getInitialState('chat_app_currentUser', 'Meet');
    return (saved === 'Meet' || saved === 'Khushi') ? saved : 'Meet';
  });
  const [tasks, setTasks] = useState<Record<User, Task[]>>({ Meet: [], Khushi: [] });
  const [selfImprovements, setSelfImprovements] = useState<SelfImprovement[]>([]);
  const [isImprovementModalOpen, setImprovementModalOpen] = useState(false);
  const [improvementSuggestion, setImprovementSuggestion] = useState<{
    improvement_text: string;
    motivational_subtitle: string;
  } | null>(null);
  const [userSettings, setUserSettings] = useState<Record<User, UserSettings>>({
    Meet: { themeColor: 'fuchsia' },
    Khushi: { themeColor: 'cyan' },
  });
  const [isLeftDrawerOpen, setLeftDrawerOpen] = useState(false);
  const [isRightDrawerOpen, setRightDrawerOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const authCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('daily_log_auth='));

    if (authCookie && authCookie.split('=')[1] === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchInitialData = async () => {
        const [initialTasks, initialImprovements, initialThemes, initialMessages] = await Promise.all([
            db.supabase.from('tasks').select('*'),
            db.getSelfImprovements(),
            db.supabase.from('themes').select('*'),
            db.supabase.from('messages').select('*').order('timestamp', { ascending: true })
        ]);

        if (initialTasks.data) {
            const userTasks = { Meet: [], Khushi: [] };
            initialTasks.data.forEach(task => {
                if (task.user === 'Meet' || task.user === 'Khushi') {
                    userTasks[task.user].push(task);
                }
            });
            setTasks(userTasks);
        }
        if (initialImprovements) {
            setSelfImprovements(initialImprovements);
        }
        if (initialThemes.data) {
            const userThemes = { Meet: { themeColor: 'fuchsia' }, Khushi: { themeColor: 'cyan' } };
            initialThemes.data.forEach(theme => {
                if (theme.user === 'Meet' || theme.user === 'Khushi') {
                    userThemes[theme.user] = { themeColor: theme.theme.themeColor };
                }
            });
            setUserSettings(userThemes);
        }
        if (initialMessages.data) {
          setMessages(initialMessages.data as Message[]);
        }
    };

    fetchInitialData();

    const channel = db.supabase
      .channel('daily-log-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'daily_log', table: 'messages' },
        (payload) => {
          setMessages((prevMessages) => [...prevMessages, payload.new as Message]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'daily_log', table: 'messages' },
        (payload) => {
            setMessages((prevMessages) =>
                prevMessages.map((msg) => (msg.id === payload.new.id ? (payload.new as Message) : msg))
            );
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'daily_log', table: 'tasks' },
        (payload) => {
          const { new: newTask, old: oldTask, eventType } = payload;
          const user = (newTask?.user || oldTask?.user) as User;
          if (!user) return;

          setTasks(prev => {
            const userTasks = prev[user] || [];
            if (eventType === 'INSERT') {
              return { ...prev, [user]: [...userTasks, newTask as Task] };
            }
            if (eventType === 'UPDATE') {
              return { ...prev, [user]: userTasks.map(t => t.id === newTask.id ? newTask as Task : t) };
            }
            if (eventType === 'DELETE') {
              return { ...prev, [user]: userTasks.filter(t => t.id !== oldTask.id) };
            }
            return prev;
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'daily_log', table: 'self_improvements' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setSelfImprovements((prev) => [payload.new as SelfImprovement, ...prev].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
          } else if (payload.eventType === 'UPDATE') {
            setSelfImprovements((prev) =>
              prev.map((item) => (item.id === payload.new.id ? (payload.new as SelfImprovement) : item))
            );
          } else if (payload.eventType === 'DELETE') {
            setSelfImprovements((prev) => prev.filter((item) => item.id !== payload.old.id));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'daily_log', table: 'themes' },
        (payload) => {
          const { new: newTheme } = payload;
          setUserSettings((prevSettings) => ({
            ...prevSettings,
            [(newTheme as ThemeRecord).user]: { themeColor: (newTheme as ThemeRecord).theme.themeColor },
          }));
        }
      )
      .subscribe();

    return () => {
      db.supabase.removeChannel(channel);
    };
  }, [isAuthenticated]);
  
  useEffect(() => {
    try {
      localStorage.setItem('chat_app_currentUser', JSON.stringify(currentUser));
    } catch (error) {
      console.error('Failed to save current user to localStorage:', error);
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem('chat_app_messageQueue', JSON.stringify(messageQueue));
    } catch (error) {
      console.error('Failed to save message queue to localStorage:', error);
    }
  }, [messageQueue]);

  const activeTheme = themes[userSettings[currentUser]?.themeColor || 'fuchsia'];
  const meetTheme = themes[userSettings.Meet?.themeColor || 'fuchsia'];
  const khushiTheme = themes[userSettings.Khushi?.themeColor || 'cyan'];

  const handleAddToQueue = () => {
    if (newMessage.trim() === '') return;
    const newQueuedMessage: QueuedMessage = {
      id: Date.now(),
      text: newMessage,
      timestamp: new Date().toISOString(),
    };
    setMessageQueue(prev => [...prev, newQueuedMessage]);
    setNewMessage('');
  };

  const handleDeleteFromQueue = (id: number) => {
    setMessageQueue(prev => prev.filter(item => item.id !== id));
  };

  const handleSendQueue = async () => {
    if (messageQueue.length === 0) return;

    const combinedText = messageQueue
      .map(item => `[${new Date(item.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}] ${item.text}`)
      .join('\n');

    const userMessage: Omit<Message, 'id'> = {
      text: combinedText,
      timestamp: new Date().toISOString(),
      sender: currentUser,
      suggestionLoading: true,
    };
    
    setMessageQueue([]);
    
    const { data, error } = await db.supabase.from('messages').insert(userMessage).select().single();

    if (error) {
        console.error("Failed to send message:", error);
        return;
    }

    const sentMessage = data;
    const messageId = sentMessage.id;
    const messageText = sentMessage.text;

    try {
        const suggestion = await getSuggestionForMessage(messageText);
        const suggestionUpdate = { 'suggestion': suggestion, 'suggestionLoading': false };
        await db.supabase.from('messages').update(suggestionUpdate).eq('id', messageId);
    } catch (err) {
        console.error("Failed to get suggestion:", err);
        const errorUpdate = { 'suggestion': "Sorry, an error occurred.", 'suggestionLoading': false };
        await db.supabase.from('messages').update(errorUpdate).eq('id', messageId);
    }

    try {
      const analysis = await analyzeForSelfImprovement(messageText);
      if (analysis && analysis.improvement_text) {
        setImprovementSuggestion(analysis);
        setImprovementModalOpen(true);
      }
    } catch (err) {
      console.error("Failed to analyze for self-improvement:", err);
    }
  };

  const handleSendVoiceMessage = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const transcriptionPromise = transcribeAudio(audioBlob);
      const audioBase64: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      const userMessage: Omit<Message, 'id'> = {
        text: '(voice note)',
        timestamp: new Date().toISOString(),
        sender: currentUser,
        suggestionLoading: false,
        audio: audioBase64,
      };
      await db.supabase.from('messages').insert(userMessage);

      const transcribedText = await transcriptionPromise;
      if (typeof transcribedText === 'string') {
        setNewMessage(transcribedText);
      }
    } catch (error) {
      console.error('Failed to handle voice message:', error);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleVoiceClick = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const options = { mimeType: 'audio/webm' };
        const mediaRecorder = new MediaRecorder(stream, MediaRecorder.isTypeSupported(options.mimeType) ? options : undefined);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        mediaRecorder.ondataavailable = (event) => event.data.size > 0 && audioChunksRef.current.push(event.data);
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
          handleSendVoiceMessage(audioBlob);
          stream.getTracks().forEach(track => track.stop());
        };
        mediaRecorder.start();
        setIsRecording(true);
      } catch (error) {
        console.error("Error accessing microphone:", error);
        alert("Could not access microphone. Please check permissions.");
      }
    }
  };
  
  const handleUserChange = (user: User) => {
      setCurrentUser(user);
      setLeftDrawerOpen(false);
      setRightDrawerOpen(false);
  }

  const handleThemeChange = async (user: User, color: ThemeColor) => {
    await db.supabase.from('themes').upsert({ user, theme: { themeColor: color } });
  };

  const handleToggleActiveDrawer = () => {
    if (currentUser === 'Meet') {
      setLeftDrawerOpen(true);
    } else {
      setRightDrawerOpen(true);
    }
  };

  // Task Handlers
  const handleAddTask = async (user: User, taskText: string) => {
    await db.supabase.from('tasks').insert({ text: taskText, completed: false, user });
  };
  const handleToggleTask = async (user: User, taskId: string) => {
    const task = tasks[user].find(t => t.id === taskId);
    if (task) await db.supabase.from('tasks').update({ completed: !task.completed }).eq('id', taskId);
  };
  const handleUpdateTask = async (user: User, taskId: string, newText: string) => {
     await db.supabase.from('tasks').update({ text: newText }).eq('id', taskId);
  };
  const handleDeleteTask = async (user: User, taskId: string) => {
    await db.supabase.from('tasks').delete().eq('id', taskId);
  };

  // Self-Improvement Handlers
  const handleConfirmImprovement = async () => {
    if (!improvementSuggestion) return;
    await db.addSelfImprovement(
      currentUser,
      improvementSuggestion.improvement_text,
      improvementSuggestion.motivational_subtitle
    );
    setImprovementModalOpen(false);
    setImprovementSuggestion(null);
  };
  const handleCancelImprovement = () => {
    setImprovementModalOpen(false);
    setImprovementSuggestion(null);
  };
  const handleUpdateSelfImprovement = async (id: string, newText: string) => {
    await db.updateSelfImprovement(id, { improvement_text: newText });
  };
  const handleDeleteSelfImprovement = async (id: string) => {
    await db.deleteSelfImprovement(id);
  };
  const handleToggleSelfImprovement = async (id: string, completed: boolean) => {
    await db.toggleSelfImprovement(id, completed);
  };

  if (!isAuthenticated) {
    return <PasswordAuth onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className={`h-screen w-screen flex flex-col ${activeTheme.appBg} text-gray-100 font-sans`}>
      <div className="relative flex h-full w-full justify-center">
        <Drawer
          user="Meet"
          tasks={tasks.Meet}
          selfImprovements={selfImprovements}
          isOpen={isLeftDrawerOpen}
          onClose={() => setLeftDrawerOpen(false)}
          onAddTask={handleAddTask}
          onToggleTask={handleToggleTask}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          onUpdateSelfImprovement={handleUpdateSelfImprovement}
          onDeleteSelfImprovement={handleDeleteSelfImprovement}
          onToggleSelfImprovement={handleToggleSelfImprovement}
          position="left"
          theme={meetTheme.drawer}
          selectedThemeColor={userSettings.Meet?.themeColor || 'fuchsia'}
          onThemeChange={(color) => handleThemeChange('Meet', color)}
        />

        <main className={`flex flex-col h-full w-full max-w-2xl sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl ${activeTheme.chatWindowBg} shadow-lg`}>
          <Header
            currentUser={currentUser}
            onUserChange={handleUserChange}
            onToggleActiveDrawer={handleToggleActiveDrawer}
            theme={activeTheme}
          />
          <MessageList messages={messages} currentUser={currentUser} theme={activeTheme} />
          <MessageInput
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onAddToQueue={handleAddToQueue}
            onSendQueue={handleSendQueue}
            onDeleteFromQueue={handleDeleteFromQueue}
            queue={messageQueue}
            theme={activeTheme}
            isRecording={isRecording}
            isTranscribing={isTranscribing}
            onVoiceClick={handleVoiceClick}
          />
        </main>

        <Drawer
          user="Khushi"
          tasks={tasks.Khushi}
          selfImprovements={selfImprovements}
          isOpen={isRightDrawerOpen}
          onClose={() => setRightDrawerOpen(false)}
          onAddTask={handleAddTask}
          onToggleTask={handleToggleTask}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          onUpdateSelfImprovement={handleUpdateSelfImprovement}
          onDeleteSelfImprovement={handleDeleteSelfImprovement}
          onToggleSelfImprovement={handleToggleSelfImprovement}
          position="right"
          theme={khushiTheme.drawer}
          selectedThemeColor={userSettings.Khushi?.themeColor || 'cyan'}
          onThemeChange={(color) => handleThemeChange('Khushi', color)}
        />

        <ImprovementConfirmationModal
            isOpen={isImprovementModalOpen}
            improvementText={improvementSuggestion?.improvement_text || ''}
            onConfirm={handleConfirmImprovement}
            onCancel={handleCancelImprovement}
            theme={activeTheme.drawer}
        />
      </div>
    </div>
  );
};

export default App;