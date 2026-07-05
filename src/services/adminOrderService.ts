import { db } from '@/lib/db';
import { AppError, NotFoundError } from '@/lib/api-response';
import type { OrderStatus, Prisma } from '@prisma/client';

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING:          ['CONFIRMED', 'CANCELLED'],
  CONFIRMED:        ['PREPARING', 'CANCELLED'],
  PREPARING:        ['PACKED', 'CANCELLED'],
  PACKED:           ['OUT_FOR_DELIVERY', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED:        ['REFUNDED'],
  CANCELLED:        [],
  REFUNDED:         [],
};

export async function listAdminOrders(params: {
  page: number;
  pageSize: number;
  search?: string;
  status?: OrderStatus;
}) {
  const where: Prisma.OrderWhereInput = {};

  if (params.status) where.status = params.status;

  if (params.search) {
    where.OR = [
      { orderNumber: { contains: params.search, mode: 'insensitive' } },
      { user: { fullName: { contains: params.search, mode: 'insensitive' } } },
      { user: { email: { contains: params.search, mode: 'insensitive' } } },
    ];
  }

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        items: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
    db.order.count({ where }),
  ]);

  return {
    orders: orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      grandTotal: order.grandTotal.toNumber(),
      itemCount: order.items.length,
      customerName: order.user.fullName,
      customerEmail: order.user.email,
      customerId: order.user.id,
      createdAt: order.createdAt,
    })),
    pagination: {
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages: Math.ceil(total / params.pageSize),
    },
  };
}

export async function getAdminOrderById(id: string) {
  const order = await db.order.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, fullName: true, email: true, mobileNumber: true } },
      address: true,
      deliverySlot: true,
      coupon: { select: { code: true } },
      items: {
        include: {
          product: { select: { name: true, slug: true, images: { take: 1, orderBy: { displayOrder: 'asc' } } } },
        },
      },
      statusHistory: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!order) throw new NotFoundError('Order not found');

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    customerNote: order.customerNote,
    internalNote: order.internalNote,
    createdAt: order.createdAt,
    customer: order.user,
    address: order.address,
    deliverySlot: order.deliverySlot,
    couponCode: order.coupon?.code ?? null,
    items: order.items.map((item) => ({
      id: item.id,
      productName: item.product.name,
      productSlug: item.product.slug,
      imageUrl: item.product.images[0]?.url ?? null,
      weightLabel: item.weightLabel,
      quantity: item.quantity,
      priceAtPurchase: item.priceAtPurchase.toNumber(),
      total: item.total.toNumber(),
    })),
    pricing: {
      subtotal: order.subtotal.toNumber(),
      discountAmount: order.discountAmount.toNumber(),
      deliveryCharge: order.deliveryCharge.toNumber(),
      taxAmount: order.taxAmount.toNumber(),
      grandTotal: order.grandTotal.toNumber(),
    },
    statusHistory: order.statusHistory.map((h) => ({
      id: h.id,
      status: h.status,
      note: h.note,
      createdAt: h.createdAt,
    })),
    validNextStatuses: VALID_TRANSITIONS[order.status] ?? [],
  };
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  note?: string,
) {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundError('Order not found');

  const allowed = VALID_TRANSITIONS[order.status] ?? [];
  if (!allowed.includes(newStatus)) {
    throw new AppError(
      `Cannot transition from ${order.status} to ${newStatus}.`,
      409,
      'INVALID_STATUS_TRANSITION',
    );
  }

  return db.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id: orderId },
      data: { status: newStatus },
    });

    await tx.orderStatusHistory.create({
      data: { orderId, status: newStatus, note: note ?? null },
    });

    // When order is refunded, restore stock (cancelled orders don't restore
    // stock — cancellation before fulfilment is a business edge case handled
    // per admin discretion via manual inventory adjustment).
    if (newStatus === 'REFUNDED') {
      const items = await tx.orderItem.findMany({ where: { orderId } });
      for (const item of items) {
        const inv = await tx.inventory.findUnique({
          where: { weightVariantId: item.weightVariantId },
        });
        if (inv) {
          await tx.inventory.update({
            where: { id: inv.id },
            data: { stock: { increment: item.quantity } },
          });
          await tx.inventoryHistory.create({
            data: { inventoryId: inv.id, change: item.quantity, reason: 'ORDER_REFUNDED' },
          });
        }
      }
    }

    return updated;
  });
}

export async function updateOrderInternalNote(orderId: string, internalNote: string) {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundError('Order not found');
  return db.order.update({ where: { id: orderId }, data: { internalNote } });
}

export type { OrderStatus };
