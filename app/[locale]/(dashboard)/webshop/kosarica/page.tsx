"use client";

import Link from "next/link";
import { Container, Card, Button } from "@/components/ui";
import { CartItem, CartSummary } from "@/components/webshop";
import { useCart } from "@/providers/CartProvider";
import { ArrowLeft, ShoppingBag, Trash2 } from "lucide-react";

export default function CartPage() {
  const { items, clearCart, isLoading } = useCart();

  if (isLoading) {
    return (
      <Container size="xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl" />
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container size="xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link
              href="/webshop"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-secondary transition-colors mb-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Nastavi kupovinu</span>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-secondary" />
              </div>
              <h1 className="text-3xl font-heading font-semibold text-primary">
                Košarica
              </h1>
            </div>
          </div>
          {items.length > 0 && (
            <Button
              variant="ghost"
              onClick={clearCart}
              className="text-gray-500 hover:text-error"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Isprazni košaricu
            </Button>
          )}
        </div>

        {items.length === 0 ? (
          <Card
            variant="outline"
            padding="lg"
            className="text-center py-16"
          >
            <ShoppingBag className="h-20 w-20 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-heading font-semibold text-primary mb-2">
              Vaša košarica je prazna
            </h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Pregledajte naš webshop i dodajte proizvode u košaricu.
            </p>
            <Link href="/webshop">
              <Button size="lg">Pregledaj proizvode</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart items */}
            <div className="lg:col-span-2">
              <Card variant="outline" padding="md">
                <div className="divide-y divide-gray-100">
                  {items.map((item) => (
                    <CartItem key={item.product.id} item={item} />
                  ))}
                </div>
              </Card>
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <CartSummary />
              </div>
            </div>
          </div>
        )}
      </div>
    </Container>
  );
}
