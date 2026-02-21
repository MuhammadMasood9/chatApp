import { FEATURES } from "@/constants/features";
import FeatureCard from "@/component/home/Card";

const FeatureGrid = () => (
  <div className="grid gap-5 md:grid-cols-3">
    {FEATURES.map((feature) => (
      <FeatureCard key={feature.title} {...feature} />
    ))}
  </div>
);

export default FeatureGrid;