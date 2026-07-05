import { ok, handleApiError } from '@/lib/api-response';
import { requireAdminSession } from '@/lib/session';
import { productSchema, productListQuerySchema } from '@/lib/validation/product';
import { listAdminProducts, createProduct } from '@/services/productService';
import { recordAuditLog } from '@/services/auditLogService';

export async function GET(request: Request) {
  try {
    await requireAdminSession();
    const { searchParams } = new URL(request.url);
    const query = productListQuerySchema.parse({
      categorySlug: searchParams.get('category') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
    });

    const result = await listAdminProducts(query);
    return ok(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdminSession();
    const body = await request.json();
    const input = productSchema.parse(body);

    const product = await createProduct(input);

    await recordAuditLog({
      userId: session.user.id,
      action: 'PRODUCT_CREATED',
      entity: 'Product',
      entityId: product.id,
      metadata: { name: product.name },
    });

    return ok(product, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
