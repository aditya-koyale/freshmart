import { ok, handleApiError } from '@/lib/api-response';
import { requireCustomerSession } from '@/lib/session';
import { changePasswordSchema } from '@/lib/validation/auth';
import { changePassword } from '@/services/authService';

export async function POST(request: Request) {
  try {
    const session = await requireCustomerSession();
    const body = await request.json();
    const input = changePasswordSchema.parse(body);

    await changePassword(session.user.id, input);
    return ok({ message: 'Password updated successfully.' });
  } catch (error) {
    return handleApiError(error);
  }
}
