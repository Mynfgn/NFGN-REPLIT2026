/**
 * Resolves any product image URL to the correct absolute or relative path.
 * - https://... external URLs pass through unchanged
 * - /objects/... → /api/storage/objects/... (uploaded via object storage)
 * - anything else passes through as-is
 */
export function resolveImageSrc(image: string | null | undefined): string | null {
  if (!image) return null;
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  if (image.startsWith("/objects/")) return `/api/storage${image}`;
  return image;
}
