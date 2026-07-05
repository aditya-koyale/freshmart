'use client';

import { useState, type FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { loginSchema } from '@/lib/validation/auth';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsed = loginSchema.safeParse({ email, password, rememberMe });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Please check your details');
      return;
    }

    setIsSubmitting(true);
    const result = await signIn('credentials', {
      email: parsed.data.email,
      password: parsed.data.password,
      rememberMe: String(parsed.data.rememberMe),
      redirect: false,
    });
    setIsSubmitting(false);

    if (result?.error) {
      setError('Incorrect email or password.');
      return;
    }

    router.push(redirectTo);
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

      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 text-ink-muted">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary/40"
          />
          Remember me
        </label>
        <Link href="/forgot-password" className="font-medium text-primary hover:underline">
          Forgot password?
        </Link>
      </div>

      <Button type="submit" isLoading={isSubmitting} fullWidth>
        Log In
      </Button>

      <p className="text-center text-sm text-ink-muted">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}
