import { db } from '@/lib/db';
import { AppError, NotFoundError } from '@/lib/api-response';
import { getCheckoutQuote } from '@/services/checkoutService';
import { clearCart } from '@/services/cartService';
import type { PlaceOrderInput } from '@/lib/validation/order';
import type { OrderStatus } from '@prisma/client';

function generateOrderNumber(): string {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `FM${datePart}${randomPart}`;
}

export interface PlacedOrderSummary {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  grandTotal: number;
  createdAt: Date;
}

/**
 * The commitment point for an order. Re-runs the exact same validation
 * chain Checkout's live quote already uses (checkoutService.getCheckoutQuote)
 * — cart, address ownership, serviceability, minimum order, coupon — so
 * none of that is duplicated here. What the quote can't guarantee is
 * that stock is *still* available a few seconds later; that's handled
 * inside this function's own transaction via an atomic, conditional
 * decrement per item (`stock >= quantity` checked and decremented in one
 * statement), rather than a separate reservation step — see the
 * Development Log for why no live "hold" exists yet.
 */
export async function placeOrder(
  userId: string,
  input: PlaceOrderInput,
): Promise<PlacedOrderSummary> {
  const quote = await getCheckoutQuote(userId, {
    addressId: input.addressId,
    couponCode: input.couponCode,
  });

  // Checkout's live preview treats an invalid coupon as non-fatal (just
  // shows no discount). Placing an order is the commitment point, so a
  // coupon the customer explicitly submitted here must actually be
  // valid — silently dropping it would mean charging more than they
  // agreed to.
  if (input.couponCode && quote.couponError) {
    throw new AppError(quote.couponError, 400, 'COUPON_INVALID_AT_PLACEMENT');
  }

  let couponId: string | null = null;
  if (quote.appliedCouponCode) {
    const coupon = await db.coupon.findUnique({ where: { code: quote.appliedCouponCode } });
    couponId = coupon?.id ?? null;
  }

  let deliverySlot = null;
  if (input.deliverySlotId) {
    deliverySlot = await db.deliverySlot.findUnique({ where: { id: input.deliverySlotId } });
    if (!deliverySlot || deliverySlot.isDisabled) {
      throw new NotFoundError('The selected delivery slot is no longer available');
    }
  }

  const orderNumber = generateOrderNumber();

  const order = await db.$transaction(async (tx) => {
    for (const item of quote.cart.items) {
      const inventory = await tx.inventory.findUnique({
        where: { weightVariantId: item.weightVariantId },
        select: { id: true },
      });

      if (!inventory) {
        throw new AppError(
          `${item.productName} (${item.variantLabel}) is no longer available.`,
          409,
          'STOCK_CHANGED',
        );
      }

      // Atomic check-and-decrement: the WHERE clause is evaluated by
      // Postgres against the row's current state at the moment of the
      // UPDATE itself, so this is race-safe against concurrent orders
      // for the same variant without needing a separate locking step.
      const result = await tx.inventory.updateMany({
        where: { id: inventory.id, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });

      if (result.count === 0) {
        throw new AppError(
          `${item.productName} (${item.variantLabel}) sold out just now. Please review your cart and try again.`,
          409,
          'STOCK_CHANGED',
        );
      }

      await tx.inventoryHistory.create({
        data: { inventoryId: inventory.id, change: -item.quantity, reason: 'ORDER_PLACED' },
      });
    }

    if (input.deliverySlotId && deliverySlot) {
      const slotResult = await tx.deliverySlot.updateMany({
        where: { id: input.deliverySlotId, currentLoad: { lt: deliverySlot.maxOrders } },
        data: { currentLoad: { increment: 1 } },
      });
      if (slotResult.count === 0) {
        throw new AppError(
          'That delivery slot just filled up. Please pick another.',
          409,
          'SLOT_FULL',
        );
      }
    }

    const createdOrder = await tx.order.create({
      data: {
        orderNumber,
        userId,
        addressId: input.addressId,
        deliverySlotId: input.deliverySlotId,
        couponId,
        // COD is the only payment method live in v1 (SRS Part 12 §4) —
        // not exposed as a client-chosen field since there's nothing
        // else to choose yet.
        paymentMethod: 'COD',
        paymentStatus: 'PENDING',
        status: 'PENDING',
        subtotal: quote.pricing.subtotal,
        discountAmount: quote.pricing.discountAmount,
        deliveryCharge: quote.pricing.deliveryCharge,
        taxAmount: quote.pricing.taxAmount,
        grandTotal: quote.pricing.grandTotal,
        customerNote: input.customerNote,
        items: {
          create: quote.cart.items.map((item) => ({
            productId: item.productId,
            weightVariantId: item.weightVariantId,
            weightLabel: item.variantLabel,
            quantity: item.quantity,
            priceAtPurchase: item.unitPrice,
            total: item.lineTotal,
          })),
        },
        statusHistory: {
          create: { status: 'PENDING', note: 'Order placed' },
        },
      },
    });

    if (couponId) {
      await tx.couponUsage.create({
        data: { couponId, userId, orderId: createdOrder.id },
      });
    }

    return createdOrder;
  });

  // Outside the transaction deliberately — clearing the cart is not
  // stock-sensitive, and if it failed mid-transaction for an unrelated
  // reason it shouldn't roll back a successfully placed order.
  await clearCart(userId);

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    grandTotal: order.grandTotal.toNumber(),
    createdAt: order.createdAt,
  };
}

export interface OrderDetail {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: Date;
  items: {
    id: string;
    productName: string;
    weightLabel: string;
    quantity: number;
    priceAtPurchase: number;
    total: number;
    imageUrl: string | null;
  }[];
  address: {
    label: string;
    fullName: string;
    mobileNumber: string;
    houseNumber: string;
    buildingName: string | null;
    street: string;
    landmark: string | null;
    area: string;
    city: string;
    state: string;
    pinCode: string;
  };
  deliverySlot: { date: Date; startTime: string; endTime: string } | null;
  pricing: {
    subtotal: number;
    discountAmount: number;
    deliveryCharge: number;
    taxAmount: number;
    grandTotal: number;
  };
}

export async function getOrderById(userId: string, orderId: string): Promise<OrderDetail> {
  const order = await db.order.findFirst({
    where: { id: orderId, userId },
    include: {
      items: {
        include: {
          product: { select: { name: true, images: { take: 1, orderBy: { displayOrder: 'asc' } } } },
        },
      },
      address: true,
      deliverySlot: true,
    },
  });

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    createdAt: order.createdAt,
    items: order.items.map((item) => ({
      id: item.id,
      productName: item.product.name,
      weightLabel: item.weightLabel,
      quantity: item.quantity,
      priceAtPurchase: item.priceAtPurchase.toNumber(),
      total: item.total.toNumber(),
      imageUrl: item.product.images[0]?.url ?? null,
    })),
    address: {
      label: order.address.label,
      fullName: order.address.fullName,
      mobileNumber: order.address.mobileNumber,
      houseNumber: order.address.houseNumber,
      buildingName: order.address.buildingName,
      street: order.address.street,
      landmark: order.address.landmark,
      area: order.address.area,
      city: order.address.city,
      state: order.address.state,
      pinCode: order.address.pinCode,
    },
    deliverySlot: order.deliverySlot
      ? {
          date: order.deliverySlot.date,
          startTime: order.deliverySlot.startTime,
          endTime: order.deliverySlot.endTime,
        }
      : null,
    pricing: {
      subtotal: order.subtotal.toNumber(),
      discountAmount: order.discountAmount.toNumber(),
      deliveryCharge: order.deliveryCharge.toNumber(),
      taxAmount: order.taxAmount.toNumber(),
      grandTotal: order.grandTotal.toNumber(),
    },
  };
}
