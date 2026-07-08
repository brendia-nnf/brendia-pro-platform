"use client";

import { useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Container, Card, Button } from "@/components/ui";
import { useCart } from "@/providers/CartProvider";
import { CheckCircle2, Package, ArrowRight, Home } from "lucide-react";

function SuccessContent() {
  const searchParams = useSearchParams();
  // Support both Monri (order_number) and legacy Stripe (session_id) params
  const orderNumber = searchParams.get("order_number");
  const sessionId = searchParams.get("session_id");
  const { clearCart } = useCart();

  // Display reference - prefer order_number
  const displayReference = orderNumber || sessionId;

  // Clear cart on successful payment
  useEffect(() => {
    if (orderNumber || sessionId) {
      clearCart();
    }
  }, [orderNumber, sessionId, clearCart]);

  return (
    <Container size="md">
      <Card variant="elevated" padding="lg" className="text-center py-12">
        {/* Success icon */}
        <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="h-12 w-12 text-success" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-heading font-semibold text-primary mb-3">
          Hvala na narudžbi!
        </h1>

        {/* Subtitle */}
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Vaša narudžba je uspješno zaprimljena. Potvrdu narudžbe poslali smo na
          vašu email adresu.
        </p>

        {/* Order info */}
        {displayReference && (
          <div className="bg-gray-50 rounded-lg p-4 mb-8">
            <p className="text-sm text-gray-500">Broj narudžbe:</p>
            <p className="font-mono text-lg font-semibold text-primary">
              {displayReference}
            </p>
          </div>
        )}

        {/* Next steps */}
        <div className="bg-cream rounded-xl p-6 mb-8 text-left">
          <h2 className="font-semibold text-primary mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-secondary" />
            Što slijedi?
          </h2>
          <ol className="space-y-3 text-sm text-gray-600">
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-secondary/10 text-secondary flex items-center justify-center flex-shrink-0 text-xs font-medium">
                1
              </span>
              <span>
                Primili smo vašu narudžbu i sada je obrađujemo.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-secondary/10 text-secondary flex items-center justify-center flex-shrink-0 text-xs font-medium">
                2
              </span>
              <span>
                Kada pošiljka krene, primit ćete email s brojem za praćenje.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-secondary/10 text-secondary flex items-center justify-center flex-shrink-0 text-xs font-medium">
                3
              </span>
              <span>
                Očekujte dostavu unutar 2-5 radnih dana.
              </span>
            </li>
          </ol>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/webshop">
            <Button variant="outline">
              <ArrowRight className="h-4 w-4 mr-2" />
              Nastavi kupovinu
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button>
              <Home className="h-4 w-4 mr-2" />
              Na nadzornu ploču
            </Button>
          </Link>
        </div>

        {/* Support */}
        <p className="text-sm text-gray-500 mt-8">
          Imate pitanja?{" "}
          <a
            href="mailto:podrska@brendiapro.hr"
            className="text-secondary hover:underline"
          >
            Kontaktirajte nas
          </a>
        </p>
      </Card>
    </Container>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <Container size="md">
          <Card variant="elevated" padding="lg" className="text-center py-12">
            <div className="animate-pulse space-y-4">
              <div className="w-20 h-20 rounded-full bg-gray-200 mx-auto" />
              <div className="h-8 bg-gray-200 rounded w-48 mx-auto" />
              <div className="h-4 bg-gray-200 rounded w-64 mx-auto" />
            </div>
          </Card>
        </Container>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
