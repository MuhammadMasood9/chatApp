'use client';

import React, { useRef } from 'react';
import { FiCamera, FiEdit3, FiCheck, FiX } from 'react-icons/fi';
import { getFirstLetter } from '@/helper/text';
import { SettingsFormData } from '@/utils/types';

interface ProfileAvatarProps {
  formData: SettingsFormData;
  isEditing: boolean;
  onSave?: VoidFunction;
  onCancel?: VoidFunction;
  onAvatarChange?: (file: File) => void;
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ 
  formData, 
  isEditing, 
  onSave, 
  onCancel,
  onAvatarChange
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onAvatarChange) {
      onAvatarChange(file);
    }
  };

  const getAvatarSrc = () => {
    if (formData.avatar instanceof File) {
      return URL.createObjectURL(formData.avatar);
    }
    return typeof formData.avatar === 'string' && formData.avatar ? formData.avatar : null;
  };

  const avatarSrc = getAvatarSrc();

  return (
    <div className=" p-3 ">
      <div className="flex flex-col items-center space-y-6">
   
        <div className="relative group">
          <div className="relative">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt="Profile Avatar"
                className="w-32 h-32 rounded-3xl object-cover shadow-2xl transform transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center text-4xl font-bold text-white shadow-2xl transform transition-transform group-hover:scale-105">
                {getFirstLetter(formData.fullName)}
              </div>
            )}
            
            <div className="absolute bottom-2 right-2 w-6 h-6 bg-emerald-500 rounded-full border-4 border-white shadow-md"></div>
            
            {isEditing && (
              <div 
                className="absolute inset-0 bg-black/40 rounded-3xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={handleCameraClick}
              >
                <FiCamera className="w-8 h-8 text-white" />
              </div>
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">
            {formData.fullName || 'Your Name'}
          </h2>
          <p className="text-sm text-slate-500">
            {formData.email || 'your.email@example.com'}
          </p>
        </div>

        {isEditing && (
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium shadow-sm"
            >
              <FiX className="w-4 h-4" />
              Cancel
            </button>
            <button
              onClick={onSave}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium shadow-md shadow-blue-100"
            >
              <FiCheck className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        )}

      
      </div>
    </div>
  );
};
