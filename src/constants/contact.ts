import { ContactStatus } from '@/utils/types'

export enum ContactTabId {
  Pending = 'pending',
  Sent = 'sent',
  Invite = 'invite',
}

export enum ContactTabLabel {
  Pending = 'Received',
  Sent = 'Sent',
  Invite = 'Invite',
}

export enum ContactStatusLabel {
  Pending = 'Pending',
  Accepted = 'Accepted',
  Blocked = 'Blocked',
}

export const CONTACT_TABS: Array<{ id: ContactTabId; label: string }> = [
  { id: ContactTabId.Pending, label: ContactTabLabel.Pending },
  { id: ContactTabId.Sent, label: ContactTabLabel.Sent },
  { id: ContactTabId.Invite, label: ContactTabLabel.Invite },
]

export type TabType = ContactTabId

export enum FeedbackState {
  Idle = 'idle',
  NotFound = 'not_found',
  AlreadySent = 'already_sent',
  Success = 'success',
  Self = 'self',
}

export const getContactsModalTabs = (counts: {
  pending?: number
  sent?: number
}) => {
  return CONTACT_TABS.map(t => ({
    ...t,
    count: t.id === ContactTabId.Pending ? counts.pending : t.id === ContactTabId.Sent ? counts.sent : undefined,
  }))
}

export const STATUS_BADGE_META: Record<ContactStatus, { label: string; className: string }> = {
  [ContactStatus.Pending]: {
    label: ContactStatusLabel.Pending,
    className: 'bg-amber-50 text-amber-600 border border-amber-200',
  },
  [ContactStatus.Accepted]: {
    label: ContactStatusLabel.Accepted,
    className: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
  },
  [ContactStatus.Blocked]: {
    label: ContactStatusLabel.Blocked,
    className: 'bg-red-50 text-red-500 border border-red-200',
  },
}

export const FEEDBACK_META: Record<Exclude<FeedbackState, FeedbackState.Idle>, { text: string; className: string }> = {
  [FeedbackState.NotFound]: {
    text: 'No account found with this email. They may not be registered yet.',
    className: 'bg-red-50 border-red-100 text-red-600',
  },
  [FeedbackState.AlreadySent]: {
    text: 'A contact request has already been sent to this user.',
    className: 'bg-amber-50 border-amber-100 text-amber-600',
  },
  [FeedbackState.Success]: {
    text: 'Contact request sent successfully!',
    className: 'bg-emerald-50 border-emerald-100 text-emerald-600',
  },
  [FeedbackState.Self]: {
    text: 'You cannot send a contact request to yourself.',
    className: 'bg-slate-50 border-slate-200 text-slate-500',
  },
}
