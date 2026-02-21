import { useRouter } from 'next/navigation';
import { MdOutlineMail } from 'react-icons/md';
import { RiLockPasswordLine, RiUserLine, RiLockLine } from 'react-icons/ri';
import { AuthMode, AuthFormData } from '@/utils/types';
import { RoutePath } from '@/constants/routes';
import { Input } from '@/component/ui/Input';

interface AuthFormProps {
  mode: AuthMode;
  formData: AuthFormData;
  onChange: (field: keyof AuthFormData, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  error?: string;
}

export const AuthForm = ({
  mode,
  formData,
  onChange,
  onSubmit,
  isLoading,
  error
}: AuthFormProps) => {
  const router = useRouter();

  return (
    <form className="flex flex-col gap-3" onSubmit={onSubmit}>
      {mode === 'signup' && (
        <Input
          type="text"
          value={formData.fullName}
          onChange={(value) => onChange('fullName', value)}
          placeholder="Full name"
          icon={<RiUserLine />}
        />
      )}

      <Input
        type="email"
        value={formData.email}
        onChange={(value) => onChange('email', value)}
        placeholder="Email"
        required
        icon={<MdOutlineMail />}
      />

      <Input
        type="password"
        value={formData.password}
        onChange={(value) => onChange('password', value)}
        placeholder="Password"
        required
        icon={<RiLockPasswordLine />}
      />

      {mode === 'signup' && (
        <Input
          type="password"
          value={formData.confirmPassword}
          onChange={(value) => onChange('confirmPassword', value)}
          placeholder="Confirm password"
          required
          icon={<RiLockLine />}
        />
      )}

      {mode === 'signin' && (
        <button
          type="button"
          onClick={() => router.push(RoutePath.AUTH_FORGOT_PASSWORD)}
          className="text-right text-[0.72rem] text-gray-400 transition hover:text-sky-500"
        >
          Forgot password?
        </button>
      )}

      {error && (
        <p className="text-center text-sm text-red-500">{error}</p>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="mt-1 w-full rounded-lg py-2.5 text-sm font-semibold text-white transition active:scale-[0.98]"
        style={{
          background: "linear-gradient(135deg, #1a1a2e 0%, #2d2d44 100%)",
          boxShadow: "0 2px 8px rgba(30,30,60,0.18)",
        }}
      >
        {isLoading ? "Please wait..." : (mode === 'signin' ? "Get Started" : "Create Account")}
      </button>
    </form>
  );
};
