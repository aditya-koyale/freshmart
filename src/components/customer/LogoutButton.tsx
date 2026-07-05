'use client';

import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/Button';

export function LogoutButton() {
  return (
    <Button variant="outline" onClick={() => signOut({ callbackUrl: '/' })}>
      Log Out
    </Button>
  );
}
