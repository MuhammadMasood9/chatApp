'use client';

import React from 'react';
import { AUTH_MESSAGES } from '@/constants/settings';
import { AuthMode } from '@/utils/types';

interface AuthHeaderProps {
  mode: AuthMode;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({ mode }) => {
  const messages = AUTH_MESSAGES[mode];

  return (
    <>
      <h1 className="mb-1 text-center text-[1.45rem] font-semibold tracking-tight text-gray-800">
        {messages.title}
      </h1>
      <p className="mb-6 text-center text-[0.82rem] leading-snug text-gray-400">
        {messages.subtitle}
      </p>
    </>
  );
};
