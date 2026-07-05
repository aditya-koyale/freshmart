import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthCard } from '@/components/customer/AuthCard';
import { LoginForm } from '@/components/customer/LoginForm';

export const metadata: Metadata = { title: 'Log In' };

export default function LoginPage() {
  return (
    <AuthCard title="Welcome back" subtitle="Log in to continue shopping on FreshMart.">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}
