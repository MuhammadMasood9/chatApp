'use client';
import { useRef, useEffect } from 'react';
import { TypingUser } from '@/utils/types';
import { formatDate } from '@/helper/date';
import { MessageBubble } from '@/component/dashboard/MessageBubble';
import { TypingIndicator } from '@/component/dashboard/TypingIndicator';
import { useStreamingMessages } from '@/hooks/useStreamingMessages'
import { useAppSelector } from '@/store/hooks'
import { Skeleton } from '@/component/ui/Skeleton';

interface StreamingMessageListProps {
  roomId: string | null;
}

export const StreamingMessageList = ({ roomId }: StreamingMessageListProps) => {
  const { messages, isLoading, streamingState } = useStreamingMessages(roomId)
  const { user } = useAppSelector(state => state.auth)
  const presenceUsers = useAppSelector(state => state.presence.users)
  const currentUserId = user?.id || ''
  const endRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const typingUsers: TypingUser[] = Object.values(presenceUsers)
    .filter(u => u.isTyping)
    .map(u => ({
      userId: u.userId,
      username: u.username,
      displayName: u.displayName,
      startedAt: 0,
      isTyping: true,
    }))

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const messageMap = Object.fromEntries(messages.map((m) => [m.id, m]))

  const getConnectionStatusColor = () => {
    switch (streamingState.connectionStatus) {
      case 'connected': return 'bg-emerald-500';
      case 'connecting': return 'bg-yellow-500';
      case 'reconnecting': return 'bg-orange-500';
      case 'disconnected': return 'bg-red-500';
      default: return 'bg-slate-500';
    }
  };

  const getConnectionStatusText = () => {
    switch (streamingState.connectionStatus) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'reconnecting': return 'Reconnecting...';
      case 'disconnected': return 'Disconnected';
      default: return 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2">
            <Skeleton variant="circle" width="0.5rem" height="0.5rem" />
            <Skeleton variant="text" width="6rem" height="0.75rem" />
          </div>
          <Skeleton variant="text" width="4rem" height="0.75rem" />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex justify-center mb-4">
            <Skeleton variant="text" width="8rem" height="0.75rem" />
          </div>

          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`flex gap-3 ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
              {i % 2 === 0 && <Skeleton variant="circle" width="2rem" height="2rem" />}
              <div className={`max-w-xs ${i % 2 === 0 ? '' : 'order-first'}`}>
                <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100">
                  <Skeleton variant="text" width="12rem" />
                  <Skeleton variant="text" width="8rem" height="0.75rem" />
                </div>
                <Skeleton variant="text" width="4rem" height="0.5rem" className="mt-1" />
              </div>
              {i % 2 !== 0 && <Skeleton variant="circle" width="2rem" height="2rem" />}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <p className="text-sm">No messages yet</p>
        <p className="text-xs mt-1">Say hello!</p>
        {streamingState.connectionStatus === 'connected' && (
          <div className="flex items-center gap-2 mt-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <p className="text-xs">Real-time connected</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 bg-white">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${getConnectionStatusColor()} ${
            streamingState.connectionStatus === 'connecting' || streamingState.connectionStatus === 'reconnecting' 
              ? 'animate-pulse' 
              : ''
          }`} />
          <span className="text-xs text-slate-500">
            {getConnectionStatusText()}
          </span>
        </div>
        
        <div className="text-xs text-slate-400">
          {messages.length} message{messages.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length > 0 && (
          <div className="flex justify-center mb-4">
            <span className="px-3 py-1 bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest rounded-full border border-slate-100">
              {formatDate(messages[0].createdAt)}
            </span>
          </div>
        )}
        
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={{
              ...message,
              replyToMessage: message.replyTo ? (messageMap[message.replyTo] ?? null) : null,
            }}
            isMe={message.senderId === currentUserId}
            isOptimistic={message.id.startsWith('optimistic-')}
            isOnline={message.sender ? (presenceUsers[message.sender.id]?.isOnline ?? false) : false}
          />
        ))}

        <TypingIndicator
          typingUsers={typingUsers}
          currentUserId={currentUserId}
        />
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
