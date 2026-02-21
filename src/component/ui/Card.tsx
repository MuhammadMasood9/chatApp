interface CardProps {
  children: React.ReactNode;
  className?: string;
  shadow?: boolean;
  rounded?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = ({
  children,
  className = '',
  shadow = true,
  rounded = true,
  padding = 'md',
}: CardProps) => {
  const baseClassName = "bg-white border border-gray-200";

  const shadowClass = shadow ? "shadow-sm" : "";
  const roundedClass = rounded ? "rounded-xl" : "";
  const paddingClass = {
    none: "",
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
  }[padding];

  return (
    <div className={`${baseClassName} ${shadowClass} ${roundedClass} ${paddingClass} ${className}`}>
      {children}
    </div>
  );
};
