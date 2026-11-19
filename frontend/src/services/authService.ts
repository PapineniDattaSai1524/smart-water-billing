import axiosClient from '@/api/axiosClient';
import type {
  ApiResponse, JwtResponse, Role, UserProfile,
} from '@/utils/types';

export interface RegisterPayload {
  fullName: string;
  email: string;
  username: string;
  password: string;
  phoneNumber?: string;
  role: 'ADMIN' | 'RESIDENT';
  /** Required only when role is 'RESIDENT'. Must match a real, unclaimed household's
   *  globally unique Household ID -- validated authoritatively server-side on submit. */
  householdId?: string;
}

export type HouseholdLookupStatus = 'AVAILABLE' | 'ALREADY_REGISTERED' | 'NOT_FOUND';

export interface HouseholdLookupResult {
  status: HouseholdLookupStatus;
  apartmentName?: string | null;
  unitNumber?: string | null;
}

export interface LoginPayload {
  usernameOrEmail: string;
  password: string;
}

export interface UpdateProfilePayload {
  fullName: string;
  phoneNumber?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordPayload {
  usernameOrEmail: string;
  role: Role;
}

export interface ForgotPasswordResult {
  message: string;
  /** Local-dev-only fallback link, only ever populated when SMTP isn't configured outside prod. */
  devResetLink?: string | null;
}

export interface ValidateResetTokenResult {
  valid: boolean;
  role?: Role | null;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export const authService = {
  register: (payload: RegisterPayload) =>
    axiosClient.post<ApiResponse<UserProfile>>('/auth/register', payload).then((r) => r.data),

  /** Debounced, non-authoritative "checking availability..." lookup used while the resident
   *  is still typing their Household ID on the registration form. POST /auth/register always
   *  re-validates the Household ID itself, server-side, on submit -- this is a UX convenience
   *  only. */
  checkHouseholdId: (householdId: string) =>
    axiosClient.get<ApiResponse<HouseholdLookupResult>>('/auth/household-lookup', { params: { householdId } })
      .then((r) => r.data),

  login: (payload: LoginPayload) =>
    axiosClient.post<ApiResponse<JwtResponse>>('/auth/login', payload).then((r) => r.data),

  refresh: (refreshToken: string) =>
    axiosClient.post<ApiResponse<JwtResponse>>('/auth/refresh', { refreshToken }).then((r) => r.data),

  getMyProfile: () =>
    axiosClient.get<ApiResponse<UserProfile>>('/profile').then((r) => r.data),

  updateMyProfile: (payload: UpdateProfilePayload) =>
    axiosClient.put<ApiResponse<UserProfile>>('/profile', payload).then((r) => r.data),

  changePassword: (payload: ChangePasswordPayload) =>
    axiosClient.put<ApiResponse<void>>('/profile/password', payload).then((r) => r.data),

  forgotPassword: (payload: ForgotPasswordPayload) =>
    axiosClient.post<ApiResponse<ForgotPasswordResult>>('/auth/forgot-password', payload).then((r) => r.data),

  validateResetToken: (token: string) =>
    axiosClient.get<ApiResponse<ValidateResetTokenResult>>('/auth/reset-password/validate', { params: { token } })
      .then((r) => r.data),

  resetPassword: (payload: ResetPasswordPayload) =>
    axiosClient.post<ApiResponse<void>>('/auth/reset-password', payload).then((r) => r.data),
};
