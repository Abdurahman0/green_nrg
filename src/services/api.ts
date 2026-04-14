import {
  BootstrapData,
  CatalogData,
  Category,
  CategoryDetail,
  CheckoutPayload,
  CheckoutResult,
  Favorite,
  Order,
  Product,
  Profile,
  Review,
} from '../types';
import { waitForTelegramInitData } from '@/lib/telegramWebApp';
import { debugStore, makeId } from '@/lib/debugStore';
import { getApiBaseUrl } from '@/config';

interface ApiEnvelope<T> {
  status: string;
  data: T;
  message?: string;
}

const API_BASE_URL = getApiBaseUrl();
// Use same-origin proxy on Vercel to avoid CORS from webviews.
const WEBAPP_PREFIX = '/api/telegram-webapp';

const toNumber = (value: unknown): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const normalized = value.replace(/[^\d.-]/g, '');
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const unwrapData = <T>(payload: unknown): T => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as ApiEnvelope<T>).data;
  }
  return payload as T;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const headers = new Headers(init?.headers ?? {});
  debugStore.push({
    id: makeId(),
    ts: Date.now(),
    kind: 'log',
    message: 'API: request invoked',
    meta: {
      path,
      method: init?.method ?? 'GET',
    },
  });
  const initData = await waitForTelegramInitData();
  if (!initData) {
    debugStore.push({
      id: makeId(),
      ts: Date.now(),
      kind: 'http',
      phase: 'error',
      method: init?.method ?? 'GET',
      url: `${API_BASE_URL}${WEBAPP_PREFIX}${path}`,
      error: 'Telegram initData missing',
      initDataLength: 0,
    });
    throw new Error('Telegram initData is missing. Open this app inside Telegram WebApp.');
  }
  headers.set('X-Telegram-Init-Data', initData);

  if (init?.body && !(init?.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const url = `${API_BASE_URL}${WEBAPP_PREFIX}${path}`;
  const requestId = makeId();
  debugStore.push({
    id: requestId,
    ts: Date.now(),
    kind: 'http',
    phase: 'start',
    method: init?.method ?? 'GET',
    url,
    initDataLength: initData.length,
  });

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      method: init?.method ?? 'GET',
      headers,
      credentials: 'include',
    });
  } catch (err) {
    debugStore.push({
      id: makeId(),
      ts: Date.now(),
      kind: 'http',
      phase: 'error',
      method: init?.method ?? 'GET',
      url,
      error: err instanceof Error ? err.message : String(err),
      initDataLength: initData.length,
    });
    throw err;
  }

  let payload: unknown = null;
  let rawText = '';
  try {
    rawText = await response.text();
    payload = rawText ? JSON.parse(rawText) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const snippet = rawText
      ? rawText.slice(0, 220).replace(/\s+/g, ' ').trim()
      : '';
    debugStore.push({
      id: makeId(),
      ts: Date.now(),
      kind: 'http',
      phase: 'end',
      method: init?.method ?? 'GET',
      url,
      status: response.status,
      ok: false,
      initDataLength: initData.length,
      error: snippet ? `HTTP ${response.status}: ${snippet}` : `HTTP ${response.status}`,
    });
    const message =
      (payload &&
        typeof payload === 'object' &&
        'detail' in payload &&
        typeof (payload as { detail?: unknown }).detail === 'string' &&
        (payload as { detail: string }).detail) ||
      (payload &&
        typeof payload === 'object' &&
        'message' in payload &&
        typeof (payload as { message?: unknown }).message === 'string' &&
        (payload as { message: string }).message) ||
      `Request failed: ${response.status}`;
    throw new Error(message);
  }

  debugStore.push({
    id: makeId(),
    ts: Date.now(),
    kind: 'http',
    phase: 'end',
    method: init?.method ?? 'GET',
    url,
    status: response.status,
    ok: true,
    initDataLength: initData.length,
  });

  return unwrapData<T>(payload);
};

const normalizeProduct = (product: Record<string, unknown>): Product => {
  // Resolve category object from either 'category' (new API) or flat fields
  let category: Category | undefined;
  if (product.category && typeof product.category === 'object') {
    category = normalizeCategory(product.category as Record<string, unknown>);
  }

  return {
    id: String(product.id ?? ''),
    name: String(product.name ?? ''),
    price: toNumber(product.price),
    category,
    category_name:
      typeof product.category_name === 'string' ? product.category_name : undefined,
    category__name:
      typeof product.category__name === 'string'
        ? product.category__name
        : category?.name,
    description: typeof product.description === 'string' ? product.description : undefined,
    image_url: typeof product.image_url === 'string' ? product.image_url : undefined,
    primary_image_url:
      typeof product.primary_image_url === 'string' ? product.primary_image_url : undefined,
    is_promoted: typeof product.is_promoted === 'boolean' ? product.is_promoted : undefined,
    stock_quantity:
      product.stock_quantity !== undefined ? toNumber(product.stock_quantity) : undefined,
    image_urls: Array.isArray(product.image_urls)
      ? product.image_urls.map((u) => String(u))
      : undefined,
  };
};

const normalizeCategory = (category: Record<string, unknown>): Category => ({
  id: String(category.id ?? ''),
  name: String(category.name ?? ''),
  code: String(category.code ?? ''),
});

const normalizeOrder = (order: Record<string, unknown>): Order => ({
  id: String(order.id ?? ''),
  title: String(order.title ?? ''),
  status: String(order.status ?? 'pending'),
  total_amount: toNumber(order.total_amount),
  created_at: String(order.created_at ?? ''),
});

const normalizeReview = (review: Record<string, unknown>): Review => ({
  id: String(review.id ?? ''),
  user: String(review.user ?? ''),
  contract: String(review.contract ?? ''),
  rating: toNumber(review.rating),
  comment: String(review.comment ?? ''),
  created_at: String(review.created_at ?? ''),
});

const normalizeFavorite = (favorite: Record<string, unknown>): Favorite => ({
  id: String(favorite.id ?? ''),
  user: String(favorite.user ?? ''),
  product: String(favorite.product ?? ''),
  created_at: String(favorite.created_at ?? ''),
});

export const api = {
  getBootstrap: async (): Promise<BootstrapData> => {
    const raw = await request<unknown>('/bootstrap/');
    const data = asRecord(raw);
    const user = asRecord(data.user);
    const rawCustomer =
      data.customer && typeof data.customer === 'object'
        ? asRecord(data.customer)
        : null;
    const rawActiveOrder =
      data.active_order && typeof data.active_order === 'object'
        ? asRecord(data.active_order)
        : null;
    const rawOrderHistory = Array.isArray(data.order_history) ? data.order_history : [];
    const rawPendingReviews = Array.isArray(data.pending_reviews) ? data.pending_reviews : [];
    const rawFavorites = Array.isArray(data.favorites) ? data.favorites : [];
    const rawPaymentMethods = Array.isArray(data.payment_methods) ? data.payment_methods : [];

    return {
      user: {
        id: String(user.id ?? ''),
        username: String(user.username ?? ''),
      },
      customer: rawCustomer
        ? {
            id:
              rawCustomer.id === null || rawCustomer.id === undefined
                ? null
                : String(rawCustomer.id),
            full_name:
              rawCustomer.full_name === null || rawCustomer.full_name === undefined
                ? null
                : String(rawCustomer.full_name),
            phone:
              rawCustomer.phone === null || rawCustomer.phone === undefined
                ? null
                : String(rawCustomer.phone),
            address:
              rawCustomer.address === null || rawCustomer.address === undefined
                ? null
                : String(rawCustomer.address),
          }
        : null,
      active_order: rawActiveOrder ? normalizeOrder(rawActiveOrder) : null,
      order_history: rawOrderHistory.map((item) => normalizeOrder(asRecord(item))),
      favorites: rawFavorites.map((item) => String(item ?? '')),
      pending_reviews: rawPendingReviews.map((item) => normalizeOrder(asRecord(item))),
      payment_methods: rawPaymentMethods.map((item) => String(item ?? '')),
    };
  },

  getCatalog: async (categoryFilter?: string): Promise<CatalogData> => {
    const qs = categoryFilter ? `?category=${encodeURIComponent(categoryFilter)}` : '';
    const raw = await request<unknown>(`/catalog/${qs}`);
    const data = asRecord(raw);
    const categoriesRaw = Array.isArray(data.categories) ? data.categories : [];
    const brandsRaw = Array.isArray(data.brands) ? data.brands : [];
    const productsRaw = Array.isArray(data.products) ? data.products : [];
    const promotedRaw = Array.isArray(data.promoted_products) ? data.promoted_products : [];

    return {
      categories: categoriesRaw.map((item) => normalizeCategory(asRecord(item))),
      brands: brandsRaw.map((item) => String(item ?? '')),
      products: productsRaw.map((item) => normalizeProduct(item as Record<string, unknown>)),
      promoted_products: promotedRaw.map((item) =>
        normalizeProduct(item as Record<string, unknown>)
      ),
    };
  },

  getCategories: async (): Promise<Category[]> => {
    const data = await request<unknown[]>('/categories/');
    return (Array.isArray(data) ? data : []).map((item) =>
      normalizeCategory(item as Record<string, unknown>)
    );
  },

  getCategoryDetail: async (categoryId: string): Promise<CategoryDetail> => {
    const raw = await request<unknown>(`/categories/${categoryId}/`);
    const data = asRecord(raw);
    const rawCategory = asRecord(data.category);
    const brandsRaw = Array.isArray(data.brands) ? data.brands : [];
    const productsRaw = Array.isArray(data.products) ? data.products : [];

    return {
      category: normalizeCategory(rawCategory),
      brands: brandsRaw.map((item) => String(item ?? '')),
      products: productsRaw.map((item) => normalizeProduct(item as Record<string, unknown>)),
    };
  },

  getFavorites: async (): Promise<Favorite[]> => {
    const data = await request<unknown[]>('/favorites/');
    return (Array.isArray(data) ? data : []).map((item) =>
      normalizeFavorite(item as Record<string, unknown>)
    );
  },

  toggleFavorite: async (payload: { product: string }): Promise<Favorite | null> => {
    const body = JSON.stringify(payload);
    const data = await request<unknown>('/favorites/toggle/', {
      method: 'POST',
      body,
    });
    const objectData = asRecord(data);
    return Object.keys(objectData).length ? normalizeFavorite(objectData) : null;
  },

  getOrders: async (): Promise<Order[]> => {
    const data = await request<unknown[]>('/orders/');
    return (Array.isArray(data) ? data : []).map((item) =>
      normalizeOrder(item as Record<string, unknown>)
    );
  },

  getProfile: async (): Promise<Profile> => {
    const raw = await request<unknown>('/profile/');
    const data = asRecord(raw);
    return {
      id: String(data.id ?? ''),
      username: String(data.username ?? ''),
      full_name: String(data.full_name ?? ''),
    };
  },

  getReviews: async (): Promise<Review[]> => {
    const data = await request<unknown[]>('/reviews/');
    return (Array.isArray(data) ? data : []).map((item) =>
      normalizeReview(item as Record<string, unknown>)
    );
  },

  addReview: async (review: {
    contract: string;
    rating: number;
    comment: string;
  }): Promise<Review> => {
    const data = await request<unknown>('/reviews/', {
      method: 'POST',
      body: JSON.stringify(review),
    });

    if (Array.isArray(data) && data[0]) {
      return normalizeReview(data[0] as Record<string, unknown>);
    }

    return normalizeReview((data ?? {}) as Record<string, unknown>);
  },

  checkout: async (payload: CheckoutPayload): Promise<CheckoutResult> => {
    const raw = await request<unknown>('/checkout/', {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        items: payload.items.map((item) => ({
          product: item.id,
          quantity: item.quantity,
        })),
      }),
    });
    const data = asRecord(raw);
    return {
      contract_id: String(data.contract_id ?? ''),
      client_id: String(data.client_id ?? ''),
      message:
        typeof data.message === 'string' && data.message.trim()
          ? data.message
          : 'Order confirmed successfully.',
    };
  },
};
