import { ok, fail, handleApiError } from '@/lib/api-response';
import { checkPinCodeServiceability } from '@/services/deliveryAreaService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pinCode = searchParams.get('pinCode');

    if (!pinCode || !/^\d{6}$/.test(pinCode)) {
      return fail('Enter a valid 6-digit PIN code', 400, 'INVALID_PIN_CODE');
    }

    const result = await checkPinCodeServiceability(pinCode);
    return ok(result);
  } catch (error) {
    return handleApiError(error);
  }
}
