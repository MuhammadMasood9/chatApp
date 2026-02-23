"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiUser, FiMail } from 'react-icons/fi';

import { useAppSelector } from '@/store/hooks';
import { useCallInvitation } from '@/hooks/useCallInvitation';
import { useLogout } from '@/hooks/useAuth';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useRooms } from '@/hooks/useRoom';
import { profileService } from '@/services/profileService';

import { RoutePath } from '@/constants/routes';
import { PROFILE_FORM_FIELDS, SETTINGS_NAV_ITEMS } from '@/constants/settings';

import { AccountInfo, SettingsFormData, User } from '@/utils/types';

import { CallInvitationModal } from '@/component/call/CallInvitationModal';
import { DangerZone } from '@/component/settings/DangerZone';
import { ProfileAvatar } from '@/component/settings/ProfileAvatar';
import { ProfileFormActions } from '@/component/settings/ProfileFormActions';
import { SettingsHeader } from '@/component/settings/SettingsHeader';
import { SettingsSidebar } from '@/component/settings/SettingsSidebar';
import { FormField } from '@/component/ui/FormField';
import { Skeleton } from '@/component/ui/Skeleton';

const SettingLayout = () => {
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const { data: profile, isLoading, error } = useProfile();
  const updateProfile = useUpdateProfile();
  const logout = useLogout();
  useRooms();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { currentInvitation, handleAccept, handleDecline } = useCallInvitation();

  const [activeSection, setActiveSection] = useState('profile');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [formData, setFormData] = useState<SettingsFormData>({
    fullName: '',
    email: '',
    bio: '',
    avatar: ''
  });

  const profileDefaults = useMemo<SettingsFormData>(() => {
    return {
      fullName: profile?.display_name || '',
      email: user?.email || '',
      bio: profile?.bio || '',
      avatar: profile?.avatar_url || '',
    }
  }, [profile, user?.email])

  const resolvedFormData = isEditing ? formData : profileDefaults

  useEffect(() => {
    const handleAcceptCall = (event: CustomEvent) => {
      const { roomId: invitedRoomId } = event.detail;
      router.push(`${RoutePath.DASHBOARD}?roomId=${invitedRoomId}`);
    };

    window.addEventListener('accept-call', handleAcceptCall as EventListener);
    return () => {
      window.removeEventListener('accept-call', handleAcceptCall as EventListener);
    };
  }, [router]);

  const handleInputChange = (field: keyof SettingsFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarChange = (file: File) => {
    setFormData(prev => ({ ...prev, avatar: file }));
  };

  const handleSave = async () => {
    try {
      let avatarUrl = formData.avatar;
      if (formData.avatar instanceof File) {
        avatarUrl = await profileService.uploadAvatar(user!.id, formData.avatar);
      }
      await updateProfile.mutateAsync({
        display_name: formData.fullName,
        bio: formData.bio,
        avatar_url: avatarUrl as string
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
      router.push(RoutePath.AUTH);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };



  const handleCancel = () => {
    setFormData(profileDefaults)
    setIsEditing(false);
  };

  const handleEdit = () => {
    setFormData(profileDefaults)
    setIsEditing(true);
  };

  const accountInfo: AccountInfo[] = [
    { icon: FiUser, label: 'Account ID', value: user?.id || 'N/A', mono: true },
    { icon: FiMail, label: 'Email Verified', value: (user as User)?.emailConfirmedAt ? 'Verified' : 'Unverified', badge: true, verified: !!(user as User)?.emailConfirmedAt },
  ];

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500">Failed to load profile: {error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans text-slate-900">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <SettingsSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onBack={() => router.push(RoutePath.DASHBOARD)}
        isOpen={isSidebarOpen}
        navItems={SETTINGS_NAV_ITEMS}
        formData={resolvedFormData}
      />

      <div className="flex-1 flex flex-col bg-white transition-all duration-300 w-full md:pl-80">
        <SettingsHeader
          activeSection={activeSection}
          isEditing={isEditing}
          onEditClick={handleEdit}
          onLogout={handleLogout}
          isLogoutPending={logout.isPending}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          showSidebarToggle={true}
        />

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          <div className="max-w-3xl mx-auto space-y-6">
            {activeSection === 'profile' && (
              <>
                {isLoading ? (
                  <div className="space-y-6">
                    <div className="flex flex-col items-center space-y-6">
                      <Skeleton variant="circle" width="8rem" height="8rem" />
                      <div className="text-center space-y-2">
                        <Skeleton variant="text" width="12rem" />
                        <Skeleton variant="text" width="16rem" />
                      </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                      <Skeleton variant="text" width="8rem" className="mb-5" />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="space-y-2">
                            <Skeleton variant="text" width="4rem" height="0.75rem" />
                            <Skeleton variant="rectangle" height="2.75rem" />
                          </div>
                        ))}
                      </div>
                      <div className="mt-5 space-y-2">
                        <Skeleton variant="text" width="2rem" height="0.75rem" />
                        <Skeleton variant="rectangle" height="8rem" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <ProfileAvatar
                      formData={resolvedFormData}
                      isEditing={isEditing}
                      onSave={handleSave}
                      onCancel={handleCancel}
                      onAvatarChange={handleAvatarChange}
                    />

                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                      <h3 className="font-bold text-slate-900 mb-5 text-sm uppercase tracking-wider text-slate-400">
                        Personal Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {PROFILE_FORM_FIELDS.map(({ field, label, type, icon: Icon, placeholder, readOnly }) => (
                          <FormField
                            key={field}
                            label={label}
                            type={type}
                            value={resolvedFormData[field as keyof SettingsFormData] as string}
                            onChange={(value) => handleInputChange(field as keyof SettingsFormData, value)}
                            placeholder={placeholder}
                            icon={<Icon />}
                            readOnly={!isEditing || readOnly}
                          />
                        ))}
                      </div>

                      <div className="mt-5 space-y-2">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Bio</label>
                        {isEditing ? (
                          <textarea
                            value={resolvedFormData.bio}
                            onChange={(e) => handleInputChange('bio', e.target.value)}
                            rows={4}
                            placeholder="Tell us about yourself..."
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
                          />
                        ) : (
                          <div className="px-4 py-3 bg-slate-50 rounded-xl text-sm text-slate-700 min-h-[80px] border border-slate-100">
                            {resolvedFormData.bio || <span className="text-slate-400">No bio added yet</span>}
                          </div>
                        )}
                      </div>

                      <ProfileFormActions
                        isEditing={isEditing}
                        isPending={updateProfile.isPending}
                        onSave={handleSave}
                        onCancel={handleCancel}
                      />
                    </div>
                  </>
                )}
              </>
            )}

            {activeSection === 'account' && (
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-5 text-sm uppercase tracking-wider text-slate-400">
                  Account Information
                </h3>
                {accountInfo.map(({ icon: Icon, label, value, mono, badge, verified }) => (
                  <div key={label} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-slate-500" />
                      </div>
                      <span className="text-sm font-medium text-slate-700">{label}</span>
                    </div>
                    {badge ? (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          verified ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {value}
                      </span>
                    ) : (
                      <span
                        className={`text-sm text-slate-500 ${mono ? 'font-mono text-xs' : ''} max-w-[200px] truncate`}
                      >
                        {value}
                      </span>
                    )}
                  </div>
                ))}

                <DangerZone onDeleteAccount={() => console.log('Delete account')} />
              </div>
            )}
          </div>
        </div>
        
      </div>

      <CallInvitationModal
        invitation={currentInvitation}
        onAccept={handleAccept}
        onDecline={handleDecline}
      />
    </div>
  );
};

export default SettingLayout;
