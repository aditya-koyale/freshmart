import { ok, handleApiError } from '@/lib/api-response';
import { registerSchema } from '@/lib/validation/auth';
import { registerCustomer } from '@/services/authService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = registerSchema.parse(body);

    const user = await registerCustomer(input);

    return ok(user, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
