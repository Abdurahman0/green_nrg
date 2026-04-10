import {
  BootstrapData,
  CatalogData,
  Category,
  CategoryDetail,
  Favorite,
  Order,
  Product,
  Profile,
  Review,
} from '../types';

interface ApiEnvelope<T> {
  status: string;
  data: T;
  message?: string;
}

interface CheckoutItemInput {
  id: string;
  quantity: number;
}

const API_BASE_URL =
  (((import.meta as unknown as { env?: Record<string, string | undefined> }).env
    ?.VITE_API_BASE_URL as string | undefined) ?? ''
  ).trim();
const WEBAPP_PREFIX = '/api/integrations/telegram/webapp';

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
  const response = await fetch(`${API_BASE_URL}${WEBAPP_PREFIX}${path}`, {
    method: init?.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    credentials: 'include',
    ...init,
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      (payload &&
        typeof payload === 'object' &&
        'message' in payload &&
        typeof (payload as { message?: unknown }).message === 'string' &&
        (payload as { message: string }).message) ||
      `Request failed: ${response.status}`;
    throw new Error(message);
  }

  return unwrapData<T>(payload);
};

const normalizeProduct = (product: Record<string, unknown>): Product => ({
  id: String(product.id ?? ''),
  name: String(product.name ?? ''),
  price: toNumber(product.price),
  category__name:
    typeof product.category__name === 'string' ? product.category__name : undefined,
});

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
    return {
      user: {
        id: String(user.id ?? ''),
        username: String(user.username ?? ''),
      },
      categories_count: toNumber(data.categories_count),
      products_count: toNumber(data.products_count),
    };
  },

  getCatalog: async (): Promise<CatalogData> => {
    const raw = await request<unknown>('/catalog/');
    const data = asRecord(raw);
    const productsRaw = Array.isArray(data.products) ? data.products : [];
    const promotedRaw = Array.isArray(data.promoted_products) ? data.promoted_products : [];

    return {
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
    const productsRaw = Array.isArray(data.products) ? data.products : [];

    return {
      category: normalizeCategory(rawCategory),
      products: productsRaw.map((item) => normalizeProduct(item as Record<string, unknown>)),
    };
  },

  getFavorites: async (): Promise<Favorite[]> => {
    const data = await request<unknown[]>('/favorites/');
    return (Array.isArray(data) ? data : []).map((item) =>
      normalizeFavorite(item as Record<string, unknown>)
    );
  },

  toggleFavorite: async (payload: { user: string; product: string }): Promise<Favorite[]> => {
    const data = await request<unknown>('/favorites/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (Array.isArray(data)) {
      return data.map((item) => normalizeFavorite(item as Record<string, unknown>));
    }

    if (data && typeof data === 'object') {
      return [normalizeFavorite(data as Record<string, unknown>)];
    }

    return [];
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
    user: string;
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

  checkout: async (
    items: CheckoutItemInput[]
  ): Promise<{ success: boolean; message: string }> => {
    const raw = await request<unknown>('/checkout/', {
      method: 'POST',
      body: JSON.stringify({
        items: items.map((item) => ({ product: item.id, quantity: item.quantity })),
      }),
    });
    const data = asRecord(raw);

    const message =
      typeof data.message === 'string' && data.message.trim()
        ? data.message
        : 'Order confirmed successfully.';

    return { success: true, message };
  },

  patchReview: async (
    reviewId: string,
    patch: Partial<Pick<Review, 'rating' | 'comment'>>
  ): Promise<Review> => {
    const raw = await request<unknown>(`/reviews/${reviewId}/`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    const data = asRecord(raw);
    return normalizeReview(data);
  },
};
