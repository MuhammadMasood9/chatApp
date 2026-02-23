'use client';

import React from 'react';
import { FiArrowLeft } from 'react-icons/fi';
import { getFirstLetter } from '@/helper/text';
import { useAppSelector } from '@/store/hooks';
import { SettingsNav } from '@/utils/types';

interface SettingsSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onBack: VoidFunction;
  isOpen: boolean;
  navItems: SettingsNav[];
  formData: {
    fullName: string;
    email: string;
  };
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  activeSection,
  onSectionChange,
  onBack,
  isOpen,
  navItems,
  formData
}) => {
  const { user } = useAppSelector((state) => state.auth);

  return (
    <div className={`fixed inset-y-0 left-0 w-80 bg-white border-r border-slate-100 flex flex-col h-full z-40 transform transition-transform duration-300 md:translate-x-0 ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    }`}>
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 hover:text-slate-800"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Settings</h2>
        </div>
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {getFirstLetter(formData.fullName || user?.email)}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-slate-900 truncate">
              {formData.fullName || 'Your Name'}
            </p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onSectionChange(id)}
            className={`w-full flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all group text-left ${
              activeSection === id
                ? 'bg-blue-50 shadow-sm'
                : 'hover:bg-slate-50'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm ${
              activeSection === id
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 group-hover:bg-white'
            }`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className={`font-semibold text-sm ${
              activeSection === id ? 'text-blue-900' : 'text-slate-900'
            }`}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
