import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAppSelector } from '@/store/hooks'
import { messageService } from '@/services/messageService'
import { Message, MessageWithSender, MessageType, SendMessagePayload, EditMessagePayload, UUID, StreamingState } from '@/utils/types'
import { useEffect, useRef, useState, useCallback } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { useReduxMessageReads } from '@/hooks/useReduxMessageReads'

export const messageKeys = {
  all: (roomId: string) => ['messages', roomId] as const,
  typing: (roomId: string) => ['typing', roomId] as const,
}

export const useStreamingEditMessage = (roomId: string | null) => {
  const queryClient = useQueryClient()

  return useMutation<MessageWithSender, Error, EditMessagePayload>({
    mutationFn: (payload) => {
      if (!roomId) throw new Error('No room selected')
      return messageService.editMessage(payload)
    },
    onMutate: async (payload) => {
      if (!roomId) return
      await queryClient.cancelQueries({ queryKey: messageKeys.all(roomId) })
      const previous = queryClient.getQueryData<MessageWithSender[]>(messageKeys.all(roomId))

      queryClient.setQueryData<MessageWithSender[]>(
        messageKeys.all(roomId),
        (old: MessageWithSender[] | undefined) => {
          const list = old ?? []
          return list.map((m) => {
            if (m.id !== payload.messageId) return m
            return {
              ...m,
              content: payload.content,
              editedAt: new Date().toISOString(),
            }
          })
        }
      )

      return { previous }
    },
    onError: (_err, _payload, context) => {
      if (!roomId) return
      if (context && typeof context === 'object' && 'previous' in context) {
        queryClient.setQueryData(messageKeys.all(roomId), context.previous)
      }
    },
    onSuccess: (updated) => {
      if (!roomId) return
      queryClient.setQueryData<MessageWithSender[]>(
        messageKeys.all(roomId),
        (old: MessageWithSender[] | undefined) => {
          const list = old ?? []
          return list.map((m) => (m.id === updated.id ? updated : m))
        }
      )
    },
  })
}

export const useStreamingMessages = (roomId: string | null) => {
  const queryClient = useQueryClient()
  const { user } = useAppSelector(state => state.auth)

  const { 
    markAsRead, 
    getUnreadCount 
  } = useReduxMessageReads(roomId)

  const [streamingState, setStreamingState] = useState<StreamingState>({
    isConnected: false,
    isTyping: false,
    typingUsers: [],
    connectionStatus: 'connecting'
  })
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!roomId) return

    setStreamingState((prev: StreamingState) => ({ ...prev, connectionStatus: 'connecting' }))

    const channel = messageService.subscribeToMessages(roomId, (newMessage) => {
      queryClient.setQueryData<MessageWithSender[]>(
        messageKeys.all(roomId),
        (old: MessageWithSender[] | undefined) => {
          if (!old) return [newMessage]
          const idx = old.findIndex((m) => m.id === newMessage.id)
          if (idx >= 0) {
            const copy = old.slice()
            copy[idx] = newMessage
            return copy
          }
          return [...old, newMessage]
        }
      )
    }, (status) => {
      if (status === 'SUBSCRIBED') {
        setStreamingState(prev => ({
          ...prev,
          isConnected: true,
          connectionStatus: 'connected',
        }))
      } else if (status === 'TIMED_OUT') {
        setStreamingState(prev => ({
          ...prev,
          isConnected: false,
          connectionStatus: 'reconnecting',
        }))
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        setStreamingState(prev => ({
          ...prev,
          isConnected: false,
          connectionStatus: 'disconnected',
        }))
      }
    })

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
      channelRef.current = null
      setStreamingState((prev: StreamingState) => ({ 
        ...prev, 
        isConnected: false, 
        connectionStatus: 'disconnected' 
      }))
    }
  }, [roomId, queryClient])

  const messagesQuery = useQuery<MessageWithSender[]>({
    queryKey: messageKeys.all(roomId ?? ''),
    queryFn: () => {
      if (!roomId) return Promise.resolve([])
      return messageService.getMessages(roomId)
    },
    enabled: !!roomId,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  return {
    messages: messagesQuery.data || [],
    isLoading: messagesQuery.isLoading,
    error: messagesQuery.error,
    streamingState: {
      isConnected: streamingState.isConnected,
      isTyping: streamingState.isTyping,
      typingUsers: [],
      connectionStatus: streamingState.connectionStatus
    },
    markAsRead,
    getUnreadCount
  }
}

export const useStreamingSendMessage = (roomId: string | null) => {
  const { user } = useAppSelector((state) => state.auth)
  const queryClient = useQueryClient()

  return useMutation<MessageWithSender, Error, Omit<SendMessagePayload, 'roomId'> & { content?: string }>({
    mutationFn: (payload) => {
      if (!user) throw new Error('Not authenticated')
      if (!roomId) throw new Error('No room selected')

      return messageService.sendMessage({
        roomId: roomId as UUID,
        senderId: user.id,
        type: payload.type,
        content: payload.content,
        fileUrl: payload.fileUrl,
        fileName: payload.fileName,
        fileSize: payload.fileSize,
        replyTo: payload.replyTo,
      })
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: messageKeys.all(roomId ?? '') })
      const previous = queryClient.getQueryData<MessageWithSender[]>(messageKeys.all(roomId ?? ''))

      const optimistic: MessageWithSender = {
        id: `optimistic-${Date.now()}`,
        roomId: roomId!,
        senderId: user?.id ?? null,
        type: payload.type,
        content: payload.content ?? null,
        fileUrl: payload.fileUrl ?? null,
        fileName: payload.fileName ?? null,
        fileSize: payload.fileSize ?? null,
        replyTo: (payload.replyTo ?? null) as UUID | null,
        editedAt: null,
        deletedAt: null,
        createdAt: new Date().toISOString(),
        sender: user ? {
          id: user.id,
          username: user.username,
          display_name: user.display_name,
          avatarUrl: user.avatarUrl,
          isOnline: false
        } : null,
        replyToMessage: null,
      }

      queryClient.setQueryData<MessageWithSender[]>(
        messageKeys.all(roomId ?? ''),
        (old: MessageWithSender[] | undefined) => [...(old ?? []), optimistic]
      )

      return { previous }
    },
    onError: (_err, _payload, context) => {
      if (context && typeof context === 'object' && 'previous' in context) {
        queryClient.setQueryData(messageKeys.all(roomId ?? ''), context.previous);
      }
    },
    onSuccess: (newMessage) => {
      queryClient.setQueryData<MessageWithSender[]>(
        messageKeys.all(roomId ?? ''),
        (old: MessageWithSender[] | undefined) => {
          if (!old) return [newMessage]
          return old
            .filter((m) => !m.id.startsWith('optimistic-'))
            .concat(newMessage)
        }
      )
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
    },
  })
}
