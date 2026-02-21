import { FiArrowRight, FiLogIn } from "react-icons/fi";
import CTAButton from "@/component/home/Button";
import { CTARowProps } from "@/utils/home.types";

const ButtonRow = ({ onGetStarted, onSignIn }: CTARowProps) => (
  <div className="flex flex-wrap gap-3 justify-center mb-16">
    <CTAButton
      label="Get Started"
      onClick={onGetStarted}
      variant="primary"
      icon={<FiArrowRight size={18} />}
    />
    <CTAButton
      label="Sign In"
      onClick={onSignIn}
      variant="secondary"
      icon={<FiLogIn size={16} />}
    />
  </div>
);

export default ButtonRow;