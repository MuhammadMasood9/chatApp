'use client';

import React from 'react';
import { FiTrash2 } from 'react-icons/fi';

interface DangerZoneProps {
  onDeleteAccount: VoidFunction;
}

export const DangerZone: React.FC<DangerZoneProps> = ({ onDeleteAccount }) => {
  return (
    <div className="mt-6 p-4 bg-red-50 rounded-2xl border border-red-100">
      <p className="text-sm font-semibold text-red-700 mb-1">Danger Zone</p>
      <p className="text-xs text-red-400 mb-3">Permanently delete your account and all data.</p>
      <button 
        onClick={onDeleteAccount}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-600 hover:text-white transition-all"
      >
        <FiTrash2 className="w-4 h-4" />
        Delete Account
      </button>
    </div>
  );
};
