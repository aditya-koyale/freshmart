import { ok, handleApiError } from '@/lib/api-response';
import { listPublicCategories } from '@/services/categoryService';

export async function GET() {
  try {
    const categories = await listPublicCategories();
    return ok(categories);
  } catch (error) {
    return handleApiError(error);
  }
}
