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

  if (isLoading) {
    return (
     <Loader/>
    );
  }

  useEffect(() => {
    if (requireAuth && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [requireAuth, isAuthenticated, router, redirectTo]);

  useEffect(() => {
    if (!requireAuth && isAuthenticated) {
      router.push(RoutePath.DASHBOARD);
    }
  }, [requireAuth, isAuthenticated, router]);

  if ((requireAuth && !isAuthenticated) || (!requireAuth && isAuthenticated)) {
    return null;
  }

  return <>{children}</>;
};

export default AuthGuard;
