import { ok, handleApiError, NotFoundError } from '@/lib/api-response';
import { requireAdminSession } from '@/lib/session';
import { adminBannerSchema } from '@/lib/validation/admin-module4';
import { db } from '@/lib/db';
import { uploadImage } from '@/lib/cloudinary';
import { recordAuditLog } from '@/services/auditLogService';

export async function GET() {
  try {
    await requireAdminSession();
    const banners = await db.banner.findMany({ orderBy: { displayOrder: 'asc' } });
    return ok(banners);
  } catch (e) { return handleApiError(e); }
}

/**
 * Banner creation accepts multipart/form-data so the image is uploaded in
 * the same request. Fields match adminBannerSchema plus a required `file`.
 */
export async function POST(request: Request) {
  try {
    const session = await requireAdminSession();
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      const { ok: okFn, handleApiError: _, ...rest } = await import('@/lib/api-response');
      return okFn(null, 400); // unreachable — just satisfies TS
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { url } = await uploadImage(buffer, 'banners');

    const input = adminBannerSchema.parse({
      title: formData.get('title') || null,
      subtitle: formData.get('subtitle') || null,
      buttonText: formData.get('buttonText') || null,
      destinationLink: formData.get('destinationLink') || null,
      displayOrder: formData.get('displayOrder') ? Number(formData.get('displayOrder')) : 0,
      isActive: formData.get('isActive') !== 'false',
      startDate: formData.get('startDate') || null,
      endDate: formData.get('endDate') || null,
    });

    const banner = await db.banner.create({ data: { ...input, imageUrl: url } });
    await recordAuditLog({ userId: session.user.id, action: 'BANNER_CREATED', entity: 'Banner', entityId: banner.id });
    return ok(banner, 201);
  } catch (e) { return handleApiError(e); }
}
