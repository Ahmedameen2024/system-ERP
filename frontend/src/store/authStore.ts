import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/client';

export interface UserProfile {
  id: string;
  username: string;
  nameAr: string;
  nameEn: string;
  email: string;
  language: string;
  roleId: string;
  roleNameAr: string;
  roleNameEn: string;
  companyId: string;
  companyNameAr: string;
  branchId: string;
  permissions?: Array<{
    module_name: string;
    screen_name: string;
    can_view: boolean;
    can_create: boolean;
    can_edit: boolean;
    can_delete: boolean;
    can_approve: boolean;
    can_print: boolean;
    can_export: boolean;
  }>;
}

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (module: string, screen: string, action: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      login: async (username: string, password: string) => {
        const response = await api.post('/auth/login', { username, password });
        const { token, refreshToken, user } = response.data.data;
        localStorage.setItem('erp_token', token);
        localStorage.setItem('erp_refresh', refreshToken);

        // Fetch full profile with permissions
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const profileRes = await api.get('/auth/profile');

        set({
          token,
          user: { ...user, permissions: profileRes.data.data.permissions },
          isAuthenticated: true,
        });
      },

      logout: () => {
        api.post('/auth/logout').catch(() => { });
        localStorage.removeItem('erp_token');
        localStorage.removeItem('erp_refresh');
        set({ token: null, user: null, isAuthenticated: false });
      },

      hasPermission: (module: string, screen: string, action: string): boolean => {
        const { user } = get();
        if (!user?.permissions) return false;
        const perm = user.permissions.find(
          (p) => p.module_name === module && p.screen_name === screen
        );
        if (!perm) return false;
        return perm[`can_${action}` as keyof typeof perm] as boolean;
      },
    }),
    {
      name: 'erp_auth',
      partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
