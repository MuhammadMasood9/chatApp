import { FiMessageSquare } from "react-icons/fi";
import GlassCard from "@/component/home/GlassCard";

const LogoMark = () => (
  <GlassCard className="w-[72px] h-[72px] flex items-center justify-center mx-auto mb-7 !rounded-[22px]">
    <FiMessageSquare size={30} className="text-[#1a2340]" />
  </GlassCard>
);

export default LogoMark;