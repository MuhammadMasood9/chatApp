import { GlassCardProps } from "@/utils/home.types";

const GlassCard = ({ children, className = "" }: GlassCardProps) => (
  <div
    className={`rounded-3xl border border-white/75 ${className}`}
    style={{
      background: "rgba(255,255,255,0.45)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      boxShadow: "0 8px 32px rgba(100,160,210,0.18), 0 1.5px 6px rgba(140,190,230,0.12)",
    }}
  >
    {children}
  </div>
);

export default GlassCard;