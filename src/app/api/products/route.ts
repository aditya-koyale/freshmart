import { ok, handleApiError } from '@/lib/api-response';
import { listPublicProducts } from '@/services/productService';
import { productListQuerySchema } from '@/lib/validation/product';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = productListQuerySchema.parse({
      categorySlug: searchParams.get('category') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      featured: searchParams.get('featured') ?? undefined,
      bestSeller: searchParams.get('bestSeller') ?? undefined,
      seasonal: searchParams.get('seasonal') ?? undefined,
      newArrival: searchParams.get('newArrival') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
    });

    const result = await listPublicProducts(query);
    return ok(result);
  } catch (error) {
    return handleApiError(error);
  }
}
