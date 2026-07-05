'use client';

import { useState, type FormEvent } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { updateProfileSchema } from '@/lib/validation/auth';
import { apiRequest, ApiRequestError } from '@/lib/api-client';

export interface ProfileFormData {
  fullName: string;
  email: string;
  mobileNumber: string;
}

export function ProfileForm({ initialProfile }: { initialProfile: ProfileFormData }) {
  const [fullName, setFullName] = useState(initialProfile.fullName);
  const [mobileNumber, setMobileNumber] = useState(initialProfile.mobileNumber);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    const parsed = updateProfileSchema.safeParse({ fullName, mobileNumber });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Please check your details');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest('/api/profile', { method: 'PATCH', body: parsed.data });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">Profile updated successfully.</Alert>}

      <Input
        label="Email"
        value={initialProfile.email}
        disabled
        helperText="Email cannot be changed in this version."
      />
      <Input
        label="Full Name"
        autoComplete="name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        required
      />
      <Input
        label="Mobile Number"
        type="tel"
        autoComplete="tel"
        value={mobileNumber}
        onChange={(e) => setMobileNumber(e.target.value)}
        required
      />

      <Button type="submit" isLoading={isSubmitting} className="self-start">
        Save Changes
      </Button>
    </form>
  );
}
