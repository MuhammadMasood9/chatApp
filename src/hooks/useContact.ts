import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAppSelector } from '@/store/hooks'
import { contactService } from '@/services/contactService'
import { Contact, ContactStatus } from '@/utils/types'

const contactKeys = {
  all:     (userId: string) => ['contacts', userId] as const,
  pending: (userId: string) => ['contacts', userId, 'pending'] as const,
};

export const useContacts = () => {
  const { user } = useAppSelector((state) => state.auth)
  return useQuery<Contact[]>({
    queryKey: contactKeys.all(user?.id ?? ''),
    queryFn: () => {
      if (!user) return Promise.resolve([]);
      return contactService.getContacts(user.id);
    },
    enabled: !!user?.id,
  });
};

export const usePendingContacts = () => {
  const { user } = useAppSelector((state) => state.auth)
  return useQuery<Contact[]>({
    queryKey: contactKeys.pending(user?.id ?? ''),
    queryFn: () => {
      if (!user) return Promise.resolve([]);
      return contactService.getPendingContacts(user.id);
    },
    enabled: !!user?.id,
  });
};

export const useSendContactInvitationByEmail = () => {
  const { user } = useAppSelector((state) => state.auth);
  const queryClient = useQueryClient();
  return useMutation<Contact, Error, string>({
    mutationFn: (email: string) => {
      if (!user) throw new Error('Not authenticated');
      return contactService.sendContactInvitationByEmail(user.id, email);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactKeys.all(user!.id) });
    },
  });
};

export const useUpdateContactStatus = () => {
  const { user } = useAppSelector((state) => state.auth);
  const queryClient = useQueryClient();
  return useMutation<Contact, Error, { contactRowId: string; status: ContactStatus }>({
    mutationFn: ({ contactRowId, status }) =>
      contactService.updateContactStatus(contactRowId, status, user?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactKeys.all(user!.id) });
      queryClient.invalidateQueries({ queryKey: contactKeys.pending(user!.id) });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
};

export const useRemoveContact = () => {
  const { user } = useAppSelector((state) => state.auth)
  const queryClient = useQueryClient();
  return useMutation<VoidFunction, Error, string>({
    mutationFn: (contactRowId: string) => contactService.removeContact(contactRowId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactKeys.all(user!.id) });
    },
  });
};