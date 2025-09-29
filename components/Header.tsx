import React from 'react';
import { User, Theme } from '../types';
import { MenuIcon } from './icons';

interface HeaderProps {
  currentUser: User;
  onUserChange: (user: User) => void;
  onToggleActiveDrawer: () => void;
  theme: Theme;
}

const Header: React.FC<HeaderProps> = ({
  currentUser,
  onUserChange,
  onToggleActiveDrawer,
  theme,
}) => {
  const users: User[] = ['Meet', 'Khushi'];

  return (
    <header className={`${theme.header.headerBg} p-3 flex items-center justify-between border-b border-gray-600`}>
      <div className="w-10"> {/* Spacer to balance the right button */}
         <h1 className={`font-bold text-xl ${theme.header.titleText} whitespace-nowrap`}>Daily Log</h1>
      </div>
      
      <div className={`flex p-1 rounded-full ${theme.switcher.containerBg}`}>
        {users.map(user => (
          <button
            key={user}
            onClick={() => onUserChange(user)}
            className={`px-4 py-1 rounded-full text-sm font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 ${theme.messageInput.inputRing} ring-offset-2 ring-offset-gray-800 ${
              currentUser === user
                ? `${theme.switcher.activeBg} ${theme.switcher.activeText}`
                : `${theme.switcher.inactiveText} ${theme.switcher.inactiveHoverBg}`
            }`}
          >
            {user}
          </button>
        ))}
      </div>

      <button 
        onClick={onToggleActiveDrawer} 
        className={`p-2 rounded-full hover:bg-white/10 ${theme.header.headerText}`} 
        aria-label={`Open ${currentUser}'s tasks`}
      >
        <MenuIcon className="w-6 h-6" />
      </button>
    </header>
  );
};

export default Header;