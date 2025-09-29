import React, { useEffect, useRef } from 'react';
import { Message as MessageType, User, Theme } from '../types';
import Message from './Message';

interface MessageListProps {
  messages: MessageType[];
  currentUser: User;
  theme: Theme;
}

const MessageList: React.FC<MessageListProps> = ({ messages, currentUser, theme }) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-grow p-4 overflow-y-auto">
      {messages.map((msg) => (
        <Message key={msg.id} message={msg} currentUser={currentUser} theme={theme} />
      ))}
      <div ref={endOfMessagesRef} />
    </div>
  );
};

export default MessageList;
