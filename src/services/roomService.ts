import { supabaseBrowser } from '@/lib/supabase/browser'
import { RoomType, UUID, RoomWithDetails, MemberRole } from '@/utils/types'

export interface DatabaseRoom {
  id: string;
  name: string | null;
  type: RoomType;
  created_by: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  members: {
    user_id: string;
    role: string;
    profile: {
      id: string;
      username: string;
      display_name: string | null;
      avatar_url: string | null;
    } | null;
  }[];
}

export const roomService = {
  getRooms: async (userId: string): Promise<RoomWithDetails[]> => {
    const { data: memberRows, error: memberError } = await supabaseBrowser()
      .from('room_members')
      .select('room_id')
      .eq('user_id', userId);

    if (memberError) throw memberError;
    if (!memberRows || memberRows.length === 0) return [];

    const roomIds = memberRows.map((r) => r.room_id);

    const { data, error } = await supabaseBrowser()
      .from('rooms')
      .select(`
        id,
        name,
        type,
        created_by,
        avatar_url,
        created_at,
        updated_at,
        members:room_members (
          user_id,
          role,
          profile:profiles (
            id,
            username,
            display_name,
            avatar_url
          )
        )
      `)
      .in('id', roomIds)
      .order('updated_at', { ascending: false });

    if (error) {
      throw error;
    }
    
    const dbRooms = (data as unknown as DatabaseRoom[]) ?? [];
    return dbRooms.map(transformDatabaseRoomToRoomWithDetails);
  },
};

function transformDatabaseRoomToRoomWithDetails(dbRoom: DatabaseRoom): RoomWithDetails {
  return {
    id: dbRoom.id as UUID,
    name: dbRoom.name,
    type: dbRoom.type,
    createdBy: dbRoom.created_by as UUID,
    avatarUrl: dbRoom.avatar_url,
    createdAt: dbRoom.created_at,
    updatedAt: dbRoom.updated_at,
    members: dbRoom.members.map(member => ({
      id: '', 
      roomId: dbRoom.id as UUID,
      userId: member.user_id as UUID,
      role: member.role as MemberRole, 
      joinedAt: '', 
      profile: member.profile ? {
        id: member.profile.id as UUID,
        username: member.profile.username,
        display_name: member.profile.display_name,
        avatar_url: member.profile.avatar_url,
        bio: null,
        createdAt: '',
        updatedAt: '',
      } : undefined
    })),
    lastMessage: null,
    unreadCount: 0,
  };
}

