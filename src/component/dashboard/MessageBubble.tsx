"use client";
import { useMemo } from 'react';
import { formatTime } from '@/helper/date';
import { getInitials } from '@/helper/text';
import { MessageType, MessageWithSender } from '@/utils/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setReplyTo, startEditing } from '@/store/slices/messageComposerSlice';

interface MessageBubbleProps {
  message: MessageWithSender;
  isMe: boolean;
  isOptimistic?: boolean;
  isOnline?: boolean;
}

export const MessageBubble = ({ message, isMe, isOnline }: MessageBubbleProps) => {
  const isOptimistic = message.id.startsWith('optimistic-');
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)

  const replyPreview = useMemo(() => {
    const ref = message.replyToMessage
    if (!ref) return null
    const label = ref.content ? ref.content : ref.fileName
    return label ? label.slice(0, 120) : null
  }, [message.replyToMessage])

  const canEdit = !!user && !!message.senderId && message.senderId === user.id && message.type === MessageType.Text

  const handleReply = () => {
    dispatch(setReplyTo({
      id: message.id,
      senderId: message.senderId ?? null,
      type: message.type,
      content: message.content ?? null,
      fileName: message.fileName ?? null,
    }))
  }

  const handleEdit = () => {
    if (!canEdit) return
    dispatch(startEditing({
      messageId: message.id,
      content: message.content ?? '',
    }))
  }

  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex items-end gap-3 max-w-[85%] sm:max-w-[70%] ${isMe ? 'flex-row-reverse' : ''}`}>
        {!isMe && (
          <div className="relative">
            {message.sender?.avatarUrl ? (
              <img
                src={message.sender.avatarUrl}
                alt={message.sender.display_name || message.sender.username || 'User'}
                className="w-8 h-8 rounded-lg flex-shrink-0 shadow-sm border border-slate-200/50 object-cover"
              />
            ) : (
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] font-bold text-slate-500 flex-shrink-0 shadow-sm border border-slate-200/50">
                {getInitials(message.sender?.display_name ?? message.sender?.username ?? '')}
              </div>
            )}
            {isOnline && (
              <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border-2 border-white"></div>
            )}
          </div>
        )}
        <div className="flex flex-col space-y-1 group">
          <div
            className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm ${
              isMe
                ? `bg-blue-600 text-white rounded-br-none shadow-blue-100 ${isOptimistic ? 'opacity-70' : ''}`
                : 'bg-slate-50 text-slate-700 rounded-bl-none border border-slate-100'
            }`}
          >
            {replyPreview && (
              <div className={`mb-2 px-3 py-2 rounded-xl text-xs ${isMe ? 'bg-white/15' : 'bg-slate-100'}`}>
                <p className={`${isMe ? 'text-white/80' : 'text-slate-600'} truncate`}>{replyPreview}</p>
              </div>
            )}

            {message.type === MessageType.Image && message.fileUrl && (
              <img
                src={message.fileUrl}
                alt={message.fileName ?? 'image'}
                className="max-w-[260px] sm:max-w-[320px] rounded-xl border border-white/10"
              />
            )}

            {message.type === MessageType.File && message.fileUrl && (
              <div className="space-y-2">
                {message.fileName && /\.(webm|wav|mp3|m4a|ogg)$/i.test(message.fileName) ? (
                  <audio controls src={message.fileUrl} className="w-[260px] sm:w-[320px]" />
                ) : (
                  <a
                    href={message.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={`text-xs font-semibold underline ${isMe ? 'text-white' : 'text-slate-700'}`}
                  >
                    {message.fileName ?? 'Download file'}
                  </a>
                )}
              </div>
            )}

            {message.type === MessageType.Text && message.content && (
              <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
            )}
          </div>

          <div className={`flex items-center gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
            <p className={`text-[10px] font-medium uppercase tracking-tight ${isMe ? 'text-right text-slate-400' : 'text-left text-slate-400'}`}>
              {isOptimistic ? 'Sending...' : formatTime(message.createdAt)}
              {!isOptimistic && message.editedAt && <span className="ml-1">(edited)</span>}
            </p>

            {!isOptimistic && (
              <div className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 ${isMe ? '' : ''}`}>
                <button
                  type="button"
                  onClick={handleReply}
                  className="text-[10px] font-semibold text-slate-400 hover:text-slate-600"
                >
                  Reply
                </button>
                {canEdit && (
                  <button
                    type="button"
                    onClick={handleEdit}
                    className="text-[10px] font-semibold text-slate-400 hover:text-slate-600"
                  >
                    Edit
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};