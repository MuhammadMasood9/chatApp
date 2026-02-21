'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RoutePath } from '@/constants/routes'
import { useUpdatePassword } from '@/hooks/useAuth'

export default function ResetPasswordPage() {
  const router = useRouter()
  const updatePassword = useUpdatePassword()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [done, setDone] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters')
      return
    }

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match')
      return
    }

    updatePassword.mutate(
      { password },
      {
        onSuccess: () => {
          setDone(true)
        },
      }
    )
  }

  return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden font-sans">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              'linear-gradient(160deg, #daeeff 0%, #c8e8fa 30%, #b8dff5 60%, #cce9fb 100%)',
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
            background: 'rgba(255, 255, 255, 0.72)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow:
              '0 8px 32px rgba(100, 160, 210, 0.18), 0 1.5px 6px rgba(100,160,210,0.10)',
            border: '1px solid rgba(255,255,255,0.7)',
          }}
        >
          <div className="text-center">
            <h1 className="text-lg font-bold text-slate-900">Reset password</h1>
            <p className="mt-2 text-sm text-slate-500">Create a new password for your account.</p>
          </div>

          {done ? (
            <div className="mt-6 text-center">
              <p className="text-sm text-emerald-600">Password updated successfully.</p>
              <button
                onClick={() => router.replace(RoutePath.AUTH)}
                className="mt-6 w-full rounded-lg py-2.5 text-sm font-semibold text-white transition active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, #1a1a2e 0%, #2d2d44 100%)',
                  boxShadow: '0 2px 8px rgba(30,30,60,0.18)',
                }}
              >
                Go to Login
              </button>
            </div>
          ) : (
            <form className="mt-6 flex flex-col gap-3" onSubmit={handleSubmit}>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password"
                  required
                  className="w-full rounded-lg border border-gray-200 bg-white/80 py-2.5 px-4 text-sm text-gray-700 outline-none transition placeholder:text-gray-300 focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                />
              </div>

              <div className="relative">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  className="w-full rounded-lg border border-gray-200 bg-white/80 py-2.5 px-4 text-sm text-gray-700 outline-none transition placeholder:text-gray-300 focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                />
              </div>

              {(localError || updatePassword.error?.message) && (
                <p className="text-center text-sm text-red-500">{localError || updatePassword.error?.message}</p>
              )}

              <button
                type="submit"
                disabled={updatePassword.isPending}
                className="mt-1 w-full rounded-lg py-2.5 text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-60"
                style={{
                  background: 'linear-gradient(135deg, #1a1a2e 0%, #2d2d44 100%)',
                  boxShadow: '0 2px 8px rgba(30,30,60,0.18)',
                }}
              >
                {updatePassword.isPending ? 'Updating...' : 'Update password'}
              </button>

              <button
                type="button"
                onClick={() => router.push(RoutePath.AUTH)}
                className="text-center text-[0.8rem] text-gray-400 transition hover:text-sky-500"
              >
                Back to login
              </button>
            </form>
          )}
        </div>
      </div>
  )
}
