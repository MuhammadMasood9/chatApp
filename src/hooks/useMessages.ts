import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAppSelector } from '@/store/hooks'
import { messageService } from '@/services/messageService'
import { Message, MessageType, UUID } from '@/utils/types'
import { useEffect } from 'react'

export const messageKeys = {
  all: (roomId: string) => ['messages', roomId] as const,
};

export const useMessages = (roomId: string | null) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!roomId) return;

    const channel = messageService.subscribeToMessages(roomId, (newMessage) => {
      queryClient.setQueryData<Message[]>(
        messageKeys.all(roomId),
        (old) => {
          if (!old) return [newMessage];
          if (old.find((m) => m.id === newMessage.id)) return old;
          return [...old, newMessage];
        }
      );
    });

    return () => {
      channel.unsubscribe();
    };
  }, [roomId, queryClient]);

  return useQuery<Message[]>({
    queryKey: messageKeys.all(roomId ?? ''),
    queryFn: () => {
      if (!roomId) return Promise.resolve([]);
      return messageService.getMessages(roomId);
    },
    enabled: !!roomId,
  });
};

export const useSendMessage = (roomId: string | null) => {
  const { user } = useAppSelector((state) => state.auth);
  const queryClient = useQueryClient();

  return useMutation<Message, Error, string>({
    mutationFn: (content: string) => {
      if (!user) throw new Error('Not authenticated');
      if (!roomId) throw new Error('No room selected');
      return messageService.sendMessage({
        roomId: roomId as UUID,
        senderId: user.id,
        type: MessageType.Text,
        content,
      });
    },
    onMutate: async (content) => {
      await queryClient.cancelQueries({ queryKey: messageKeys.all(roomId ?? '') });
      const previous = queryClient.getQueryData<Message[]>(messageKeys.all(roomId ?? ''));

      const optimistic: Message = {
        id: `optimistic-${Date.now()}`,
        roomId: roomId!,
        senderId: user?.id ?? null,
        type: MessageType.Text,
        content,
        fileUrl: null,
        fileName: null,
        fileSize: null,
        replyTo: null,
        editedAt: null,
        deletedAt: null,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<Message[]>(
        messageKeys.all(roomId ?? ''),
        (old) => [...(old ?? []), optimistic]
      );

      return { previous };
    },
    onError: (_err, _content, context) => {
      if (context && typeof context === 'object' && 'previous' in context) {
        queryClient.setQueryData(messageKeys.all(roomId ?? ''), context.previous);
      }
    },
    onSuccess: (newMessage) => {
      queryClient.setQueryData<Message[]>(
        messageKeys.all(roomId ?? ''),
        (old) => {
          if (!old) return [newMessage];
          return old
            .filter((m) => !m.id.startsWith('optimistic-'))
            .concat(newMessage);
        }
      );
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
};