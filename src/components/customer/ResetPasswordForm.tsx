'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { resetPasswordSchema } from '@/lib/validation/auth';
import { apiRequest, ApiRequestError } from '@/lib/api-client';

export function ResetPasswordForm({ token }: { token: string | null }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!token) {
    return (
      <Alert variant="error">
        This reset link is missing its token. Please request a new one from the{' '}
        <Link href="/forgot-password" className="font-medium underline">
          forgot password
        </Link>{' '}
        page.
      </Alert>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsed = resetPasswordSchema.safeParse({ token, password, confirmPassword });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Please check your details');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest('/api/auth/reset-password', { body: parsed.data });
      router.push('/login');
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <Alert variant="error">{error}</Alert>}

      <Input
        label="New Password"
        type="password"
        autoComplete="new-password"
        helperText="At least 8 characters, with a letter and a number"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <Input
        label="Confirm New Password"
        type="password"
        autoComplete="new-password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
      />

      <Button type="submit" isLoading={isSubmitting} fullWidth>
        Reset Password
      </Button>
    </form>
  );
}
