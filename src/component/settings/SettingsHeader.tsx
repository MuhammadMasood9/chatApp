'use client';

import React from 'react';
import { FiEdit3, FiLogOut, FiMenu } from 'react-icons/fi';

interface SettingsHeaderProps {
  activeSection: string;
  isEditing: boolean;
  onEditClick: VoidFunction;
  onLogout: VoidFunction;
  isLogoutPending: boolean;
  onToggleSidebar?: VoidFunction;
  showSidebarToggle?: boolean;
}

export const SettingsHeader: React.FC<SettingsHeaderProps> = ({
  activeSection,
  isEditing,
  onEditClick,
  onLogout,
  isLogoutPending,
  onToggleSidebar,
  showSidebarToggle = true
}) => {
  return (
    <div className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 sticky top-0 z-30 w-full shrink-0">
      <div className="flex items-center justify-between w-full max-w-3xl mx-auto gap-2 sm:gap-4">
        <div className="flex items-center gap-3">
          {showSidebarToggle && (
            <button
              onClick={onToggleSidebar}
              className="md:hidden p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 hover:text-slate-800"
            >
              <FiMenu className="w-5 h-5" />
            </button>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-slate-900 capitalize truncate">{activeSection}</h1>
            <p className="text-xs text-slate-400 truncate">Manage your {activeSection} settings</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeSection === 'profile' && !isEditing && (
            <button
              onClick={onEditClick}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-semibold whitespace-nowrap flex-shrink-0"
            >
              <FiEdit3 className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">Edit Profile</span>
              <span className="sm:hidden">Edit</span>
            </button>
          )}
          <button
            onClick={onLogout}
            disabled={isLogoutPending}
            className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors text-sm font-semibold whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiLogOut className="w-4 h-4" />
            <span className="hidden sm:inline">{isLogoutPending ? 'Logging out...' : 'Logout'}</span>
            <span className="sm:hidden">{isLogoutPending ? '...' : 'Out'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
