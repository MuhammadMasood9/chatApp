import { IconBadgeProps } from "@/utils/home.types";

const IconBadge = ({ icon: Icon }: IconBadgeProps) => (
  <div
    className="flex items-center justify-center w-14 h-14 rounded-2xl border border-white/90"
    style={{ background: "rgba(255,255,255,0.7)", boxShadow: " 2px 8px rgba(100,160,210,0.2)" }}
  >
    <Icon size={24} className="text-[#1a2340]" />
  </div>
);

export default IconBadge;