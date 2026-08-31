export type ProductCategory = "extensions" | "tools" | "care";

export type HairTexture = "straight" | "wavy" | "curly";

export interface ProductVariant {
  id: string;
  lengthCm: number | null;
  weightG: number | null;
  texture: HairTexture | null;
  price: number; // in euros on the client
  stockQuantity: number;
  inStock: boolean;
}

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
  weightGrams?: number | null;
  hasVariants?: boolean;
  variants?: ProductVariant[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  // Snapshot of the chosen combination for variant products
  variant?: ProductVariant;
}

export const TEXTURE_LABELS: Record<HairTexture, string> = {
  straight: "Ravna",
  wavy: "Valovita",
  curly: "Kovrčava",
};

export const VARIANT_LENGTHS_CM = [40, 50, 60];
export const VARIANT_WEIGHTS_G = [50, 60];
export const VARIANT_TEXTURES: HairTexture[] = ["straight", "wavy", "curly"];

// "40 cm · 50 g · Ravna" — used in cart, orders and Monri order info
export function variantLabel(variant: {
  lengthCm: number | null;
  weightG: number | null;
  texture: HairTexture | null;
}): string {
  const parts: string[] = [];
  if (variant.lengthCm) parts.push(`${variant.lengthCm} cm`);
  if (variant.weightG) parts.push(`${variant.weightG} g`);
  if (variant.texture) parts.push(TEXTURE_LABELS[variant.texture]);
  return parts.join(" · ");
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
