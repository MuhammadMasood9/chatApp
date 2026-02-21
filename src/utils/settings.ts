import { ReactNode } from 'react';

export interface SettingsNav {
  id: string;
  label: string;
  icon: React.ComponentType<React.SVGAttributes<SVGSVGElement>>;
}

export interface FormField {
  field: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'textarea';
  icon: React.ComponentType<React.SVGAttributes<SVGSVGElement>>;
  placeholder: string;
  readOnly?: boolean;
}

export interface AccountInfo {
  label: string;
  value: string | ReactNode;
}
