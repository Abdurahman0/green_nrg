import { Product } from '@/types';

const isValidImageUrl = (value: string | undefined): value is string => {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  return /^https?:\/\//i.test(trimmed);
};

export const getProductImages = (product: Product, max = 3): string[] => {
  const candidates: Array<string | undefined> = [
    product.primary_image_url,
    ...(Array.isArray(product.image_urls) ? product.image_urls : []),
    product.image_url,
  ];

  const unique: string[] = [];
  for (const value of candidates) {
    if (!isValidImageUrl(value)) continue;
    if (unique.includes(value)) continue;
    unique.push(value);
    if (unique.length >= Math.max(1, max)) break;
  }

  return unique;
};

export const getProductImage = (product: Product): string | undefined => {
  return getProductImages(product, 1)[0];
};
