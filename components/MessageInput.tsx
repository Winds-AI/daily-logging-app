import React from 'react';
import { SendIcon, MicrophoneIcon, SpinnerIcon, PlusIcon, CloseIcon } from './icons';
import { Theme, QueuedMessage } from '../types';

interface MessageInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddToQueue: () => void;
  onSendQueue: () => void;
  onDeleteFromQueue: (id: number) => void;
  queue: QueuedMessage[];
  theme: Theme;
  isRecording: boolean;
  isTranscribing: boolean;
  onVoiceClick: () => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ 
  value, 
  onChange, 
  onAddToQueue, 
  onSendQueue,
  onDeleteFromQueue,
  queue,
  theme, 
  isRecording, 
  isTranscribing, 
  onVoiceClick 
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onAddToQueue();
    }
  };
  
  const isDisabled = isRecording || isTranscribing;

  return (
    <div className={`${theme.messageInput.inputContainerBg} p-3 sm:p-4 border-t border-gray-600`}>
      {/* Queue Area */}
      {queue.length > 0 && (
        <div className="mb-3 p-3 bg-black/20 rounded-lg">
          <div className="flex justify-between items-center mb-2 pb-2 border-b border-white/10">
            <h3 className="text-sm font-bold text-gray-300">Daily Log Queue ({queue.length})</h3>
            <button
              onClick={onSendQueue}
              className={`flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm font-semibold text-white rounded-full py-1.5 sm:py-2 px-3 sm:px-4 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${theme.messageInput.inputRing} ${theme.messageInput.sendButtonBg} ${theme.messageInput.sendButtonHoverBg}`}
              aria-label="Send all queued messages"
            >
              <SendIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline sm:inline">Send Daily Log</span>
              <span className="xs:hidden sm:hidden">Send</span>
            </button>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
            {queue.map(item => (
              <div key={item.id} className="flex items-center justify-between bg-white/10 p-2 rounded-md">
                <p className="text-sm text-gray-200 flex-grow mr-2">
                  <span className="font-mono text-xs text-gray-400 mr-2">[{item.timestamp}]</span>
                  {item.text}
                </p>
                <button
                  onClick={() => onDeleteFromQueue(item.id)}
                  className="ml-2 text-gray-400 hover:text-white p-1 rounded-full hover:bg-red-500/50 transition-colors"
                  aria-label="Remove from queue"
                >
                  <CloseIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex items-center space-x-2 sm:space-x-3">
        <div className="relative w-full">
            <input
              type="text"
              placeholder={isRecording ? 'Recording...' : isTranscribing ? 'Transcribing audio...' : 'Add a thought to your daily log...'}
              className={`w-full ${theme.messageInput.inputBg} border border-gray-500 rounded-full py-2.5 sm:py-2 px-4 focus:outline-none focus:ring-2 ${theme.messageInput.inputRing} ${theme.messageInput.inputText} ${theme.messageInput.inputPlaceholder} ${isTranscribing ? 'pr-10' : ''} text-base`}
              value={value}
              onChange={onChange}
              aria-label="Message input"
              disabled={isDisabled}
            />
            {isTranscribing && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <SpinnerIcon className={`w-5 h-5 ${theme.messageInput.inputText}`} />
                </div>
            )}
        </div>
        <button
          type="button"
          onClick={onVoiceClick}
          className={`text-white rounded-full p-2.5 sm:p-3 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${theme.messageInput.inputRing} min-w-[44px] min-h-[44px] ${
            isRecording
              ? 'bg-red-600 hover:bg-red-700 animate-pulse'
              : `${theme.messageInput.sendButtonBg} ${theme.messageInput.sendButtonHoverBg}`
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          disabled={isTranscribing}
        >
          <MicrophoneIcon className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        <button
          type="submit"
          className={`${theme.messageInput.sendButtonBg} text-white rounded-full p-2.5 sm:p-3 flex items-center justify-center ${theme.messageInput.sendButtonHoverBg} transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${theme.messageInput.inputRing} disabled:opacity-50 disabled:cursor-not-allowed min-w-[44px] min-h-[44px]`}
          aria-label="Add to queue"
          disabled={!value.trim() || isDisabled}
        >
          <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;