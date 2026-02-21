'use client';

import React from 'react';
import { AUTH_MESSAGES } from '@/constants/settings';
import { AuthMode } from '@/utils/types';

interface AuthFooterProps {
  mode: AuthMode;
  onModeToggle: VoidFunction;
}

export const AuthFooter: React.FC<AuthFooterProps> = ({ mode, onModeToggle }) => {
  const messages = AUTH_MESSAGES[mode];

  return (
    <>
      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-[0.75rem] text-gray-350">Or sign in with</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <p className="mt-6 text-center text-[0.78rem] text-gray-400">
        {messages.footerText}{" "}
        <button
          type="button"
          onClick={onModeToggle}
          className="font-medium text-sky-500 transition hover:text-sky-600"
        >
          {messages.footerLink}
        </button>
      </p>
    </>
  );
};
