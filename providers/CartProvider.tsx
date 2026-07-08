"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { Product, CartItem, CartState } from "@/lib/types/webshop";
import { SHIPPING_THRESHOLD, SHIPPING_COST } from "@/lib/types/webshop";

interface CartContextValue extends CartState {
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
  getSubtotal: () => number;
  getShipping: () => number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

interface CartProviderProps {
  children: ReactNode;
}

const CART_STORAGE_KEY = "brendia_cart";

export function CartProvider({ children }: CartProviderProps) {
  const [state, setState] = useState<CartState>({
    items: [],
    isLoading: true,
  });

  // Load cart from localStorage on mount
  useEffect(() => {
    const loadCart = () => {
      try {
        const storedCart = localStorage.getItem(CART_STORAGE_KEY);
        if (storedCart) {
          const items = JSON.parse(storedCart);
          setState({
            items,
            isLoading: false,
          });
        } else {
          setState({
            items: [],
            isLoading: false,
          });
        }
      } catch {
        setState({
          items: [],
          isLoading: false,
        });
      }
    };

    loadCart();
  }, []);

  // Persist cart to localStorage whenever items change
  useEffect(() => {
    if (!state.isLoading) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items));
    }
  }, [state.items, state.isLoading]);

  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    setState((prev) => {
      const existingItem = prev.items.find(
        (item) => item.product.id === product.id
      );

      if (existingItem) {
        // Update quantity if product already in cart
        return {
          ...prev,
          items: prev.items.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          ),
        };
      }

      // Add new item
      return {
        ...prev,
        items: [...prev.items, { product, quantity }],
      };
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.product.id !== productId),
    }));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }

    setState((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      ),
    }));
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setState((prev) => ({
      ...prev,
      items: [],
    }));
  }, []);

  const getSubtotal = useCallback(() => {
    return state.items.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );
  }, [state.items]);

  const getShipping = useCallback(() => {
    const subtotal = getSubtotal();
    return subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  }, [getSubtotal]);

  const getCartTotal = useCallback(() => {
    return getSubtotal() + getShipping();
  }, [getSubtotal, getShipping]);

  const getCartCount = useCallback(() => {
    return state.items.reduce((count, item) => count + item.quantity, 0);
  }, [state.items]);

  return (
    <CartContext.Provider
      value={{
        ...state,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount,
        getSubtotal,
        getShipping,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
