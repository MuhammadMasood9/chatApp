import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { profileService } from '@/services/profileService'
import { useAppSelector } from '@/store/hooks'
import { Profile } from '@/utils/types'

export const useProfile = () => {
  const { user } = useAppSelector((state) => state.auth)

  return useQuery<Profile>({
    queryKey: ['profile', user?.id],
    queryFn: () => profileService.getProfile(user!.id),
    enabled: !!user?.id
  })
}

export const useUpdateProfile = () => {
  const { user } = useAppSelector((state) => state.auth)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (updates: Partial<Profile>) => 
      profileService.updateProfile(user!.id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] })
    }
  })
}