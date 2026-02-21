interface FormFieldProps {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  readOnly?: boolean;
  required?: boolean;
  className?: string;
}

export const FormField = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  icon,
  readOnly = false,
  required = false,
  className = '',
}: FormFieldProps) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {label}
      </label>
      {readOnly ? (
        <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl text-sm text-slate-700 border border-slate-100 opacity-70">
          {icon && <div className="w-4 h-4 text-slate-400 flex-shrink-0">{icon}</div>}
          {value || <span className="text-slate-400">Not set</span>}
        </div>
      ) : (
        <div className="relative">
          {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400">{icon}</div>}
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
          />
        </div>
      )}
    </div>
  );
};
