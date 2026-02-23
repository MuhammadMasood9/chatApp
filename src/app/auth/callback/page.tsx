'use client'

import React, { useEffect, useMemo, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { RoutePath } from '@/constants/routes'
import { useExchangeCodeForSession } from '@/hooks/useAuth'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const exchange = useExchangeCodeForSession()
  const isProcessingRef = useRef(false)

  const code = searchParams.get('code')
  const type = searchParams.get('type')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  const nextPath = useMemo(() => {
    if (type === 'recovery') return '/auth/reset-password'
    return RoutePath.DASHBOARD
  }, [type])

  useEffect(() => {
    if (isProcessingRef.current) return

    if (error) {
      isProcessingRef.current = true
      setTimeout(() => {
        router.replace(RoutePath.AUTH)
      }, 2000)
      return
    }

    if (!code) {
      isProcessingRef.current = true
      setTimeout(() => {
        router.replace(RoutePath.AUTH)
      }, 2000)
      return
    }

    isProcessingRef.current = true
    exchange.mutate(code, {
      onSuccess: () => {
        router.replace(nextPath)
      },
      onError: () => {
        router.replace(RoutePath.AUTH)
      },
    })
  }, [code, error, exchange, nextPath, router])

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
          className="relative w-full max-w-sm rounded-2xl px-8 py-10 text-center"
          style={{
            background: 'rgba(255, 255, 255, 0.72)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow:
              '0 8px 32px rgba(100, 160, 210, 0.18), 0 1.5px 6px rgba(100,160,210,0.10)',
            border: '1px solid rgba(255,255,255,0.7)',
          }}
        >
          {error ? (
            <>
              <h1 className="text-lg font-bold text-slate-900">Link expired</h1>
              <p className="mt-2 text-sm text-slate-500">
                {errorDescription || 'The recovery link has expired or is invalid.'}
              </p>
              <p className="mt-4 text-sm text-slate-400">Redirecting to login...</p>
            </>
          ) : !code ? (
            <>
              <h1 className="text-lg font-bold text-slate-900">Invalid link</h1>
              <p className="mt-2 text-sm text-slate-500">The verification link is missing required data.</p>
              <p className="mt-4 text-sm text-slate-400">Redirecting to login...</p>
            </>
          ) : (
            <>
              <h1 className="text-lg font-bold text-slate-900">Verifying...</h1>
              <p className="mt-2 text-sm text-slate-500">Please wait while we complete the process.</p>
              {exchange.error?.message && (
                <p className="mt-4 text-sm text-red-500">{exchange.error.message}</p>
              )}
            </>
          )}
        </div>
      </div>
  )
}
