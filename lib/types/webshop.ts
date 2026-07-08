export type ProductCategory = "extensions" | "tools" | "care";

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: ProductCategory;
  images: string[];
  inStock: boolean;
  stockQuantity: number;
  specifications?: Record<string, string>;
  featured?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  isLoading: boolean;
}

export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
  shippingAddress?: ShippingAddress;
  notes?: string;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Na čekanju",
  processing: "U obradi",
  shipped: "Poslano",
  delivered: "Dostavljeno",
  cancelled: "Otkazano",
};

export interface ShippingAddress {
  fullName: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
}

// Helper constants
export const SHIPPING_THRESHOLD = 100; // Free shipping over 100 EUR
export const SHIPPING_COST = 9.99;

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  extensions: "Ekstenzije",
  tools: "Alati",
  care: "Njega",
};
