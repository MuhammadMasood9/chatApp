import { supabaseBrowser } from '@/lib/supabase/browser'
import type { RealtimeChannel } from '@supabase/supabase-js'

export enum CallType {
  Video = 'video',
  Audio = 'audio',
}

export enum CallInvitationStatus {
  Pending = 'pending',
  Accepted = 'accepted',
  Declined = 'declined',
  Cancelled = 'cancelled',
}

export enum CallStatus {
  Ongoing = 'ongoing',
  Ended = 'ended',
  Missed = 'missed',
}

export interface CallInvitation {
  id: string;
  room_id: string;
  caller_id: string;
  receiver_id: string;
  status: CallInvitationStatus;
  created_at: string;
  updated_at: string;
  caller?: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface Call {
  id: string;
  room_id: string;
  initiator_id: string;
  type: CallType;
  status: CallStatus;
  started_at: string;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
  initiator?: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface CallParticipant {
  id: string;
  call_id: string;
  user_id: string;
  joined_at: string;
  left_at: string | null;
  is_audio_enabled: boolean;
  is_video_enabled: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export const callService = {
  sendCallInvitation: async (
    roomId: string,
    callerId: string,
    receiverId: string
  ): Promise<CallInvitation> => {
    const { data, error } = await supabaseBrowser()
      .from('call_invitations')
      .insert({
        room_id: roomId,
        caller_id: callerId,
        receiver_id: receiverId,
        status: 'pending',
      })
      .select(`
        *,
        caller:profiles!caller_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .single();

    if (error) throw error;
    return data as unknown as CallInvitation;
  },

  getPendingInvitations: async (userId: string): Promise<CallInvitation[]> => {
    const { data, error } = await supabaseBrowser()
      .from('call_invitations')
      .select(`
        *,
        caller:profiles!caller_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('receiver_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as unknown as CallInvitation[]) ?? [];
  },

  updateInvitationStatus: async (
    invitationId: string,
    status: 'accepted' | 'declined' | 'cancelled'
  ): Promise<void> => {
    const { error } = await supabaseBrowser()
      .from('call_invitations')
      .update({ status })
      .eq('id', invitationId);

    if (error) throw error;
  },

  subscribeToCallInvitations: (
    roomId: string,
    onInvitation: (invitation: CallInvitation) => VoidFunction
  ): RealtimeChannel => {
    return supabaseBrowser()
      .channel(`call_invitations:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_invitations',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          const { data } = await supabaseBrowser()
            .from('call_invitations')
            .select(`
              *,
              caller:profiles!caller_id (
                id,
                username,
                display_name,
                avatar_url
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) onInvitation(data as unknown as CallInvitation);
        }
      )
      .subscribe((status, err) => {
        if (err) {
          console.error('Subscription error:', err)
        }
      });
  },

  subscribeToAllCallInvitations: (
    userId: string,
    onInvitation: (invitation: CallInvitation) => void
  ): RealtimeChannel => {
    return supabaseBrowser()
      .channel(`call_invitations:user:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_invitations',
          filter: `receiver_id=eq.${userId}`,
        },
        async (payload) => {
          const { data } = await supabaseBrowser()
            .from('call_invitations')
            .select(`
              *,
              caller:profiles!caller_id (
                id,
                username,
                display_name,
                avatar_url
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) onInvitation(data as unknown as CallInvitation);
        }
      )
      .subscribe((status, err) => {
        if (err) {
          console.error('Global subscription error:', err)
        }
      });
  },

  createCall: async (
    roomId: string,
    initiatorId: string,
    type: 'video' | 'audio' = 'video'
  ): Promise<Call> => {
    const { data, error } = await supabaseBrowser()
      .from('calls')
      .insert({
        room_id: roomId,
        initiator_id: initiatorId,
        type,
        status: 'ongoing',
      })
      .select(`
        *,
        initiator:profiles!initiator_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .single();

    if (error) throw error;
    return data as unknown as Call;
  },

  endCall: async (callId: string): Promise<void> => {
    const { error } = await supabaseBrowser()
      .from('calls')
      .update({ 
        status: 'ended',
        ended_at: new Date().toISOString()
      })
      .eq('id', callId);

    if (error) throw error;
  },

  addCallParticipant: async (
    callId: string,
    userId: string,
    isAudioEnabled: boolean = true,
    isVideoEnabled: boolean = true
  ): Promise<CallParticipant> => {
    const { data, error } = await supabaseBrowser()
      .from('call_participants')
      .insert({
        call_id: callId,
        user_id: userId,
        is_audio_enabled: isAudioEnabled,
        is_video_enabled: isVideoEnabled,
      })
      .select(`
        *,
        user:profiles!user_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .single();

    if (error) throw error;
    return data as unknown as CallParticipant;
  },

  removeCallParticipant: async (callId: string, userId: string): Promise<void> => {
    const { error } = await supabaseBrowser()
      .from('call_participants')
      .update({ left_at: new Date().toISOString() })
      .eq('call_id', callId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  getCallParticipants: async (callId: string): Promise<CallParticipant[]> => {
    const { data, error } = await supabaseBrowser()
      .from('call_participants')
      .select(`
        *,
        user:profiles!user_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('call_id', callId)
      .is('left_at', null);

    if (error) throw error;
    return (data as unknown as CallParticipant[]) ?? [];
  },
};
