'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Alert } from '@/components/ui/Alert';
import { ApiRequestError } from '@/lib/api-client';

interface ProductImage {
  id: string;
  url: string;
  displayOrder: number;
}

const MAX_SIZE_MB = 5;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function ImageUploadManager({
  productId,
  images,
  onRefresh,
}: {
  productId: string;
  images: ProductImage[];
  onRefresh?: () => void;
}) {
  const router = useRouter();
  const refresh = onRefresh ?? (() => router.refresh());
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError('Only JPEG, PNG, or WEBP images are allowed.');
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setUploadError(`Image must be smaller than ${MAX_SIZE_MB}MB.`);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    try {
      const response = await fetch(`/api/admin/products/${productId}/images`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message ?? 'Upload failed');
      }
      refresh();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function handleDelete(imageId: string) {
    setDeletingId(imageId);
    try {
      const response = await fetch(
        `/api/admin/products/${productId}/images/${imageId}`,
        { method: 'DELETE' },
      );
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new ApiRequestError(data.message ?? 'Delete failed', response.status);
      }
      refresh();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Could not delete image.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        {images.map((image) => (
          <div
            key={image.id}
            className="group relative h-24 w-24 overflow-hidden rounded-control border border-border bg-surface-subtle"
          >
            <Image
              src={image.url}
              alt="Product image"
              fill
              sizes="96px"
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => handleDelete(image.id)}
              disabled={deletingId === image.id}
              aria-label="Delete image"
              className="absolute inset-0 flex items-center justify-center bg-ink/60 opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-100"
            >
              {deletingId === image.id ? (
                <svg
                  className="h-5 w-5 animate-spin text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white">
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-control border-2 border-dashed border-border text-ink-faint hover:border-primary hover:text-primary disabled:opacity-50"
        >
          {isUploading ? (
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="text-xs font-medium">Upload</span>
            </>
          )}
        </button>
      </div>

      {uploadError && <Alert variant="error">{uploadError}</Alert>}

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        className="sr-only"
        onChange={handleFileChange}
        aria-label="Upload product image"
      />
      <p className="text-xs text-ink-faint">
        JPEG, PNG, or WEBP · max {MAX_SIZE_MB}MB. First image is the product cover.
      </p>
    </div>
  );
}
