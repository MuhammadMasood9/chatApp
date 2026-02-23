import { supabaseBrowser } from '@/lib/supabase/browser'
import { Profile } from '@/utils/types'

export const profileService = {
  getProfile: async (userId: string): Promise<Profile> => {
    const { data, error } = await supabaseBrowser()
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error; 
    return data;
  },

  updateProfile: async (userId: string, updates: Partial<Profile>): Promise<Profile> => {
    const { data, error } = await supabaseBrowser()
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  uploadAvatar: async (userId: string, file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`;

    const { error } = await supabaseBrowser()
      .storage
      .from('avatars')
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabaseBrowser()
      .storage
      .from('avatars')
      .getPublicUrl(fileName);

    return publicUrl;
  }
}