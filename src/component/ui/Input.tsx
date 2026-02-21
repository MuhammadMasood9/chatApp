interface InputProps {
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

export const Input = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  icon,
  className = '',
  disabled = false,
  required = false,
}: InputProps) => {
  const baseClassName = "w-full rounded-lg border border-gray-200 bg-white/80 py-2.5 pl-9 pr-4 text-sm text-gray-700 outline-none transition placeholder:text-gray-300 focus:border-sky-300 focus:ring-2 focus:ring-sky-100";

  return (
    <div className="relative">
      {icon && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-350">
          {icon}
        </span>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${baseClassName} ${icon ? 'pl-9' : 'pl-4'} ${className}`}
        disabled={disabled}
        required={required}
      />
    </div>
  );
};
