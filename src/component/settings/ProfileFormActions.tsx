'use client';

import React from 'react';
import { FiSave } from 'react-icons/fi';

interface ProfileFormActionsProps {
  isEditing: boolean;
  isPending: boolean;
  onSave: VoidFunction;
  onCancel: VoidFunction;
}

export const ProfileFormActions: React.FC<ProfileFormActionsProps> = ({
  isEditing,
  isPending,
  onSave,
  onCancel
}) => {
  if (!isEditing) return null;

  return (
    <div className="flex items-center gap-3 justify-end">
      <button
        onClick={onCancel}
        disabled={isPending}
        className="px-5 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors text-sm font-semibold"
      >
        Cancel
      </button>
      <button
        onClick={onSave}
        disabled={isPending}
        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-semibold shadow-md shadow-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FiSave className="w-4 h-4" />
        {isPending ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
};
