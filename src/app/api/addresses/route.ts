import { ok, handleApiError } from '@/lib/api-response';
import { requireCustomerSession } from '@/lib/session';
import { addressSchema } from '@/lib/validation/address';
import { listAddresses, createAddress } from '@/services/addressService';

export async function GET() {
  try {
    const session = await requireCustomerSession();
    const addresses = await listAddresses(session.user.id);
    return ok(addresses);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireCustomerSession();
    const body = await request.json();
    const input = addressSchema.parse(body);

    const address = await createAddress(session.user.id, input);
    return ok(address, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
