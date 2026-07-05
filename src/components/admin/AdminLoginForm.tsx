'use client';

import { useState, type FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { loginSchema } from '@/lib/validation/auth';

/**
 * Admin login is intentionally not linked from the customer site (SRS
 * Part 4 §2). It uses the same NextAuth credentials provider — role
 * enforcement is done by the middleware, not this form. A CUSTOMER who
 * finds and submits this form will just be bounced back to /admin/login
 * by the middleware.
 */
export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsed = loginSchema.safeParse({ email, password, rememberMe: false });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Please check your details');
      return;
    }

    setIsSubmitting(true);
    const result = await signIn('credentials', {
      email: parsed.data.email,
      password: parsed.data.password,
      rememberMe: 'false',
      redirect: false,
    });
    setIsSubmitting(false);

    if (result?.error) {
      setError('Incorrect email or password.');
      return;
    }

    // Session refresh + hard navigation to the dashboard
    router.push('/admin');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <Alert variant="error">{error}</Alert>}

      <Input
        label="Email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        label="Password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <Button type="submit" isLoading={isSubmitting} fullWidth>
        Sign In
      </Button>
    </form>
  );
}
