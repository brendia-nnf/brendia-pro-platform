"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Container, Card, Button, Input } from "@/components/ui";
import { CartItem, CartSummary } from "@/components/webshop";
import { useCart } from "@/providers/CartProvider";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, CreditCard, Lock, ShoppingBag } from "lucide-react";

interface ShippingForm {
  fullName: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
  notes: string;
}

interface FormErrors {
  fullName?: string;
  street?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  email?: string;
}

interface MonriFormData {
  authenticity_token: string;
  order_number: string;
  amount: string;
  currency: string;
  digest: string;
  transaction_type: string;
  success_url: string;
  cancel_url: string;
  callback_url: string;
  ch_full_name: string;
  ch_email: string;
  ch_phone: string;
  ch_address: string;
  ch_city: string;
  ch_zip: string;
  ch_country: string;
  language?: string;
  order_info?: string;
  custom_data?: string;
}

const COUNTRY_OPTIONS = [
  { value: "HR", label: "Hrvatska" },
  { value: "SI", label: "Slovenija" },
  { value: "BA", label: "Bosna i Hercegovina" },
  { value: "RS", label: "Srbija" },
  { value: "ME", label: "Crna Gora" },
  { value: "MK", label: "Sjeverna Makedonija" },
  { value: "AT", label: "Austrija" },
  { value: "DE", label: "Njemačka" },
];

export default function CheckoutPage() {
  const { items, isLoading: cartLoading, getSubtotal } = useCart();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const monriFormRef = useRef<HTMLFormElement>(null);
  const [monriData, setMonriData] = useState<{
    formUrl: string;
    formData: MonriFormData;
  } | null>(null);

  const [shippingForm, setShippingForm] = useState<ShippingForm>({
    fullName: "",
    street: "",
    city: "",
    postalCode: "",
    country: "HR",
    phone: "",
    email: "",
    notes: "",
  });

  // Pre-fill form with user data when available
  useEffect(() => {
    if (user) {
      setShippingForm((prev) => ({
        ...prev,
        fullName: user.fullName || prev.fullName,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
      }));
    }
  }, [user]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!shippingForm.fullName || shippingForm.fullName.length < 2) {
      newErrors.fullName = "Unesite puno ime i prezime";
    }

    if (!shippingForm.street) {
      newErrors.street = "Unesite adresu";
    }

    if (!shippingForm.city) {
      newErrors.city = "Unesite grad";
    }

    if (!shippingForm.postalCode) {
      newErrors.postalCode = "Unesite poštanski broj";
    }

    if (!shippingForm.country) {
      newErrors.country = "Odaberite državu";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!shippingForm.email || !emailRegex.test(shippingForm.email)) {
      newErrors.email = "Unesite ispravnu email adresu";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setShippingForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleCheckout = async () => {
    if (!validateForm()) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch("/api/monri/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items,
          customerName: shippingForm.fullName,
          customerEmail: shippingForm.email,
          customerPhone: shippingForm.phone,
          shippingFullName: shippingForm.fullName,
          shippingStreet: shippingForm.street,
          shippingCity: shippingForm.city,
          shippingPostalCode: shippingForm.postalCode,
          shippingCountry: shippingForm.country,
          shippingPhone: shippingForm.phone,
          customerNotes: shippingForm.notes || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Došlo je do greške");
      }

      // Set Monri form data and submit
      if (data.formUrl && data.formData) {
        setMonriData({
          formUrl: data.formUrl,
          formData: data.formData,
        });

        // Wait for state update, then submit the hidden form
        setTimeout(() => {
          monriFormRef.current?.submit();
        }, 100);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Došlo je do greške");
      setIsProcessing(false);
    }
  };

  if (cartLoading) {
    return (
      <Container size="xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 h-96 bg-gray-200 rounded-xl" />
            <div className="h-64 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </Container>
    );
  }

  if (items.length === 0) {
    return (
      <Container size="xl">
        <Card variant="outline" padding="lg" className="text-center py-16">
          <ShoppingBag className="h-20 w-20 text-gray-300 mx-auto mb-6" />
          <h2 className="text-2xl font-heading font-semibold text-primary mb-2">
            Vaša košarica je prazna
          </h2>
          <p className="text-gray-500 mb-8">
            Dodajte proizvode u košaricu prije nastavka na plaćanje.
          </p>
          <Link href="/webshop">
            <Button size="lg">Pregledaj proizvode</Button>
          </Link>
        </Card>
      </Container>
    );
  }

  return (
    <Container size="xl">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <Link
            href="/webshop/kosarica"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-secondary transition-colors mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Natrag na košaricu</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-secondary" />
            </div>
            <h1 className="text-3xl font-heading font-semibold text-primary">
              Blagajna
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order review */}
            <Card variant="outline" padding="lg">
              <h2 className="text-lg font-semibold text-primary mb-4">
                Pregled narudžbe
              </h2>
              <div className="divide-y divide-gray-100">
                {items.map((item) => (
                  <CartItem key={item.product.id} item={item} compact />
                ))}
              </div>
            </Card>

            {/* Shipping address form */}
            <Card variant="outline" padding="lg">
              <h2 className="text-lg font-semibold text-primary mb-4">
                Podaci za dostavu
              </h2>
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Input
                      label="Ime i prezime *"
                      name="fullName"
                      value={shippingForm.fullName}
                      onChange={handleInputChange}
                      placeholder="Ivan Horvat"
                      error={errors.fullName}
                    />
                  </div>
                  <Input
                    label="Email *"
                    name="email"
                    type="email"
                    value={shippingForm.email}
                    onChange={handleInputChange}
                    placeholder="ivan@email.com"
                    error={errors.email}
                  />
                  <Input
                    label="Telefon"
                    name="phone"
                    type="tel"
                    value={shippingForm.phone}
                    onChange={handleInputChange}
                    placeholder="+385 91 234 5678"
                  />
                </div>

                <Input
                  label="Adresa *"
                  name="street"
                  value={shippingForm.street}
                  onChange={handleInputChange}
                  placeholder="Ulica i broj"
                  error={errors.street}
                />

                <div className="grid sm:grid-cols-3 gap-4">
                  <Input
                    label="Grad *"
                    name="city"
                    value={shippingForm.city}
                    onChange={handleInputChange}
                    placeholder="Zagreb"
                    error={errors.city}
                  />
                  <Input
                    label="Poštanski broj *"
                    name="postalCode"
                    value={shippingForm.postalCode}
                    onChange={handleInputChange}
                    placeholder="10000"
                    error={errors.postalCode}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Država *
                    </label>
                    <select
                      name="country"
                      value={shippingForm.country}
                      onChange={handleInputChange}
                      className="w-full h-11 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
                    >
                      {COUNTRY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {errors.country && (
                      <p className="text-sm text-error mt-1">{errors.country}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Napomena (opcionalno)
                  </label>
                  <textarea
                    name="notes"
                    value={shippingForm.notes}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary resize-none"
                    placeholder="Posebne upute za dostavu..."
                  />
                </div>
              </div>
            </Card>

            {/* Error message */}
            {error && (
              <Card variant="outline" padding="md" className="border-error/50 bg-error/5">
                <p className="text-error text-sm">{error}</p>
              </Card>
            )}

            {/* Payment button */}
            <Button
              onClick={handleCheckout}
              isLoading={isProcessing}
              disabled={isProcessing}
              size="lg"
              className="w-full"
            >
              <Lock className="h-4 w-4 mr-2" />
              Nastavi na sigurno plaćanje
            </Button>

            {/* Trust info */}
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Lock className="h-4 w-4" />
              <span>Plaćanje je sigurno i zaštićeno putem Monri</span>
            </div>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <CartSummary showCheckoutButton={false} />
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Monri Form */}
      {monriData && (
        <form
          ref={monriFormRef}
          method="POST"
          action={monriData.formUrl}
          style={{ display: "none" }}
        >
          <input type="hidden" name="authenticity_token" value={monriData.formData.authenticity_token} />
          <input type="hidden" name="order_number" value={monriData.formData.order_number} />
          <input type="hidden" name="amount" value={monriData.formData.amount} />
          <input type="hidden" name="currency" value={monriData.formData.currency} />
          <input type="hidden" name="digest" value={monriData.formData.digest} />
          <input type="hidden" name="transaction_type" value={monriData.formData.transaction_type} />
          <input type="hidden" name="success_url" value={monriData.formData.success_url} />
          <input type="hidden" name="cancel_url" value={monriData.formData.cancel_url} />
          <input type="hidden" name="callback_url" value={monriData.formData.callback_url} />
          <input type="hidden" name="ch_full_name" value={monriData.formData.ch_full_name} />
          <input type="hidden" name="ch_email" value={monriData.formData.ch_email} />
          <input type="hidden" name="ch_phone" value={monriData.formData.ch_phone} />
          <input type="hidden" name="ch_address" value={monriData.formData.ch_address} />
          <input type="hidden" name="ch_city" value={monriData.formData.ch_city} />
          <input type="hidden" name="ch_zip" value={monriData.formData.ch_zip} />
          <input type="hidden" name="ch_country" value={monriData.formData.ch_country} />
          {monriData.formData.language && (
            <input type="hidden" name="language" value={monriData.formData.language} />
          )}
          {monriData.formData.order_info && (
            <input type="hidden" name="order_info" value={monriData.formData.order_info} />
          )}
          {monriData.formData.custom_data && (
            <input type="hidden" name="custom_data" value={monriData.formData.custom_data} />
          )}
        </form>
      )}
    </Container>
  );
}
