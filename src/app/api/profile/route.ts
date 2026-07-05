import { ok, handleApiError } from '@/lib/api-response';
import { requireCustomerSession } from '@/lib/session';
import { updateProfileSchema } from '@/lib/validation/auth';
import { getProfile, updateProfile } from '@/services/authService';

export async function GET() {
  try {
    const session = await requireCustomerSession();
    const profile = await getProfile(session.user.id);
    return ok(profile);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireCustomerSession();
    const body = await request.json();
    const input = updateProfileSchema.parse(body);

    const profile = await updateProfile(session.user.id, input);
    return ok(profile);
  } catch (error) {
    return handleApiError(error);
  }
}
