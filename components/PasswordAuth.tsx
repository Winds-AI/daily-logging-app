import React, { useState, useEffect } from 'react';

interface PasswordAuthProps {
  onAuthenticated: () => void;
}

const PasswordAuth: React.FC<PasswordAuthProps> = ({ onAuthenticated }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Get password from environment variables
  const correctPassword = import.meta.env.VITE_APP_PASSWORD;

  useEffect(() => {
    // Check if user is already authenticated via cookie
    const authCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('daily_log_auth='));

    if (authCookie && authCookie.split('=')[1] === 'true') {
      onAuthenticated();
    }
  }, [onAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (password === correctPassword) {
      // Set authentication cookie (expires in 30 days)
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      document.cookie = `daily_log_auth=true; expires=${expiryDate.toUTCString()}; path=/; SameSite=Strict`;

      onAuthenticated();
    } else {
      setError('Incorrect password. Please try again.');
      setPassword('');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-8 w-full max-w-md mx-4 border border-white/20">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Daily Log</h1>
          <p className="text-gray-300">Enter password to access your shared daily log</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm"
              placeholder="Enter password"
              required
              disabled={isLoading}
              autoFocus
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center bg-red-900/20 border border-red-500/20 rounded-lg p-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Authenticating...' : 'Access Daily Log'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          <p>For Meet & Khushi</p>
        </div>
      </div>
    </div>
  );
};

export default PasswordAuth;
