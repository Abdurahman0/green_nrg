import { Product } from '@/types';

const SUBSIDY_RATE = 0.2;
const SUBSIDY_CAP = 20_600_000;

const toNumber = (value: unknown): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const normalized = value.replace(/[^\d.-]/g, '');
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

export interface ProductPricing {
  basePrice: number;
  subsidyEnabled: boolean;
  subsidyAmount: number;
  priceAfterSubsidy: number;
  hasSubsidy: boolean;
  isRecommended: boolean;
}

export const getProductPricing = (product: Product): ProductPricing => {
  const basePrice = Math.max(0, toNumber(product.price));
  const inferredEnabled =
    (product.subsidy_amount !== undefined && toNumber(product.subsidy_amount) > 0) ||
    (product.price_after_subsidy !== undefined &&
      toNumber(product.price_after_subsidy) > 0 &&
      toNumber(product.price_after_subsidy) < basePrice);
  const subsidyEnabled = product.subsidy_enabled ?? inferredEnabled;
  const fallbackSubsidyAmount = Math.min(basePrice * SUBSIDY_RATE, SUBSIDY_CAP);
  const subsidyAmount = subsidyEnabled
    ? Math.max(0, toNumber(product.subsidy_amount) || fallbackSubsidyAmount)
    : 0;
  const priceAfterSubsidy = subsidyEnabled
    ? Math.max(
        0,
        toNumber(product.price_after_subsidy) || Math.max(0, basePrice - subsidyAmount)
      )
    : basePrice;

  return {
    basePrice,
    subsidyEnabled,
    subsidyAmount,
    priceAfterSubsidy,
    hasSubsidy: subsidyEnabled && subsidyAmount > 0 && priceAfterSubsidy < basePrice,
    isRecommended: Boolean(product.is_recommended),
  };
};
