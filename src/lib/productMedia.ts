import { Product } from '@/types';

const isValidImageUrl = (value: string | undefined): value is string => {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  return /^https?:\/\//i.test(trimmed);
};

export const getProductImage = (product: Product): string | undefined => {
  if (isValidImageUrl(product.primary_image_url)) return product.primary_image_url;
  if (isValidImageUrl(product.image_url)) return product.image_url;
  return undefined;
};
