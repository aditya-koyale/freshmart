import { ok, handleApiError } from '@/lib/api-response';
import { getCategoryBySlug } from '@/services/categoryService';

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } },
) {
  try {
    const category = await getCategoryBySlug(params.slug);
    return ok(category);
  } catch (error) {
    return handleApiError(error);
  }
}
