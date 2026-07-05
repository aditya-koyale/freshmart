import { ok, handleApiError } from '@/lib/api-response';
import { requireCustomerSession } from '@/lib/session';
import { setDefaultAddress } from '@/services/addressService';

export async function PATCH(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireCustomerSession();
    await setDefaultAddress(session.user.id, params.id);
    return ok({ message: 'Default address updated' });
  } catch (error) {
    return handleApiError(error);
  }
}
