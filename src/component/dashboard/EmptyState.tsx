"use client";

import { FiMessageSquare } from 'react-icons/fi';

interface EmptyStateProps {
  onOpenSidebar: VoidFunction;
}

export const EmptyState = ({ onOpenSidebar }: EmptyStateProps) => (
  <div className="flex-1 flex items-center justify-center bg-slate-50/50 p-6">
    <div className="text-center max-w-sm">
      <div className="w-24 h-24 bg-white rounded-3xl shadow-xl shadow-slate-200/50 flex items-center justify-center mx-auto mb-8 border border-slate-100 rotate-3 transition-transform hover:rotate-0">
        <FiMessageSquare className="w-10 h-10 text-blue-600" />
      </div>
      <h3 className="text-2xl font-bold text-slate-900 mb-3">Your Messages</h3>
      <p className="text-slate-500 text-sm leading-relaxed mb-8">
        Select a conversation from the list to start messaging.
      </p>
      <button
        onClick={onOpenSidebar}
        className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm lg:hidden"
      >
        View Conversations
      </button>
    </div>
  </div>
);