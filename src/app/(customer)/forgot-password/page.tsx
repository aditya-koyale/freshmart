import type { Metadata } from 'next';
import { AuthCard } from '@/components/customer/AuthCard';
import { ForgotPasswordForm } from '@/components/customer/ForgotPasswordForm';

export const metadata: Metadata = { title: 'Forgot Password' };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a reset link."
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
