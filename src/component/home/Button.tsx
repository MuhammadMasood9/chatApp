import { CTAButtonProps } from "@/utils/home.types";


const Button = ({ label, onClick, variant = "primary", icon }: CTAButtonProps) => {
  const isPrimary = variant === "primary";

  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl text-base font-semibold
        transition-all duration-150 hover:-translate-y-0.5 hover:scale-[1.03] active:scale-100
        ${
          isPrimary
            ? "bg-[#1a1a2e] text-white shadow-[0_4px_18px_rgba(26,35,60,0.22)] hover:shadow-[0_8px_28px_rgba(26,35,60,0.28)]"
            : "border border-[rgba(100,140,180,0.35)] text-[#1a2340] hover:shadow-[0_6px_18px_rgba(100,160,210,0.22)] shadow-[0_2px_10px_rgba(100,160,210,0.12)]"
        }
      `}
      style={
        !isPrimary
          ? { background: "rgba(255,255,255,0.55)", backdropFilter: "blur(10px)" }
          : undefined
      }
    >
      {label}
      {icon}
    </button>
  );
};

export default Button;