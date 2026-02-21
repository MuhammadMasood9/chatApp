'use client';

import { useState, useRef, useEffect } from 'react';
import { FiSend, FiPaperclip, FiMic, FiSquare, FiX } from 'react-icons/fi';
import { useStreamingEditMessage, useStreamingSendMessage } from '@/hooks/useStreamingMessages';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { MessageType } from '@/utils/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setReplyTo, stopEditing } from '@/store/slices/messageComposerSlice';
import { storageService } from '@/services/storageService';

interface StreamingMessageInputProps {
  roomId: string | null;
}

export const StreamingMessageInput: React.FC<StreamingMessageInputProps> = ({ 
  roomId 
}) => {
  const [message, setMessage] = useState<string>('');
  const [isComposing, setIsComposing] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState(false);
  const sendMessage = useStreamingSendMessage(roomId);
  const editMessage = useStreamingEditMessage(roomId);
  const { sendTypingIndicator } = useTypingIndicator(roomId);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const composer = useAppSelector((state) => state.messageComposer);

  const handleStopEditing = () => {
    dispatch(stopEditing())
    setMessage('')
  }

  const handleCancelReply = () => {
    dispatch(setReplyTo(null))
  }

  useEffect(() => {
    if (composer.editing) {
      setMessage(composer.editing.content)
      textareaRef.current?.focus()
    }
  }, [composer.editing])

  const handleSend = async () => {
    if (!roomId) return;
    if (!user) return;
    if (!message.trim() && !composer.editing) return;
    
    try {
      if (composer.editing) {
        await editMessage.mutateAsync({
          messageId: composer.editing.messageId,
          content: message.trim(),
        })
        dispatch(stopEditing())
        setMessage('')
        sendTypingIndicator(false);
        return
      }

      await sendMessage.mutateAsync({
        type: MessageType.Text,
        content: message.trim(),
        replyTo: composer.replyTo?.id,
      })
      setMessage('')
      dispatch(setReplyTo(null))
      sendTypingIndicator(false)
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handlePickFile = () => {
    if (!roomId) return
    fileInputRef.current?.click()
  }

  const handleUploadAndSend = async (file: File) => {
    if (!roomId || !user) return

    setIsUploading(true)
    try {
      const uploaded = await storageService.uploadMessageFile({
        file,
        userId: user.id,
        roomId,
      })

      const isImage = file.type.startsWith('image/')
      await sendMessage.mutateAsync({
        type: isImage ? MessageType.Image : MessageType.File,
        fileUrl: uploaded.publicUrl,
        fileName: file.name,
        fileSize: file.size,
        replyTo: composer.replyTo?.id,
      })
      dispatch(setReplyTo(null))
      sendTypingIndicator(false)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await handleUploadAndSend(file)
  }

  const startRecording = async () => {
    if (!roomId || !user) return
    if (isRecording) return

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream)
    chunksRef.current = []

    recorder.ondataavailable = (ev) => {
      if (ev.data.size > 0) chunksRef.current.push(ev.data)
    }

    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop())
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
      chunksRef.current = []

      const file = new File([blob], `voice-${Date.now()}.webm`, { type: blob.type })
      await handleUploadAndSend(file)
      sendTypingIndicator(false)
    }

    recorderRef.current = recorder
    recorder.start()
    setIsRecording(true)
  }

  const stopRecording = () => {
    const recorder = recorderRef.current
    if (!recorder) return
    if (recorder.state === 'inactive') return
    recorder.stop()
    recorderRef.current = null
    setIsRecording(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    if (isComposing) return

    if (e.target.value.trim()) {
      sendTypingIndicator(true);
    } else {
      sendTypingIndicator(false);
    }
  };

  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLTextAreaElement>) => {
    setIsComposing(false);
    if (e.currentTarget.value.trim() && !isComposing) {
      sendTypingIndicator(true);
    }
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  }, [message]);

  return (
    <div className="border-t border-slate-200 bg-white p-4">
      <div className="max-w-4xl mx-auto">
        {(composer.replyTo || composer.editing) && (
          <div className="mb-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                {composer.editing ? 'Editing message' : 'Replying'}
              </p>
              {composer.editing ? (
                <p className="text-xs text-slate-600 truncate">{composer.editing.content}</p>
              ) : (
                <p className="text-xs text-slate-600 truncate">
                  {composer.replyTo?.content || composer.replyTo?.fileName}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={composer.editing ? handleStopEditing : handleCancelReply}
              className="p-2 rounded-xl hover:bg-white transition-colors text-slate-500"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex items-end gap-3">
          <button
            onClick={handlePickFile}
            disabled={isUploading || isRecording || sendMessage.isPending}
            className="p-2.5 text-slate-400 hover:text-slate-600 transition-colors rounded-xl hover:bg-slate-50"
            title="Attach file"
          >
            <FiPaperclip className="w-5 h-5" />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,audio/*"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isUploading || sendMessage.isPending}
            className={`p-2.5 transition-colors rounded-xl hover:bg-slate-50 ${isRecording ? 'text-red-500' : 'text-slate-400 hover:text-slate-600'}`}
            title={isRecording ? 'Stop recording' : 'Record voice'}
          >
            {isRecording ? <FiSquare className="w-5 h-5" /> : <FiMic className="w-5 h-5" />}
          </button>

          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onCompositionStart={handleCompositionStart}
              onCompositionEnd={handleCompositionEnd}
              placeholder="Type a message..."
              rows={1}
              className="w-full px-4 py-3 pr-12 border border-slate-200 rounded-2xl text-sm resize-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all overflow-hidden"
              style={{
                minHeight: '44px',
                overflow: 'hidden'
              }}
            />
            <button
              onClick={handleSend}
              disabled={(!message.trim() && !composer.editing) || sendMessage.isPending || editMessage.isPending || isUploading || isRecording}
              className="absolute right-2 bottom-2 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Send message (Enter)"
            >
              <FiSend className="w-4 h-4" />
            </button>
          </div>
        </div>

        {(sendMessage.isPending || editMessage.isPending || isUploading) && (
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
            <span>
              {isUploading ? 'Uploading...' : composer.editing ? 'Saving...' : 'Sending message...'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
