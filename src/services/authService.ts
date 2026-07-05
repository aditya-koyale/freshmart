import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { AppError, ConflictError, NotFoundError } from '@/lib/api-response';
import { emailService, buildPasswordResetEmail } from '@/lib/email';
import type {
  RegisterInput,
  ResetPasswordInput,
  UpdateProfileInput,
  ChangePasswordInput,
} from '@/lib/validation/auth';

const RESET_TOKEN_TTL_MINUTES = 30;
const BCRYPT_ROUNDS = 12;

function toSafeUser<T extends { passwordHash: string }>(user: T) {
  const { passwordHash, ...safe } = user;
  return safe;
}

export async function registerCustomer(input: RegisterInput) {
  const [emailTaken, mobileTaken] = await Promise.all([
    db.user.findUnique({ where: { email: input.email } }),
    db.user.findUnique({ where: { mobileNumber: input.mobileNumber } }),
  ]);

  if (emailTaken) {
    throw new ConflictError('An account with this email already exists');
  }
  if (mobileTaken) {
    throw new ConflictError('An account with this mobile number already exists');
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  const user = await db.user.create({
    data: {
      fullName: input.fullName,
      email: input.email,
      mobileNumber: input.mobileNumber,
      passwordHash,
      role: 'CUSTOMER',
    },
  });

  return toSafeUser(user);
}

/**
 * Always responds as if successful, whether or not the email exists —
 * revealing which emails are registered is a (minor but free-to-avoid)
 * information leak. The actual email is only sent when a matching,
 * active user is found.
 */
export async function requestPasswordReset(email: string, baseUrl: string) {
  const user = await db.user.findUnique({ where: { email } });

  if (!user || !user.isActive) {
    return;
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  await db.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000),
    },
  });

  const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`;

  await emailService.send({
    to: user.email,
    subject: 'Reset your FreshMart password',
    html: buildPasswordResetEmail(resetUrl),
  });
}

export async function resetPassword(input: ResetPasswordInput) {
  const tokenHash = crypto.createHash('sha256').update(input.token).digest('hex');

  const resetToken = await db.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    throw new AppError(
      'This reset link is invalid or has expired. Please request a new one.',
      400,
      'INVALID_RESET_TOKEN',
    );
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  await db.$transaction([
    db.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    }),
    // Invalidate every outstanding reset token for this user, not just
    // the one consumed — a stale link from an earlier request should
    // stop working too.
    db.passwordResetToken.deleteMany({ where: { userId: resetToken.userId } }),
  ]);
}

export async function getProfile(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError('Account not found');
  }
  return toSafeUser(user);
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError('Account not found');
  }

  if (input.mobileNumber !== user.mobileNumber) {
    const mobileTaken = await db.user.findUnique({
      where: { mobileNumber: input.mobileNumber },
    });
    if (mobileTaken) {
      throw new ConflictError('This mobile number is already in use');
    }
  }

  const updated = await db.user.update({
    where: { id: userId },
    data: { fullName: input.fullName, mobileNumber: input.mobileNumber },
  });

  return toSafeUser(updated);
}

export async function changePassword(userId: string, input: ChangePasswordInput) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError('Account not found');
  }

  const isCurrentValid = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!isCurrentValid) {
    throw new AppError('Current password is incorrect', 400, 'INVALID_CURRENT_PASSWORD');
  }

  const passwordHash = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS);
  await db.user.update({ where: { id: userId }, data: { passwordHash } });
}
