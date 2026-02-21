interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circle' | 'rectangle';
  width?: string;
  height?: string;
}

export const Skeleton = ({
  className = '',
  variant = 'rectangle',
  width,
  height,
}: SkeletonProps) => {
  const baseClass = 'animate-pulse bg-slate-200';

  const variantClasses = {
    text: 'h-4 rounded',
    circle: 'rounded-full',
    rectangle: 'rounded',
  };

  const style = {
    width: width || (variant === 'text' ? '100%' : undefined),
    height: height || (variant === 'text' ? '1rem' : variant === 'circle' ? '2.5rem' : '2.5rem'),
  };

  return (
    <div
      className={`${baseClass} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
};
