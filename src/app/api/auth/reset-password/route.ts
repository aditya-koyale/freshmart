import { ok, handleApiError } from '@/lib/api-response';
import { resetPasswordSchema } from '@/lib/validation/auth';
import { resetPassword } from '@/services/authService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = resetPasswordSchema.parse(body);

    await resetPassword(input);

    return ok({ message: 'Your password has been reset. You can now log in.' });
  } catch (error) {
    return handleApiError(error);
  }
}
