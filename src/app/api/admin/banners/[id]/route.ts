import { ok, handleApiError, NotFoundError } from '@/lib/api-response';
import { requireAdminSession } from '@/lib/session';
import { adminBannerSchema } from '@/lib/validation/admin-module4';
import { db } from '@/lib/db';
import { uploadImage, cloudinary } from '@/lib/cloudinary';
import { recordAuditLog } from '@/services/auditLogService';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireAdminSession();
    const banner = await db.banner.findUnique({ where: { id: params.id } });
    if (!banner) throw new NotFoundError('Banner not found');

    const contentType = request.headers.get('content-type') ?? '';
    let imageUrl = banner.imageUrl;

    let updateData: Partial<typeof banner> = {};

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');
      if (file instanceof File) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const { url } = await uploadImage(buffer, 'banners');
        imageUrl = url;
      }
     const parsed = adminBannerSchema.partial().parse({
  title: formData.get('title') || null,
  subtitle: formData.get('subtitle') || null,
  buttonText: formData.get('buttonText') || null,
  destinationLink: formData.get('destinationLink') || null,
  displayOrder: formData.get('displayOrder')
    ? Number(formData.get('displayOrder'))
    : undefined,
  isActive: formData.has('isActive')
    ? formData.get('isActive') !== 'false'
    : undefined,
  startDate: formData.get('startDate') || null,
  endDate: formData.get('endDate') || null,
});

updateData = {
  ...parsed,
  startDate: parsed.startDate ? new Date(parsed.startDate) : null,
  endDate: parsed.endDate ? new Date(parsed.endDate) : null,
};
    } else {
      const parsed = adminBannerSchema.partial().parse(await request.json());

updateData = {
  ...parsed,
  startDate: parsed.startDate ? new Date(parsed.startDate) : null,
  endDate: parsed.endDate ? new Date(parsed.endDate) : null,
};
    }

    const updated = await db.banner.update({
      where: { id: params.id },
      data: { ...updateData, imageUrl },
    });
    await recordAuditLog({ userId: session.user.id, action: 'BANNER_UPDATED', entity: 'Banner', entityId: params.id });
    return ok(updated);
  } catch (e) { return handleApiError(e); }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireAdminSession();
    const banner = await db.banner.findUnique({ where: { id: params.id } });
    if (!banner) throw new NotFoundError('Banner not found');
    await db.banner.delete({ where: { id: params.id } });
    await recordAuditLog({ userId: session.user.id, action: 'BANNER_DELETED', entity: 'Banner', entityId: params.id });
    return ok({ message: 'Banner deleted' });
  } catch (e) { return handleApiError(e); }
}
