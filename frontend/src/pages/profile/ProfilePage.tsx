import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  changePasswordSchema, profileSchema, type ChangePasswordFormValues, type ProfileFormValues,
} from '@/utils/validationSchemas';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/authService';
import { getApiErrorMessage } from '@/utils/apiError';
import ErrorBanner from '@/components/common/ErrorBanner';
import PasswordInput from '@/components/common/PasswordInput';

export default function ProfilePage() {
  const { user, refreshProfile } = useAuth();
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const profileForm = useForm<ProfileFormValues>({ resolver: zodResolver(profileSchema) });
  const passwordForm = useForm<ChangePasswordFormValues>({ resolver: zodResolver(changePasswordSchema) });

  useEffect(() => {
    if (user) {
      profileForm.reset({ fullName: user.fullName, phoneNumber: user.phoneNumber || '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const onProfileSubmit = async (values: ProfileFormValues) => {
    setProfileMessage(null);
    try {
      await authService.updateMyProfile({ ...values, phoneNumber: values.phoneNumber || undefined });
      await refreshProfile();
      setProfileMessage({ type: 'success', text: 'Profile updated successfully.' });
    } catch (error) {
      setProfileMessage({ type: 'error', text: getApiErrorMessage(error) });
    }
  };

  const onPasswordSubmit = async (values: ChangePasswordFormValues) => {
    setPasswordMessage(null);
    try {
      await authService.changePassword(values);
      setPasswordMessage({ type: 'success', text: 'Password changed successfully.' });
      passwordForm.reset();
    } catch (error) {
      setPasswordMessage({ type: 'error', text: getApiErrorMessage(error) });
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="motion-safe:animate-slide-up">
        <h1 className="text-xl font-semibold text-ocean-900 dark:text-white">My Profile</h1>
        <p className="text-sm text-ocean-500 dark:text-ocean-400">Manage your account details and password.</p>
      </div>

      <div className="card p-6 motion-safe:animate-slide-up" style={{ animationDelay: '80ms' }}>
        <h2 className="mb-4 text-sm font-semibold text-ocean-800 dark:text-ocean-100">Account Information</h2>
        <dl className="mb-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-ocean-500 dark:text-ocean-400">Username</dt>
            <dd className="font-medium text-ocean-900 dark:text-white">{user?.username}</dd>
          </div>
          <div>
            <dt className="text-ocean-500 dark:text-ocean-400">Email</dt>
            <dd className="font-medium text-ocean-900 dark:text-white">{user?.email}</dd>
          </div>
          <div>
            <dt className="text-ocean-500 dark:text-ocean-400">Role</dt>
            <dd className="font-medium text-ocean-900 dark:text-white">{user?.role}</dd>
          </div>
        </dl>

        <ErrorBanner message={profileMessage?.type === 'error' ? profileMessage.text : null} />
        {profileMessage?.type === 'success' && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {profileMessage.text}
          </div>
        )}

        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4" noValidate>
          <div>
            <label className="label" htmlFor="fullName">Full Name</label>
            <input id="fullName" className="input" {...profileForm.register('fullName')} />
            {profileForm.formState.errors.fullName && (
              <p className="field-error">{profileForm.formState.errors.fullName.message}</p>
            )}
          </div>
          <div>
            <label className="label" htmlFor="phoneNumber">Phone Number</label>
            <input id="phoneNumber" className="input" {...profileForm.register('phoneNumber')} />
            {profileForm.formState.errors.phoneNumber && (
              <p className="field-error">{profileForm.formState.errors.phoneNumber.message}</p>
            )}
          </div>
          <button type="submit" className="btn-primary" disabled={profileForm.formState.isSubmitting}>
            Save Changes
          </button>
        </form>
      </div>

      <div className="card p-6 motion-safe:animate-slide-up" style={{ animationDelay: '140ms' }}>
        <h2 className="mb-4 text-sm font-semibold text-ocean-800 dark:text-ocean-100">Change Password</h2>
        <ErrorBanner message={passwordMessage?.type === 'error' ? passwordMessage.text : null} />
        {passwordMessage?.type === 'success' && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {passwordMessage.text}
          </div>
        )}
        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4" noValidate>
          <div>
            <label className="label" htmlFor="currentPassword">Current Password</label>
            <PasswordInput
              id="currentPassword"
              error={Boolean(passwordForm.formState.errors.currentPassword)}
              {...passwordForm.register('currentPassword')}
            />
            {passwordForm.formState.errors.currentPassword && (
              <p className="field-error">{passwordForm.formState.errors.currentPassword.message}</p>
            )}
          </div>
          <div>
            <label className="label" htmlFor="newPassword">New Password</label>
            <PasswordInput
              id="newPassword"
              error={Boolean(passwordForm.formState.errors.newPassword)}
              {...passwordForm.register('newPassword')}
            />
            {passwordForm.formState.errors.newPassword && (
              <p className="field-error">{passwordForm.formState.errors.newPassword.message}</p>
            )}
          </div>
          <button type="submit" className="btn-primary" disabled={passwordForm.formState.isSubmitting}>
            Change Password
          </button>
        </form>
      </div>
    </div>
  );
}
