import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { paths } from '@/routes/paths';
import { getApiErrorMessage } from '@/services/api';

import {
  forgotPassword,
  login,
  logout,
  register,
  resendVerification,
  resetPassword,
  updateProfile,
  verifyEmail,
} from '../api/authApi';
import { useAuthStore } from '../store/authStore';
import type {
  ForgotPasswordPayload,
  LoginCredentials,
  ProfileUpdatePayload,
  RegisterPayload,
  ResetPasswordPayload,
} from '../types';

export function useAuth() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, accessToken, refreshToken, setAuth, clearAuth } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => login(credentials),
    onSuccess: (data) => {
      setAuth(data.access_token, data.refresh_token, data.user);
      navigate(paths.dashboard);
    },
  });

  const registerMutation = useMutation({
    mutationFn: (payload: RegisterPayload) => register(payload),
    onSuccess: (data) => {
      setAuth(data.access_token, data.refresh_token, data.user);
      navigate(paths.dashboard);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      if (refreshToken) {
        await logout(refreshToken);
      }
    },
    onSettled: () => {
      clearAuth();
      queryClient.clear();
      navigate(paths.login);
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: (payload: ForgotPasswordPayload) => forgotPassword(payload),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (payload: ResetPasswordPayload) => resetPassword(payload),
    onSuccess: () => navigate(paths.login),
  });

  const verifyEmailMutation = useMutation({
    mutationFn: (token: string) => verifyEmail(token),
  });

  const resendVerificationMutation = useMutation({
    mutationFn: resendVerification,
  });

  const updateProfileMutation = useMutation({
    mutationFn: (payload: ProfileUpdatePayload) => updateProfile(payload),
    onSuccess: (updatedUser) => {
      if (accessToken && refreshToken) {
        setAuth(accessToken, refreshToken, updatedUser);
      }
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });

  return {
    user,
    isAuthenticated,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
    forgotPassword: forgotPasswordMutation.mutate,
    resetPassword: resetPasswordMutation.mutate,
    verifyEmail: verifyEmailMutation.mutate,
    resendVerification: resendVerificationMutation.mutate,
    updateProfile: updateProfileMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    loginError: loginMutation.error ? getApiErrorMessage(loginMutation.error) : null,
    registerError: registerMutation.error ? getApiErrorMessage(registerMutation.error) : null,
    forgotPasswordError: forgotPasswordMutation.error
      ? getApiErrorMessage(forgotPasswordMutation.error)
      : null,
    resetPasswordError: resetPasswordMutation.error
      ? getApiErrorMessage(resetPasswordMutation.error)
      : null,
    isForgotPasswordSent: forgotPasswordMutation.isSuccess,
    isResetPasswordDone: resetPasswordMutation.isSuccess,
    isVerifyEmailDone: verifyEmailMutation.isSuccess,
    verifyEmailError: verifyEmailMutation.error
      ? getApiErrorMessage(verifyEmailMutation.error)
      : null,
  };
}

export function useProfile() {
  const { accessToken, refreshToken, setAuth } = useAuthStore();

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const { getMe } = await import('../api/authApi');
      return getMe();
    },
    enabled: Boolean(accessToken),
    staleTime: 60_000,
    select: (data) => {
      if (accessToken && refreshToken) {
        setAuth(accessToken, refreshToken, data);
      }
      return data;
    },
  });
}
