
import { IconType } from "react-icons";

export interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

export interface IconBadgeProps {
  icon: IconType;
}

export interface CTAButtonProps {
  label: string;
  onClick: VoidFunction;
  variant?: "primary" | "secondary";
  icon?: React.ReactNode;
}

export interface CTARowProps {
  onGetStarted: VoidFunction;
  onSignIn: VoidFunction;
}

export interface FeatureCardProps {
  icon: IconType;
  title: string;
  description: string;
}

export interface Feature {
  icon: IconType;
  title: string;
  description: string;
}