import AuthGuard from "@/component/AuthGuard";
import HomeLayout from "@/component/HomeLayout";

export default function Home() {

  return (
    <AuthGuard requireAuth={false}>
      <HomeLayout/>
    </AuthGuard>
  );
}
