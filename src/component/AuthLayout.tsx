"use client";
import React, { useState } from "react";
import { useLogin, useRegister } from "@/hooks/useAuth";
import { useAppSelector } from "@/store/hooks";
import AuthGuard from "@/component/AuthGuard";

import { AuthForm } from '@/component/auth/AuthForm';
import { AuthHeader } from '@/component/auth/AuthHeader';
import { AuthFooter } from '@/component/auth/AuthFooter';

import { AuthMode, AuthFormData } from '@/utils/types';

export default function AuthLayoutRefactored() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [clientError, setClientError] = useState<string | null>(null);
  const [formData, setFormData] = useState<AuthFormData>({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: ""
  });

  const login = useLogin();
  const register = useRegister();
  const { isLoading } = useAppSelector((state) => state.auth);

  const handleInputChange = (field: keyof AuthFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (clientError) setClientError(null)
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setClientError(null)

    if (mode === "signup") {
      if (formData.password !== formData.confirmPassword) {
        setClientError('Passwords do not match')
        return;
      }
      register.mutate({
        email: formData.email,
        password: formData.password,
        username: formData.fullName.toLowerCase().replace(/\s+/g, '_'),
        display_name: formData.fullName
      });
    } else {
      login.mutate({
        email: formData.email,
        password: formData.password
      });
    }
  };

  const toggleMode = () => {
    setMode(mode === "signin" ? "signup" : "signin");
    setClientError(null)
  };

  const error = clientError || login.error?.message || register.error?.message;
  const isPending = login.isPending || register.isPending;

  return (
    <AuthGuard requireAuth={false}>
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden font-sans">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "linear-gradient(160deg, #daeeff 0%, #c8e8fa 30%, #b8dff5 60%, #cce9fb 100%)",
          }}
        />

        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            backgroundImage: `
              radial-gradient(ellipse 600px 300px at 10% 80%, rgba(255,255,255,0.55) 0%, transparent 70%),
              radial-gradient(ellipse 500px 250px at 85% 70%, rgba(255,255,255,0.45) 0%, transparent 70%),
              radial-gradient(ellipse 400px 200px at 50% 90%, rgba(255,255,255,0.35) 0%, transparent 70%)
            `,
          }}
        />

        <div
          className="relative w-full max-w-sm rounded-2xl px-8 py-10"
          style={{
            background: "rgba(255, 255, 255, 0.72)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            boxShadow:
              "0 8px 32px rgba(100, 160, 210, 0.18), 0 1.5px 6px rgba(100,160,210,0.10)",
            border: "1px solid rgba(255,255,255,0.7)",
          }}
        >
          <div className="mb-5 flex justify-center">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{
                background: "rgba(255,255,255,0.9)",
                boxShadow: "0 2px 10px rgba(100,160,210,0.18)",
                border: "1px solid rgba(200,230,250,0.6)",
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="" x2="" y2="" />
              </svg>
            </div>
          </div>

          <AuthHeader mode={mode} />

          <AuthForm
            mode={mode}
            formData={formData}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
            isLoading={isLoading || isPending}
            error={error}
          />

          <AuthFooter mode={mode} onModeToggle={toggleMode} />
        </div>
      </div>
    </AuthGuard>
  );
}
