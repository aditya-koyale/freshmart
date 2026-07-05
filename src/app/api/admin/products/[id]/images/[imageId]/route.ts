import { ok, handleApiError } from '@/lib/api-response';
import { requireAdminSession } from '@/lib/session';
import { db } from '@/lib/db';
import { NotFoundError } from '@/lib/api-response';
import { cloudinary } from '@/lib/cloudinary';
import { recordAuditLog } from '@/services/auditLogService';

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; imageId: string } },
) {
  try {
    const session = await requireAdminSession();

    const image = await db.productImage.findFirst({
      where: { id: params.imageId, productId: params.id },
    });

    if (!image) {
      throw new NotFoundError('Image not found');
    }

    await db.productImage.delete({ where: { id: params.imageId } });

    // Only attempt Cloudinary deletion if we stored a publicId.
    // Pre-existing rows (uploaded before this fix) may have publicId=null;
    // their Cloudinary asset becomes orphaned but won't cause an error.
    if (image.publicId) {
      await cloudinary.uploader.destroy(image.publicId).catch((err: unknown) => {
        console.error('Cloudinary deletion failed (image still removed from DB):', err);
      });
    }

    await recordAuditLog({
      userId: session.user.id,
      action: 'PRODUCT_IMAGE_DELETED',
      entity: 'Product',
      entityId: params.id,
    });

    return ok({ message: 'Image deleted' });
  } catch (error) {
    return handleApiError(error);
  }
}
