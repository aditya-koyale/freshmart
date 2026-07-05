import type { Metadata } from 'next';
import { AuthCard } from '@/components/customer/AuthCard';
import { RegisterForm } from '@/components/customer/RegisterForm';

export const metadata: Metadata = { title: 'Create Account' };

export default function RegisterPage() {
  return (
    <AuthCard title="Create your account" subtitle="Join FreshMart for fresh fruit, delivered.">
      <RegisterForm />
    </AuthCard>
  );
}
