import { FiMessageSquare, FiUsers, FiShield } from "react-icons/fi";
import { Feature } from "@/utils/home.types";

export enum FeatureKey {
  Messaging = 'messaging',
  Contacts = 'contacts',
  Security = 'security',
}

export const FEATURE_META: Record<FeatureKey, Feature> = {
  [FeatureKey.Messaging]: {
    icon: FiMessageSquare,
    title: "Real-time Messaging",
    description:
      "Instant message delivery with read receipts and typing indicators for smooth conversations.",
  },
  [FeatureKey.Contacts]: {
    icon: FiUsers,
    title: "Connect with Friends",
    description:
      "Build your network, add contacts, and stay connected with people who matter.",
  },
  [FeatureKey.Security]: {
    icon: FiShield,
    title: "Secure & Private",
    description:
      "End-to-end encryption and privacy controls keep your conversations safe and secure.",
  },
};

export const FEATURES: Feature[] = [
  FEATURE_META[FeatureKey.Messaging],
  FEATURE_META[FeatureKey.Contacts],
  FEATURE_META[FeatureKey.Security],
];