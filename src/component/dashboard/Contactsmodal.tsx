"use client";

import { useState } from "react";
import {
  FiUserPlus,
  FiCheck,
  FiXCircle,
  FiClock,
  FiSlash,
  FiSend,
  FiMail,
} from "react-icons/fi";
import {
  usePendingContacts,
  useContacts,
  useSendContactInvitationByEmail,
  useUpdateContactStatus,
} from "@/hooks/useContact";
import { ContactStatus } from "@/utils/types";
import { ModalShell } from "@/component/dashboard/contacts-modal/ModalShell";
import { ModalHeader } from "@/component/dashboard/contacts-modal/ModalHeader";
import { TabsBar } from "@/component/dashboard/contacts-modal/TabsBar";
import { LoadingState } from "@/component/dashboard/contacts-modal/LoadingState";
import { EmptyState } from "@/component/dashboard/contacts-modal/EmptyState";
import { FeedbackBanner } from "@/component/dashboard/contacts-modal/FeedbackBanner";
import { ContactRow } from "@/component/dashboard/contacts-modal/ContactRow";
import {
  ContactTabId,
  FEEDBACK_META,
  FeedbackState,
  getContactsModalTabs,
  type TabType,
} from "@/constants/contact";

interface ContactsModalProps {
  isOpen: boolean;
  onClose: VoidFunction;
}

export const ContactsModal = ({ isOpen, onClose }: ContactsModalProps) => {
  const [activeTab, setActiveTab] = useState<TabType>(ContactTabId.Pending);
  const [emailInput, setEmailInput] = useState<string>("");
  const [feedbackState, setFeedbackState] = useState<FeedbackState>(FeedbackState.Idle);

  const { data: pendingContacts, isLoading: pendingLoading } =
    usePendingContacts();
  const { data: allContacts, isLoading: allLoading } = useContacts();
  const sendInvitation = useSendContactInvitationByEmail();
  const updateStatus = useUpdateContactStatus();

  const sentContacts = allContacts?.filter(
    (c) => c.status === ContactStatus.Pending,
  );

  const handleSendInvite = () => {
    if (!emailInput.trim()) return;
    setFeedbackState(FeedbackState.Idle);

    sendInvitation.mutate(emailInput.trim(), {
      onSuccess: () => {
        setFeedbackState(FeedbackState.Success);
        setEmailInput("");
        setTimeout(() => {
          setFeedbackState(FeedbackState.Idle);
          setActiveTab(ContactTabId.Sent);
        }, 1800);
      },
      onError: (err: Error) => {
        const msg = err.message.toLowerCase();
        if (msg.includes("not found") || msg.includes("not registered")) {
          setFeedbackState(FeedbackState.NotFound);
        } else if (msg.includes("already")) {
          setFeedbackState(FeedbackState.AlreadySent);
        } else if (msg.includes("yourself")) {
          setFeedbackState(FeedbackState.Self);
        } else if (msg.includes("not authenticated")) {
          setFeedbackState(FeedbackState.Self);
        }
      },
    });
  };

  const handleAccept = (contactRowId: string) => {
    updateStatus.mutate({ contactRowId, status: ContactStatus.Accepted });
  };

  const handleDecline = (contactRowId: string) => {
    updateStatus.mutate({ contactRowId, status: ContactStatus.Blocked });
  };

  const handleCancel = (contactRowId: string) => {
    updateStatus.mutate({ contactRowId, status: ContactStatus.Blocked });
  };

  if (!isOpen) return null;

  const tabs = getContactsModalTabs({
    pending: pendingContacts?.length,
    sent: sentContacts?.length,
  });

  return (
    <ModalShell onClose={onClose}>
      <div className="px-6 pt-6 pb-4 border-b border-slate-100">
        <ModalHeader onClose={onClose} />
        <TabsBar tabs={tabs} activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab)} />
      </div>

      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
        {activeTab === ContactTabId.Pending && (
          <div className="p-4 space-y-2">
            {pendingLoading ? (
              <LoadingState />
            ) : !pendingContacts?.length ? (
              <EmptyState
                icon={<FiClock className="w-6 h-6 text-slate-300" />}
                title="No pending requests"
                subtitle="You are all caught up!"
              />
            ) : (
              pendingContacts.map((contact) => (
                <ContactRow
                  key={contact.id}
                  contact={contact}
                  avatarClassName="bg-gradient-to-br from-blue-400 to-blue-600"
                  actions={
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => handleAccept(contact.id)}
                        disabled={updateStatus.isPending}
                        className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all border border-emerald-100 disabled:opacity-50"
                        title="Accept"
                      >
                        <FiCheck className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDecline(contact.id)}
                        disabled={updateStatus.isPending}
                        className="p-2 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all border border-red-100 disabled:opacity-50"
                        title="Decline"
                      >
                        <FiXCircle className="w-4 h-4" />
                      </button>
                    </div>
                  }
                />
              ))
            )}
          </div>
        )}

        {activeTab === ContactTabId.Sent && (
          <div className="p-4 space-y-2">
            {allLoading ? (
              <LoadingState />
            ) : !sentContacts?.length ? (
              <EmptyState
                icon={<FiSend className="w-6 h-6 text-slate-300" />}
                title="No sent requests"
                subtitle="Invite someone to connect!"
              />
            ) : (
              sentContacts.map((contact) => (
                <ContactRow
                  key={contact.id}
                  contact={contact}
                  avatarClassName="bg-gradient-to-br from-slate-300 to-slate-500"
                  actions={
                    <button
                      onClick={() => handleCancel(contact.id)}
                      disabled={updateStatus.isPending}
                      className="p-2 bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all disabled:opacity-50"
                      title="Cancel request"
                    >
                      <FiSlash className="w-4 h-4" />
                    </button>
                  }
                />
              ))
            )}
          </div>
        )}

        {activeTab === ContactTabId.Invite && (
          <div className="p-6 space-y-5">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
                <FiUserPlus className="w-7 h-7 text-blue-500" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Send an Invitation</h3>
              <p className="text-xs text-slate-400 mt-1">
                Enter their email — we will find their account and send the request
              </p>
            </div>

            <div className="space-y-3">
              <div className="relative group">
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="email"
                  placeholder="friend@example.com"
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    if (feedbackState !== FeedbackState.Idle) setFeedbackState(FeedbackState.Idle);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleSendInvite()}
                  className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-2xl text-sm focus:ring-2 focus:bg-white transition-all outline-none placeholder:text-slate-400 ${
                    feedbackState === FeedbackState.NotFound || feedbackState === FeedbackState.Self
                      ? "border-red-300 focus:ring-red-500/20 focus:border-red-400"
                      : feedbackState === FeedbackState.Success
                        ? "border-emerald-300 focus:ring-emerald-500/20 focus:border-emerald-400"
                        : feedbackState === FeedbackState.AlreadySent
                          ? "border-amber-300 focus:ring-amber-500/20 focus:border-amber-400"
                          : "border-slate-200 focus:ring-blue-500/20 focus:border-blue-300"
                  }`}
                />
              </div>

              {emailInput && (
                <p className="text-[11px] text-slate-400 px-1">Please enter a valid email address.</p>
              )}

              {feedbackState !== FeedbackState.Idle && (
                <FeedbackBanner
                  config={{
                    icon:
                      feedbackState === FeedbackState.AlreadySent ? (
                        <FiClock className="w-4 h-4 flex-shrink-0" />
                      ) : feedbackState === FeedbackState.Success ? (
                        <FiCheck className="w-4 h-4 flex-shrink-0" />
                      ) : (
                        <FiXCircle className="w-4 h-4 flex-shrink-0" />
                      ),
                    text: FEEDBACK_META[feedbackState].text,
                    className: FEEDBACK_META[feedbackState].className,
                  }}
                />
              )}

              <button
                onClick={handleSendInvite}
                disabled={
                  !emailInput.trim() ||
                  sendInvitation.isPending ||
                  feedbackState === FeedbackState.Success
                }
                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-2xl text-sm font-semibold transition-all shadow-md shadow-blue-100 disabled:shadow-none"
              >
                {sendInvitation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Looking up user...
                  </>
                ) : feedbackState === FeedbackState.Success ? (
                  <>
                    <FiCheck className="w-4 h-4" />
                    Request Sent!
                  </>
                ) : (
                  <>
                    <FiSend className="w-4 h-4" />
                    Send Invitation
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
};
