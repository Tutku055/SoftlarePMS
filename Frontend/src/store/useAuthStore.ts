import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  sub?: string;
  email?: string;
  username?: string;
  roleId?: string;
  permission?: string | string[];
  permissions?: string | string[];
  exp?: number;
  [key: string]: any;
}

interface CurrentUser {
  id: string;
  email: string;
  username: string;
  roleId?: string;
  requiresPasswordChange?: boolean;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  permissions: string[];
  currentUser: CurrentUser | null;
  isAuthenticated: boolean;
  login: (accessToken: string, refreshToken: string, userData?: { username: string, email: string, requiresPasswordChange?: boolean }) => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      permissions: [],
      currentUser: null,
      isAuthenticated: false,

      login: (accessToken: string, refreshToken: string, userData?: { username: string, email: string, requiresPasswordChange?: boolean }) => {
        try {
          const decoded = jwtDecode<DecodedToken>(accessToken);
          
          const rawPermissions = decoded.permission ?? decoded.permissions ?? decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/permission'];
          let parsedPermissions: string[] = [];
          if (rawPermissions) {
            parsedPermissions = Array.isArray(rawPermissions) 
              ? rawPermissions 
              : [rawPermissions];
          }

          const userEmail = userData?.email || decoded.email || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || '';
          const userName = userData?.username || decoded.username || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || (userEmail ? userEmail.split('@')[0] : '') || 'User';

          const isPasswordChangeForced = userData?.requiresPasswordChange ?? (parsedPermissions.includes('Users.ChangePassword') && !parsedPermissions.includes('Dashboard.Read'));

          set({
            accessToken,
            refreshToken,
            permissions: parsedPermissions,
            currentUser: decoded.sub ? { 
              id: decoded.sub, 
              email: userEmail, 
              username: userName, 
              roleId: decoded.roleId,
              requiresPasswordChange: isPasswordChangeForced 
            } : null,
            isAuthenticated: true,
          });
        } catch (error) {
          console.error('Invalid token during login', error);
          set({ accessToken: null, refreshToken: null, permissions: [], currentUser: null, isAuthenticated: false });
        }
      },

      logout: () => {
        set({ accessToken: null, refreshToken: null, permissions: [], currentUser: null, isAuthenticated: false });
      },

      hasPermission: (permission: string) => {
        const state = get();
        let perms = state.permissions;

        if ((!perms || perms.length === 0) && state.accessToken) {
          try {
            const decoded = jwtDecode<DecodedToken>(state.accessToken);
            const rawPerms = decoded.permission ?? decoded.permissions ?? decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/permission'];
            if (rawPerms) {
              perms = Array.isArray(rawPerms) ? rawPerms : [rawPerms];
            }
          } catch {
            // ignore
          }
        }

        return perms ? perms.includes(permission) : false;
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
