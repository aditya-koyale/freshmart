'use client';

import { useState, type FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { registerSchema } from '@/lib/validation/auth';
import { apiRequest, ApiRequestError } from '@/lib/api-client';

type FieldErrors = Partial<Record<'fullName' | 'email' | 'mobileNumber' | 'password' | 'confirmPassword', string>>;

export function RegisterForm() {
  const router = useRouter();
  const [values, setValues] = useState({
    fullName: '',
    email: '',
    mobileNumber: '',
    password: '',
    confirmPassword: '',
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function update<K extends keyof typeof values>(key: K, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const parsed = registerSchema.safeParse(values);
    if (!parsed.success) {
      const errors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FieldErrors;
        if (!errors[key]) errors[key] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest('/api/auth/register', { body: parsed.data });

      // Auto-login immediately after successful registration.
      await signIn('credentials', {
        email: parsed.data.email,
        password: parsed.data.password,
        rememberMe: 'false',
        redirect: false,
      });

      router.push('/');
      router.refresh();
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setFormError(error.message);
      } else {
        setFormError('Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {formError && <Alert variant="error">{formError}</Alert>}

      <Input
        label="Full Name"
        autoComplete="name"
        value={values.fullName}
        onChange={(e) => update('fullName', e.target.value)}
        error={fieldErrors.fullName}
        required
      />
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        value={values.email}
        onChange={(e) => update('email', e.target.value)}
        error={fieldErrors.email}
        required
      />
      <Input
        label="Mobile Number"
        type="tel"
        autoComplete="tel"
        placeholder="10-digit mobile number"
        value={values.mobileNumber}
        onChange={(e) => update('mobileNumber', e.target.value)}
        error={fieldErrors.mobileNumber}
        required
      />
      <Input
        label="Password"
        type="password"
        autoComplete="new-password"
        helperText="At least 8 characters, with a letter and a number"
        value={values.password}
        onChange={(e) => update('password', e.target.value)}
        error={fieldErrors.password}
        required
      />
      <Input
        label="Confirm Password"
        type="password"
        autoComplete="new-password"
        value={values.confirmPassword}
        onChange={(e) => update('confirmPassword', e.target.value)}
        error={fieldErrors.confirmPassword}
        required
      />

      <Button type="submit" isLoading={isSubmitting} fullWidth>
        Create Account
      </Button>

      <p className="text-center text-sm text-ink-muted">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
