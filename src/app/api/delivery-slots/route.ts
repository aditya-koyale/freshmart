import { ok, handleApiError } from '@/lib/api-response';
import { listUpcomingDeliverySlots } from '@/services/deliverySlotService';

export async function GET() {
  try {
    const slots = await listUpcomingDeliverySlots();
    return ok(slots);
  } catch (error) {
    return handleApiError(error);
  }
}
