import { Alert } from '@/components/ui/Alert';
import type { CartNotice } from '@/services/cartService';

function noticeMessage(notice: CartNotice): string {
  switch (notice.reason) {
    case 'OUT_OF_STOCK':
      return `${notice.productName} (${notice.variantLabel}) was removed — it's now out of stock.`;
    case 'PRODUCT_UNAVAILABLE':
      return `${notice.productName} (${notice.variantLabel}) was removed — it's no longer available.`;
    case 'QUANTITY_REDUCED':
      return `${notice.productName} (${notice.variantLabel}) quantity was reduced to ${notice.newQuantity} — that's all that's in stock.`;
  }
}

/**
 * Renders cartService's self-reconciliation notices (items removed or
 * quantity-reduced since they were added). Shared by the Cart page and
 * Checkout — both surface the exact same underlying CartNotice[], so the
 * message text only needs to be written once.
 */
export function CartNoticeList({ notices }: { notices: CartNotice[] }) {
  if (notices.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {notices.map((notice, index) => (
        <Alert key={index} variant="warning">
          {noticeMessage(notice)}
        </Alert>
      ))}
    </div>
  );
}
