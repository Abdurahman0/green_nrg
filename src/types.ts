export interface User {
  id: string;
  username: string;
}

export interface CustomerProfile {
  id: string | null;
  full_name: string | null;
  phone: string | null;
  address: string | null;
}

export interface Profile {
  id: string;
  username: string;
  full_name: string;
}

export interface Category {
  id: string;
  name: string;
  code: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  /** Full category object (new API) */
  category?: Category;
  /** Backward-compat: category_name flat field (new API) */
  category_name?: string;
  /** Legacy flat field kept for backward compat */
  category__name?: string;
  description?: string;
  image_url?: string;
  primary_image_url?: string;
  is_promoted?: boolean;
  stock_quantity?: number;
  image_urls?: string[];
}

export interface Order {
  id: string;
  title: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | string;
  total_amount: number;
  created_at: string;
}

export interface Review {
  id: string;
  user: string;
  contract: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface Favorite {
  id: string;
  user: string;
  product: string;
  created_at: string;
}

export interface BootstrapData {
  user: User;
  customer: CustomerProfile | null;
  active_order: Order | null;
  order_history: Order[];
  favorites: string[];
  pending_reviews: Order[];
  payment_methods: string[];
}

export interface CatalogData {
  categories: Category[];
  brands: string[];
  products: Product[];
  promoted_products: Product[];
}

export interface CategoryDetail {
  category: Category;
  brands: string[];
  products: Product[];
}

export interface LocationPoint {
  latitude: number;
  longitude: number;
}

export interface CheckoutItemInput {
  id: string;
  quantity: number;
}

export interface CheckoutPayload {
  full_name?: string;
  phone?: string;
  fulfillment_method?: 'pickup' | 'delivery';
  address?: string;
  location?: LocationPoint;
  payment_method?: string;
  items: CheckoutItemInput[];
}

export interface CheckoutResult {
  contract_id: string;
  client_id: string;
  message: string;
}
