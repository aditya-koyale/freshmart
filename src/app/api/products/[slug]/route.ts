import { ok, handleApiError } from '@/lib/api-response';
import { getPublicProductBySlug } from '@/services/productService';

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } },
) {
  try {
    const product = await getPublicProductBySlug(params.slug);
    return ok(product);
  } catch (error) {
    return handleApiError(error);
  }
}
