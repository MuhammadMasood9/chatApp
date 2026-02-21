import { supabaseBrowser } from '@/lib/supabase/browser'
import { Contact, ContactStatus, VoidFunction } from '@/utils/types'

export const contactService = {
  getContacts: async (userId: string): Promise<Contact[]> => {
    const { data, error } = await supabaseBrowser()
      .from('contacts')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return data ?? [];
  },

  getPendingContacts: async (userId: string): Promise<Contact[]> => {
    const { data, error } = await supabaseBrowser()
      .from('contacts')
      .select('*')
      .eq('contact_id', userId)
      .eq('status', ContactStatus.Pending);
    if (error) throw error;
    return data ?? [];
  },

  lookupUserByEmail: async (email: string): Promise<{ id: string } | null> => {
    const { data, error } = await supabaseBrowser()
      .from('profiles')
      .select('*')
      .eq('username', email)
      .single();
    if (error || !data) return null;
    return data;
  },

  sendContactInvitationByEmail: async (userId: string, email: string): Promise<Contact> => {
    const found = await contactService.lookupUserByEmail(email);
    if (!found) throw new Error('User not found. They may not be registered yet.');
    if (found.id === userId) throw new Error('You cannot add yourself as a contact.');

    const { data, error } = await supabaseBrowser()
      .from('contacts')
      .insert({ user_id: userId, contact_id: found.id, status: ContactStatus.Pending })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') throw new Error('Contact request already sent.');
      throw error;
    }
    return data;
  },

  updateContactStatus: async (
    contactId: string,
    status: ContactStatus,
    currentUserId?: string
  ): Promise<Contact> => {
    const supabase = supabaseBrowser();

    const { data: contact, error } = await supabase
      .from('contacts')
      .update({ status })
      .eq('id', contactId)
      .select()
      .single();
    if (error) throw error;

    if (status === ContactStatus.Accepted && currentUserId && contact) {
      const otherUserId =
        contact.user_id === currentUserId ? contact.contact_id : contact.user_id;

      const { data: existingMembers } = await supabase
        .from('room_members')
        .select('room_id')
        .eq('user_id', currentUserId);

      const existingRoomIds = (existingMembers ?? []).map((m) => m.room_id);
      let directRoomExists = false;

      if (existingRoomIds.length > 0) {
        const { data: sharedRooms } = await supabase
          .from('room_members')
          .select('room_id')
          .eq('user_id', otherUserId)
          .in('room_id', existingRoomIds);

        if (sharedRooms && sharedRooms.length > 0) {
          const sharedRoomIds = sharedRooms.map((r) => r.room_id);
          const { data: directRooms } = await supabase
            .from('rooms')
            .select('id')
            .in('id', sharedRoomIds)
            .eq('type', 'direct');
          directRoomExists = !!(directRooms && directRooms.length > 0);
        }
      }

      if (!directRoomExists) {
        const { data: newRoom, error: roomError } = await supabase
          .from('rooms')
          .insert({ type: 'direct', created_by: currentUserId })
          .select()
          .single();

        if (roomError) {
          console.error('Failed to create direct room:', roomError.message);
          return contact;
        }

        const { error: membersError } = await supabase
          .from('room_members')
          .insert([
            { room_id: newRoom.id, user_id: currentUserId, role: 'member' },
            { room_id: newRoom.id, user_id: otherUserId, role: 'member' },
          ]);

        if (membersError) {
          console.error('Failed to add room members:', membersError.message);
        }
      }
    }

    return contact;
  },

  removeContact: async (contactId: string): Promise<VoidFunction> => {
    const { error } = await supabaseBrowser()
      .from('contacts')
      .delete()
      .eq('id', contactId);
    if (error) throw error;
    return () => {}
  },
};