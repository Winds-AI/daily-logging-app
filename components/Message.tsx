import React, { useState } from 'react';
import { Message as MessageType, User, Theme, Suggestion } from '../types';
import { DoubleCheckIcon, SparklesIcon, QuestionMarkCircleIcon } from './icons';

interface MessageProps {
  message: MessageType;
  currentUser: User;
  theme: Theme;
}

const Message: React.FC<MessageProps> = ({ message, currentUser, theme }) => {
  const [showSuggestion, setShowSuggestion] = useState(false);

  const handleSuggestionClick = () => {
    // Only toggle if there's a suggestion or it's loading
    if (message.suggestion || message.suggestionLoading) {
      setShowSuggestion(prev => !prev);
    }
  };

  const isSentByCurrentUser = message.sender === currentUser;
  const suggestion = message.suggestion;
  const isSuggestionError = typeof suggestion === 'string';

  const messageContainerClasses = `flex mb-1 ${isSentByCurrentUser ? 'justify-end' : 'justify-start'}`;
  
  const messageBubbleClasses = `flex flex-col rounded-xl py-2 px-3.5 max-w-[85%] sm:max-w-[80%] shadow-md relative group ${
    isSentByCurrentUser
      ? `${theme.message.sentBg} ${theme.message.sentText} rounded-br-none`
      : `${theme.message.receivedBg} ${theme.message.receivedText} rounded-bl-none`
  }`;
  
  const timestampClasses = `text-xs ${isSentByCurrentUser ? theme.message.timestampText : 'text-gray-400'} opacity-90`;

  // Define colors for the suggestion card based on the theme
  const suggestionCardBg = isSentByCurrentUser ? 'bg-purple-900/50' : 'bg-slate-700/80';
  const suggestionAccentColor = isSentByCurrentUser ? 'text-fuchsia-300' : 'text-cyan-300';
  const suggestionMoodBg = isSentByCurrentUser ? 'bg-fuchsia-400/20' : 'bg-cyan-400/20';
  const suggestionMoodText = isSentByCurrentUser ? 'text-fuchsia-300' : 'text-cyan-300';

  const AiReflectionCard = () => {
    if (message.suggestionLoading) {
      return (
        <div className={`mt-2 p-3 rounded-lg ${suggestionCardBg} animate-pulse`}>
          <div className="h-4 bg-white/20 rounded w-1/4 mb-3"></div>
          <div className="h-3 bg-white/10 rounded w-full mb-2"></div>
          <div className="h-3 bg-white/10 rounded w-5/6 mb-3"></div>
          <div className="h-3 bg-white/10 rounded w-full"></div>
        </div>
      );
    }

    if (!suggestion) return null;
    
    if (isSuggestionError) {
       return (
         <div className={`mt-2 p-3 rounded-lg ${suggestionCardBg} border border-red-500/50`}>
           <p className="text-sm font-semibold text-red-300">Suggestion Error</p>
           <p className="text-xs text-red-300/80">{suggestion}</p>
         </div>
       );
    }
    
    const structuredSuggestion = suggestion as Suggestion;

    return (
      <div className={`mt-2 p-3 rounded-lg ${suggestionCardBg} border border-white/10 shadow-inner`}>
        <div className="flex items-center gap-2 mb-2">
          <SparklesIcon className={`w-5 h-5 ${suggestionAccentColor}`} />
          <h4 className={`text-sm font-bold ${suggestionAccentColor}`}>AI Daily Reflection</h4>
        </div>

        <div className="space-y-3 text-sm text-gray-200/95">
          {structuredSuggestion.mood && (
            <div>
              <span className={`inline-block text-xs font-semibold px-2 py-1 rounded-full ${suggestionMoodBg} ${suggestionMoodText}`}>
                {structuredSuggestion.mood}
              </span>
            </div>
          )}
          <p>{structuredSuggestion.acknowledgement}</p>
          <p className="font-medium">{structuredSuggestion.encouragement}</p>
          {structuredSuggestion.reflection_question && (
            <div className="mt-2 pt-2 border-t border-white/10 flex items-start gap-2">
              <QuestionMarkCircleIcon className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
              <p className="italic text-gray-300">{structuredSuggestion.reflection_question}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col w-full mb-3" style={{alignItems: isSentByCurrentUser ? 'flex-end' : 'flex-start'}}>
      <div className={messageContainerClasses} style={{width: 'fit-content'}}>
        <div className={messageBubbleClasses}>
          <p className="text-sm whitespace-pre-wrap break-words pb-3 sm:pb-4">{message.text}</p>
          <div className="flex items-center justify-end space-x-1 mt-1 sm:absolute sm:bottom-1.5 sm:right-3.5">
            <span className={`${timestampClasses} text-xs`}>{message.timestamp}</span>
            {isSentByCurrentUser && <DoubleCheckIcon className={`w-4 h-4 ${timestampClasses}`} />}
          </div>
          {(message.suggestion || message.suggestionLoading) && (
            <button 
              onClick={handleSuggestionClick} 
              className={`absolute bottom-1 left-1 p-1 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent ${theme.messageInput.inputRing} ${showSuggestion ? suggestionAccentColor : 'text-gray-400/70 group-hover:text-yellow-300 group-hover:scale-110'}`}
              aria-label={showSuggestion ? "Hide AI reflection" : "Show AI reflection"}
            >
                <SparklesIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
      {showSuggestion && <div className="w-[85%] sm:w-[80%]"><AiReflectionCard /></div>}
    </div>
  );
};

export default Message;