'use client';

import React from 'react';
import { FiLogOut } from 'react-icons/fi';

interface SettingsLogoutProps {
  isPending: boolean;
  onLogout: VoidFunction;
}

export const SettingsLogout: React.FC<SettingsLogoutProps> = ({ isPending, onLogout }) => {
  return (
    <div className="mt-auto border-t border-slate-100 bg-white p-3">
      <button
        onClick={onLogout}
        disabled={isPending}
        className="w-full flex items-center gap-3 p-3 rounded-2xl cursor-pointer hover:bg-red-50 text-red-500 transition-all group"
      >
        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-all shadow-sm">
          <FiLogOut className="w-5 h-5" />
        </div>
        <div className="flex-1 text-left">
          <h3 className="font-semibold text-sm">
            {isPending ? 'Logging out...' : 'Logout'}
          </h3>
          <p className="text-xs opacity-70">Sign out of your account</p>
        </div>
      </button>
    </div>
  );
};
