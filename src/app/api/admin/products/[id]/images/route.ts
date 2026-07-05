import { ok, fail, handleApiError } from '@/lib/api-response';
import { requireAdminSession } from '@/lib/session';
import { uploadImage } from '@/lib/cloudinary';
import { db } from '@/lib/db';
import { NotFoundError } from '@/lib/api-response';
import { recordAuditLog } from '@/services/auditLogService';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireAdminSession();

    const product = await db.product.findUnique({ where: { id: params.id } });
    if (!product || product.deletedAt) {
      throw new NotFoundError('Product not found');
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return fail('No file uploaded', 400, 'FILE_REQUIRED');
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return fail('Only JPEG, PNG, or WEBP images are allowed', 415, 'UNSUPPORTED_TYPE');
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return fail('Image must be smaller than 5MB', 413, 'FILE_TOO_LARGE');
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { url, publicId } = await uploadImage(buffer, 'products');

    const lastImage = await db.productImage.findFirst({
      where: { productId: params.id },
      orderBy: { displayOrder: 'desc' },
    });

    const image = await db.productImage.create({
      data: {
        productId: params.id,
        url,
        publicId,
        displayOrder: (lastImage?.displayOrder ?? -1) + 1,
      },
    });

    await recordAuditLog({
      userId: session.user.id,
      action: 'PRODUCT_IMAGE_ADDED',
      entity: 'Product',
      entityId: params.id,
    });

    return ok(image, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
