import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

/**
 * Email verification is intentionally skipped for Version 1 (SRS decision:
 * "Email Verification" §1). To keep Version 2 (OTP / email verification)
 * a non-breaking addition:
 *  - `User.emailVerifiedAt` already exists in the schema (nullable).
 *  - `authorize()` below has a single, clearly marked spot where a
 *    verification check can be inserted later without restructuring the
 *    provider or session callbacks.
 */
export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    // Outer ceiling for the session cookie itself. The *actual* session
    // length (24h default, 7 days with Remember Me) is enforced by the
    // token's own `exp` claim, set explicitly in the jwt() callback below —
    // NextAuth/jose validates that embedded exp on every request
    // independent of the cookie's lifetime, so a non-remembered session
    // stops being valid after 24h even though the cookie could live longer.
    maxAge: 7 * 24 * 60 * 60,
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        rememberMe: { label: 'Remember me', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!user || !user.isActive) {
          return null;
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.passwordHash,
        );

        if (!isValidPassword) {
          return null;
        }

        // ── Version 2 hook point ──────────────────────────────────────
        // if (!user.emailVerifiedAt) throw new Error('EMAIL_NOT_VERIFIED');
        // ──────────────────────────────────────────────────────────────

        await db.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          name: user.fullName,
          email: user.email,
          role: user.role,
          rememberMe: credentials.rememberMe === 'true',
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: string }).role;
        token.id = user.id;

        const rememberMe = (user as { rememberMe?: boolean }).rememberMe ?? false;
        const ttlSeconds = rememberMe ? 7 * 24 * 60 * 60 : 24 * 60 * 60;
        token.exp = Math.floor(Date.now() / 1000) + ttlSeconds;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as 'CUSTOMER' | 'ADMIN';
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
