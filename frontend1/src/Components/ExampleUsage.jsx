import React from 'react';
import { useAuth } from '../hooks/useAuth.jsx';

const ExampleUsage = () => {
  const { user, logout } = useAuth();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">QuickPrint - Offline Mode</h1>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Current User</h2>
        {user ? (
          <div className="bg-green-100 p-4 rounded">
            <p><strong>ID:</strong> {user.id}</p>
            <p><strong>Role:</strong> {user.role}</p>
            <p><strong>Phone:</strong> {user.phone || 'N/A'}</p>
            <p><strong>Email:</strong> {user.email || 'N/A'}</p>
          </div>
        ) : (
          <div className="bg-gray-100 p-4 rounded">
            <p>Not logged in</p>
          </div>
        )}
      </div>

      <div className="bg-yellow-100 p-4 rounded mb-6">
        <h3 className="font-semibold text-yellow-800">⚠️ Offline Mode Active</h3>
        <p className="text-yellow-700 text-sm mt-1">
          The application is running without backend connectivity. 
          All data is stored locally in your browser.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={logout}
          disabled={!user}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 disabled:opacity-50"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default ExampleUsage;
