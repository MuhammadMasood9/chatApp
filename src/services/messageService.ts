import { supabaseBrowser } from '@/lib/supabase/browser'
import { MessageWithSender, UUID, MessageType, SendMessagePayload, EditMessagePayload } from '@/utils/types'

export interface DatabaseMessage {
  id: string;
  room_id: string;
  sender_id: string | null;
  type: MessageType;
  content: string | null;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  reply_to: string | null;
  edited_at: string | null;
  deleted_at: string | null;
  created_at: string;
  sender?: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export const messageService = {
  getMessages: async (roomId: string): Promise<MessageWithSender[]> => {
    const { data, error } = await supabaseBrowser()
      .from('messages')
      .select(`
        *,
        sender:profiles!sender_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('room_id', roomId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (error) throw error;
    
    const dbMessages = (data as unknown as DatabaseMessage[]) ?? [];
    return dbMessages.map(transformDatabaseMessageToMessage);
  },

  sendMessage: async (payload: SendMessagePayload & { senderId: string }): Promise<MessageWithSender> => {
    const { data, error } = await supabaseBrowser()
      .from('messages')
      .insert({
        room_id: payload.roomId,
        sender_id: payload.senderId,
        type: payload.type,
        content: payload.content ? payload.content.trim() : null,
        file_url: payload.fileUrl ?? null,
        file_name: payload.fileName ?? null,
        file_size: payload.fileSize ?? null,
        reply_to: payload.replyTo ?? null,
      })
      .select(`
        *,
        sender:profiles!sender_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .single();

    if (error) throw error;
    return transformDatabaseMessageToMessage(data as DatabaseMessage);
  },

  editMessage: async (payload: EditMessagePayload): Promise<MessageWithSender> => {
    const { data, error } = await supabaseBrowser()
      .from('messages')
      .update({
        content: payload.content.trim(),
        edited_at: new Date().toISOString(),
      })
      .eq('id', payload.messageId)
      .select(`
        *,
        sender:profiles!sender_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .single();

    if (error) throw error;
    return transformDatabaseMessageToMessage(data as DatabaseMessage);
  },

  subscribeToMessages: (
    roomId: string,
    onMessage: (message: MessageWithSender) => void,
    onStatus?: (status: string) => void
  ) => {
    return supabaseBrowser()
      .channel(`messages:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          const { data } = await supabaseBrowser()
            .from('messages')
            .select(`
              *,
              sender:profiles!sender_id (
                id,
                username,
                display_name,
                avatar_url
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) onMessage(transformDatabaseMessageToMessage(data as DatabaseMessage));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          const { data } = await supabaseBrowser()
            .from('messages')
            .select(`
              *,
              sender:profiles!sender_id (
                id,
                username,
                display_name,
                avatar_url
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) onMessage(transformDatabaseMessageToMessage(data as DatabaseMessage));
        }
      )
      .subscribe(status => {
        onStatus?.(status)
      });
  },
};

function transformDatabaseMessageToMessage(dbMessage: DatabaseMessage): MessageWithSender {
  return {
    id: dbMessage.id as UUID,
    roomId: dbMessage.room_id as UUID,
    senderId: dbMessage.sender_id as UUID,
    type: dbMessage.type,
    content: dbMessage.content,
    fileUrl: dbMessage.file_url,
    fileName: dbMessage.file_name,
    fileSize: dbMessage.file_size,
    replyTo: dbMessage.reply_to as UUID,
    editedAt: dbMessage.edited_at,
    deletedAt: dbMessage.deleted_at,
    createdAt: dbMessage.created_at,
    sender: dbMessage.sender ? {
      id: dbMessage.sender.id as UUID,
      username: dbMessage.sender.username,
      display_name: dbMessage.sender.display_name,
      avatarUrl: dbMessage.sender.avatar_url,
      isOnline: false, 
    } : null,
    replyToMessage: null,
  };
}