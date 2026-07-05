'use client';

import { useState, type FormEvent } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { changePasswordSchema } from '@/lib/validation/auth';
import { apiRequest, ApiRequestError } from '@/lib/api-client';

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    const parsed = changePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmNewPassword,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Please check your details');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest('/api/profile/change-password', { body: parsed.data });
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">Password changed successfully.</Alert>}

      <Input
        label="Current Password"
        type="password"
        autoComplete="current-password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        required
      />
      <Input
        label="New Password"
        type="password"
        autoComplete="new-password"
        helperText="At least 8 characters, with a letter and a number"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        required
      />
      <Input
        label="Confirm New Password"
        type="password"
        autoComplete="new-password"
        value={confirmNewPassword}
        onChange={(e) => setConfirmNewPassword(e.target.value)}
        required
      />

      <Button type="submit" isLoading={isSubmitting} className="self-start">
        Change Password
      </Button>
    </form>
  );
}
