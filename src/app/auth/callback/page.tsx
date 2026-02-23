'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { RoutePath } from '@/constants/routes'
import { useExchangeCodeForSession } from '@/hooks/useAuth'
import { useAppSelector } from '@/store/hooks'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const exchange = useExchangeCodeForSession()
  const isProcessingRef = useRef(false)
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [errorMessage, setErrorMessage] = useState<string>('')
  
  const session = useAppSelector((state) => state.auth.session)

  const code = searchParams.get('code')
  const type = searchParams.get('type')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  const nextPath = type === 'recovery' ? '/auth/reset-password' : RoutePath.DASHBOARD

  useEffect(() => {
    if (isProcessingRef.current) return

    if (error) {
      isProcessingRef.current = true
      setStatus('error')
      setErrorMessage(errorDescription || 'The link has expired or is invalid.')
      setTimeout(() => {
        router.replace(RoutePath.AUTH)
      }, 3000)
      return
    }

    if (!code) {
      isProcessingRef.current = true
      setStatus('error')
      setErrorMessage('The verification link is missing required data.')
      setTimeout(() => {
        router.replace(RoutePath.AUTH)
      }, 3000)
      return
    }

    isProcessingRef.current = true
    exchange.mutate(code)
  }, [code, error, errorDescription]) 

  useEffect(() => {
    if (session) {
      setStatus('success')
      router.replace(nextPath)
    }
  }, [session, nextPath, router])

  useEffect(() => {
    if (exchange.isError && exchange.error) {
      setStatus('error')
      setErrorMessage(exchange.error.message || 'Failed to verify. Please try again.')
      setTimeout(() => {
        router.replace(RoutePath.AUTH)
      }, 3000)
    }
  }, [exchange.isError, exchange.error, router])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (status === 'verifying' && !session) {
        router.replace(RoutePath.AUTH)
      }
    }, 5000)

    return () => clearTimeout(timer)
  }, [status, session, router])

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
          {status === 'error' ? (
            <>
              <h1 className="text-lg font-bold text-red-600">Verification Failed</h1>
              <p className="mt-2 text-sm text-slate-500">
                {errorMessage}
              </p>
              <p className="mt-4 text-sm text-slate-400">Redirecting to login...</p>
            </>
          ) : status === 'success' ? (
            <>
              <h1 className="text-lg font-bold text-emerald-600">Verified!</h1>
              <p className="mt-2 text-sm text-slate-500">Redirecting to dashboard...</p>
            </>
          ) : (
            <>
              <h1 className="text-lg font-bold text-slate-900">Verifying...</h1>
              <p className="mt-2 text-sm text-slate-500">Please wait while we complete the process.</p>
              <div className="mt-4 flex justify-center">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            </>
          )}
        </div>
      </div>
  )
}
