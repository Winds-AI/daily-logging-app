import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import MessageList from './components/MessageList';
import MessageInput from './components/MessageInput';
import Drawer from './components/Drawer';
import PasswordAuth from './components/PasswordAuth';
import { Message, Task, User, Theme, ThemeRecord, QueuedMessage, ThemeColor } from './types';
import { themes } from './themes';
import { transcribeAudio, getSuggestionForMessage } from './services/api.ts';
import { supabase } from './services/supabase.ts';

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
    // Check if user is already authenticated via cookie
    const authCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('daily_log_auth='));

    if (authCookie && authCookie.split('=')[1] === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        (payload) => {
          setMessages((prevMessages) => [...prevMessages, payload.new as Message]);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          const { new: newTask, old: oldTask } = payload;
          if (payload.eventType === 'INSERT') {
            setTasks((prevTasks) => ({
              ...prevTasks,
              [(newTask as Task).user]: [...prevTasks[(newTask as Task).user], newTask as Task],
            }));
          } else if (payload.eventType === 'UPDATE') {
            setTasks((prevTasks) => ({
              ...prevTasks,
              [(newTask as Task).user]: prevTasks[(newTask as Task).user].map((task) =>
                task.id === (newTask as Task).id ? (newTask as Task) : task
              ),
            }));
          } else if (payload.eventType === 'DELETE') {
            setTasks((prevTasks) => ({
              ...prevTasks,
              [(oldTask as Task).user]: prevTasks[(oldTask as Task).user].filter(
                (task) => task.id !== (oldTask as Task).id
              ),
            }));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'themes' },
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
      supabase.removeChannel(channel);
    };
  }, []);
  
  // Save current user to localStorage (client-side preference)
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
      .map(item => `[${item.timestamp}] ${item.text}`)
      .join('\n');

    const userMessage: Omit<Message, 'id'> = {
      text: combinedText,
      timestamp: new Date().toISOString(),
      sender: currentUser,
      suggestionLoading: true,
    };
    
    setMessageQueue([]); // Clear the queue immediately
    
    const { data, error } = await supabase.from('messages').insert(userMessage).select().single();

    if (error) {
        console.error("Failed to send message:", error);
        return;
    }

    const messageId = data.id;

    try {
        const suggestion = await getSuggestionForMessage(userMessage.text);
        const suggestionUpdate = {
            'suggestion': suggestion,
            'suggestionLoading': false,
        };
        await supabase.from('messages').update(suggestionUpdate).eq('id', messageId);
    } catch (error) {
        console.error("Failed to get suggestion:", error);
        const errorUpdate = {
            'suggestion': "Sorry, an error occurred while getting a suggestion.",
            'suggestionLoading': false,
        };
        await supabase.from('messages').update(errorUpdate).eq('id', messageId);
    }
  };

  const handleSendVoiceMessage = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      // Start transcription immediately
      const transcriptionPromise = transcribeAudio(audioBlob);

      // Convert audio to base64 for DB storage
      const audioBase64: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          const base64 = dataUrl.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      // Save audio to DB immediately (with placeholder text)
      try {
        const userMessage: Omit<Message, 'id'> = {
          text: '(voice note)',
          timestamp: new Date().toISOString(),
          sender: currentUser,
          suggestionLoading: false,
          audio: audioBase64,
        };
        await supabase.from('messages').insert(userMessage);
      } catch (dbError) {
        console.error('Failed to save audio message:', dbError);
      }

      // Wait for transcription and render it in the textbox
      try {
        const transcribedText = await transcriptionPromise;
        if (typeof transcribedText === 'string') {
          setNewMessage(transcribedText);
        }
      } catch (txError) {
        console.error('Transcription failed:', txError);
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
        const isSupported = MediaRecorder.isTypeSupported(options.mimeType);
        const mediaRecorder = isSupported ? new MediaRecorder(stream, options) : new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
          audioChunksRef.current = [];
          
          handleSendVoiceMessage(audioBlob);

          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (error) {
        console.error("Error accessing microphone:", error);
        alert("Could not access microphone. Please check your browser permissions.");
      }
    }
  };
  
  const handleUserChange = (user: User) => {
      setCurrentUser(user);
      setLeftDrawerOpen(false);
      setRightDrawerOpen(false);
  }

  const handleThemeChange = async (user: User, color: ThemeColor) => {
    const newSettings = { ...userSettings, [user]: { themeColor: color } };
    await supabase.from('themes').upsert({ user, theme: { themeColor: color } });
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
    const newTask: Omit<Task, 'id'> = { text: taskText, completed: false, user };
    await supabase.from('tasks').insert(newTask);
  };

  const handleToggleTask = async (user: User, taskId: string) => {
    const taskToToggle = tasks[user].find(t => t.id === taskId);
    if (taskToToggle) {
        const updates = { completed: !taskToToggle.completed };
        await supabase.from('tasks').update(updates).eq('id', taskId);
    }
  };

  const handleUpdateTask = async (user: User, taskId: string, newText: string) => {
     const updates = { text: newText };
     await supabase.from('tasks').update(updates).eq('id', taskId);
  };

  const handleDeleteTask = async (user: User, taskId: string) => {
    await supabase.from('tasks').delete().eq('id', taskId);
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
          isOpen={isLeftDrawerOpen}
          onClose={() => setLeftDrawerOpen(false)}
          onAddTask={handleAddTask}
          onToggleTask={handleToggleTask}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
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
          isOpen={isRightDrawerOpen}
          onClose={() => setRightDrawerOpen(false)}
          onAddTask={handleAddTask}
          onToggleTask={handleToggleTask}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          position="right"
          theme={khushiTheme.drawer}
          selectedThemeColor={userSettings.Khushi?.themeColor || 'cyan'}
          onThemeChange={(color) => handleThemeChange('Khushi', color)}
        />
      </div>
    </div>
  );
};

export default App;