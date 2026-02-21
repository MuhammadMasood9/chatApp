
export enum RouteName {
  ROOT = 'root',
  AUTH = 'auth',
  DASHBOARD = 'dashboard',
  SETTINGS = 'settings',
  ROOMS = 'rooms',
  CONTACTS = 'contacts',
  PROFILE = 'profile',
  CALLS = 'calls',
}

export enum RoutePath {
  AUTH = '/auth',
  AUTH_CALLBACK = '/auth/callback',
  AUTH_FORGOT_PASSWORD = '/auth/forgot-password',
  AUTH_RESET_PASSWORD = '/auth/reset-password',
  DASHBOARD = '/dashboard',
  SETTING = '/setting',
  ROOMS = '/rooms',
  CONTACTS = '/contacts',
  PROFILE = '/profile',
  CALLS = '/calls',
  ROOT = '/',
}

export enum AuthMode {
  SIGNIN = 'signin',
  SIGNUP = 'signup',
}

export enum SettingsTab {
  PROFILE = 'profile',
  ACCOUNT = 'account',
}
export const ROUTES = {
  [RouteName.AUTH]: RoutePath.AUTH,
  [RouteName.DASHBOARD]: RoutePath.DASHBOARD,
  [RouteName.SETTINGS]: RoutePath.SETTING,
  [RouteName.ROOMS]: RoutePath.ROOMS,
  [RouteName.CONTACTS]: RoutePath.CONTACTS,
  [RouteName.PROFILE]: RoutePath.PROFILE,
  [RouteName.CALLS]: RoutePath.CALLS,
  [RouteName.ROOT]: RoutePath.ROOT,
} as const;

export const getRoutePath = (routeName: RouteName): string => {
  return ROUTES[routeName];
};

export const isAuthRoute = (pathname: string): boolean => {
  return pathname.startsWith(RoutePath.AUTH);
};

export const isProtectedRoute = (pathname: string): boolean => {
  return !isAuthRoute(pathname) && pathname !== RoutePath.ROOT;
};
