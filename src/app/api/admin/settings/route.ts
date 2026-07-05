import { z } from 'zod';
import { ok, handleApiError } from '@/lib/api-response';
import { requireAdminSession } from '@/lib/session';
import { db } from '@/lib/db';
import { recordAuditLog } from '@/services/auditLogService';

const updateSchema = z.record(z.string(), z.string());

export async function GET() {
  try {
    await requireAdminSession();
    const rows = await db.setting.findMany();
    const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return ok(settings);
  } catch (e) { return handleApiError(e); }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireAdminSession();
    const body = updateSchema.parse(await request.json());
    await Promise.all(
      Object.entries(body).map(([key, value]) =>
        db.setting.upsert({ where: { key }, update: { value }, create: { key, value } }),
      ),
    );
    await recordAuditLog({ userId: session.user.id, action: 'SETTINGS_UPDATED', entity: 'Setting', metadata: body });
    return ok({ message: 'Settings saved' });
  } catch (e) { return handleApiError(e); }
}
