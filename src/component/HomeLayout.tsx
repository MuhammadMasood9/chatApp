"use client";

import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { RoutePath } from "@/constants/routes";
import { useEffect } from "react";
import Background from "@/component/home/Background";
import LogoMark from "@/component/home/Logomark";
import Hero from "@/component/home/Hero";
import CTARow from "@/component/home/CtaRow";
import FeatureGrid from "@/component/home/FeatureGrid";

const HomeLayout = () => {
  const { user } = useAppSelector((state) => state.auth);
  const router = useRouter();

  useEffect(() => {
    if (user) router.push(RoutePath.DASHBOARD);
  }, [user, router]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Background />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-10">
        <div className="w-full max-w-4xl">
          <div className="text-center">
            <LogoMark />
            <Hero />
            <CTARow
              onGetStarted={() => router.push(RoutePath.AUTH)}
              onSignIn={() => router.push(RoutePath.AUTH)}
            />
          </div>

          <FeatureGrid />
        </div>
      </div>
    </div>
  );
};

export default HomeLayout;