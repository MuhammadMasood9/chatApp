import { useQuery } from '@tanstack/react-query'
import { useAppSelector } from '@/store/hooks'
import { roomService } from '@/services/roomService'
import { RoomWithDetails } from '@/utils/types'

export const roomKeys = {
  all: (userId: string) => ['rooms', userId] as const,
};

export const useRooms = () => {
  const { user } = useAppSelector((state) => state.auth);

  return useQuery<RoomWithDetails[]>({
    queryKey: roomKeys.all(user?.id ?? ''),
    queryFn: () => {
      if (!user) return Promise.resolve([]);
      return roomService.getRooms(user.id);
    },
    enabled: !!user?.id,
  });
};

export const getDirectRoomPeer = (room: RoomWithDetails, currentUserId: string) => {
  return room.members.find((m) => m.userId !== currentUserId);
};