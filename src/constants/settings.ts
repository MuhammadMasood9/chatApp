import { SettingsNav, FormField } from '@/utils/settings';
import { AuthMode, SettingsTab } from '@/constants/routes';
import { 
  FiUser, FiShield, FiMail 
} from 'react-icons/fi';

export const SETTINGS_NAV_ITEMS: SettingsNav[] = [
  { id: SettingsTab.PROFILE, label: 'Profile', icon: FiUser },
  { id: SettingsTab.ACCOUNT, label: 'Account', icon: FiShield },
];

export const PROFILE_FORM_FIELDS: FormField[] = [
  { field: 'fullName', label: 'Full Name', type: 'text', icon: FiUser, placeholder: 'Enter your full name' },
  { field: 'email', label: 'Email Address', type: 'email', icon: FiMail, placeholder: 'Enter your email', readOnly: true },
];

export const AUTH_MESSAGES = {
  [AuthMode.SIGNIN]: {
    title: 'Sign in with email',
    subtitle: 'Make a new doc to bring your words, data, and teams together. For free.',
    buttonText: 'Get Started',
    footerText: "Don't have an account?",
    footerLink: 'Sign up'
  },
  [AuthMode.SIGNUP]: {
    title: 'Create an account',
    subtitle: 'Start for free. No credit card required.',
    buttonText: 'Create Account',
    footerText: 'Already have an account?',
    footerLink: 'Sign in'
  }
};
