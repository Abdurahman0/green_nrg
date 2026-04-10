export interface User {
  id: string;
  username: string;
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
  category__name?: string;
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
  categories_count: number;
  products_count: number;
}

export interface CatalogData {
  products: Product[];
  promoted_products: Product[];
}

export interface CategoryDetail {
  category: Category;
  products: Product[];
}
