import React from 'react';
import { LogOut, User as UserIcon } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

interface NavbarProps {
  user: User | null;
  onSignOut: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onSignOut }) => {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-xs">
            R
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-900 tracking-tight text-lg">Recall</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Phase 2
              </span>
            </div>
          </div>
        </div>

        {user && (
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              <UserIcon className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-mono truncate max-w-[200px]">{user.email}</span>
            </div>

            <button
              onClick={onSignOut}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-red-600 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-lg transition-colors shadow-2xs"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
