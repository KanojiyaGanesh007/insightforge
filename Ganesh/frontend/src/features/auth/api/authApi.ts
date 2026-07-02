import { apiClient } from '@/services/api';

import type {
  AuthResponse,
  ForgotPasswordPayload,
  LoginCredentials,
  ProfileUpdatePayload,
  RegisterPayload,
  ResetPasswordPayload,
  User,
} from '../types';

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', credentials);
  return data;
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/register', payload);
  return data;
}

export async function refreshToken(refreshTokenValue: string): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/refresh', {
    refresh_token: refreshTokenValue,
  });
  return data;
}

export async function logout(refreshTokenValue: string): Promise<void> {
  await apiClient.post('/auth/logout', { refresh_token: refreshTokenValue });
}

export async function forgotPassword(payload: ForgotPasswordPayload): Promise<void> {
  await apiClient.post('/auth/forgot-password', payload);
}

export async function resetPassword(payload: ResetPasswordPayload): Promise<void> {
  await apiClient.post('/auth/reset-password', payload);
}

export async function verifyEmail(token: string): Promise<void> {
  await apiClient.post('/auth/verify-email', { token });
}

export async function resendVerification(): Promise<void> {
  await apiClient.post('/auth/resend-verification');
}

export async function getMe(): Promise<User> {
  const { data } = await apiClient.get<User>('/auth/me');
  return data;
}

export async function updateProfile(payload: ProfileUpdatePayload): Promise<User> {
  const { data } = await apiClient.patch<User>('/auth/me', payload);
  return data;
}
