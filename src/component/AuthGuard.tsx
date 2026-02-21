"use client";

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { RoutePath } from '@/constants/routes';
import Loader from '@/component/ui/Loader';

interface AuthGuardProps {
  children: ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
}

const AuthGuard = ({
  children,
  redirectTo = RoutePath.AUTH,
  requireAuth = true
}: AuthGuardProps) => {
  const router = useRouter();
  const { user, isLoading } = useAppSelector((state) => state.auth);

  const isAuthenticated = !!user;

  useEffect(() => {
    if (!isLoading && requireAuth && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isLoading, requireAuth, isAuthenticated, router, redirectTo]);

  useEffect(() => {
    if (!isLoading && !requireAuth && isAuthenticated) {
      router.push(RoutePath.DASHBOARD);
    }
  }, [isLoading, requireAuth, isAuthenticated, router]);

  if (isLoading) {
    return (
     <Loader/>
    );
  }

  if ((requireAuth && !isAuthenticated) || (!requireAuth && isAuthenticated)) {
    return null;
  }

  return <>{children}</>;
};

export default AuthGuard;
