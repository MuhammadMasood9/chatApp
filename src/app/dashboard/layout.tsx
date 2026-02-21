import AuthGuard from '@/component/AuthGuard';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard requireAuth={true}>{children}</AuthGuard>;
}
