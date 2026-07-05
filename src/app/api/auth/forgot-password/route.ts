import { ok, handleApiError } from '@/lib/api-response';
import { forgotPasswordSchema } from '@/lib/validation/auth';
import { requestPasswordReset } from '@/services/authService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    const baseUrl = process.env.NEXTAUTH_URL ?? new URL(request.url).origin;
    await requestPasswordReset(email, baseUrl);

    // Always a generic success message — see authService.requestPasswordReset.
    return ok({
      message: 'If an account exists for that email, a reset link has been sent.',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
