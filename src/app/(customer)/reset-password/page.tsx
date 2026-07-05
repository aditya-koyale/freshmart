import type { Metadata } from 'next';
import { AuthCard } from '@/components/customer/AuthCard';
import { ResetPasswordForm } from '@/components/customer/ResetPasswordForm';

export const metadata: Metadata = { title: 'Reset Password' };

interface ResetPasswordPageProps {
  searchParams: { token?: string };
}

export default function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  return (
    <AuthCard title="Choose a new password" subtitle="Make it something you'll remember.">
      <ResetPasswordForm token={searchParams.token ?? null} />
    </AuthCard>
  );
}
