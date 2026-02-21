import { FeatureCardProps } from "@/utils/home.types";
import GlassCard from "@/component/home/GlassCard";
import IconBadge from "@/component/home/Iconbadge";

const Card = ({ icon, title, description }: FeatureCardProps) => (
  <GlassCard className="p-8 text-center">
    <div className="flex justify-center mb-5">
      <IconBadge icon={icon} />
    </div>
    <h3 className="text-base font-bold text-[#1a2340] mb-2.5">{title}</h3>
    <p className="text-sm text-[#4a6080] leading-relaxed">{description}</p>
  </GlassCard>
);

export default Card;