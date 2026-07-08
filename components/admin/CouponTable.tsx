"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, Badge, Button, Input, Modal, ModalFooter } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { Plus, Edit2, Trash2, Copy, Check, RefreshCw, Loader2 } from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  description?: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minimumOrder?: number;
  maximumDiscount?: number;
  usageLimit?: number;
  usageCount: number;
  onePerCustomer: boolean;
  startsAt: string;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
}

export function CouponTable() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    description: "",
    discountType: "percentage" as "percentage" | "fixed",
    discountValue: "",
    minimumOrder: "",
    usageLimit: "",
    expiresAt: "",
  });

  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/admin/coupons");
      if (!response.ok) {
        throw new Error("Failed to fetch coupons");
      }

      const data = await response.json();
      setCoupons(data.coupons || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggleActive = async (couponId: string, currentActive: boolean) => {
    setProcessing(couponId);
    try {
      const response = await fetch(`/api/admin/coupons/${couponId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update coupon");
      }

      await fetchCoupons();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update coupon");
    } finally {
      setProcessing(null);
    }
  };

  const handleCreateCoupon = async () => {
    if (!newCoupon.code || !newCoupon.discountValue) return;

    setProcessing("create");
    try {
      const response = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newCoupon.code,
          description: newCoupon.description || undefined,
          discountType: newCoupon.discountType,
          discountValue: Number(newCoupon.discountValue),
          minimumOrder: newCoupon.minimumOrder
            ? Number(newCoupon.minimumOrder) * 100
            : undefined,
          usageLimit: newCoupon.usageLimit
            ? Number(newCoupon.usageLimit)
            : undefined,
          expiresAt: newCoupon.expiresAt
            ? new Date(newCoupon.expiresAt).toISOString()
            : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create coupon");
      }

      setCreateModalOpen(false);
      setNewCoupon({
        code: "",
        description: "",
        discountType: "percentage",
        discountValue: "",
        minimumOrder: "",
        usageLimit: "",
        expiresAt: "",
      });
      await fetchCoupons();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create coupon");
    } finally {
      setProcessing(null);
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    if (!confirm("Jeste li sigurni da želite obrisati ovaj kupon?")) return;

    setProcessing(couponId);
    try {
      const response = await fetch(`/api/admin/coupons/${couponId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete coupon");
      }

      await fetchCoupons();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete coupon");
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-secondary" />
          <span className="ml-2 text-gray-500">Učitavanje...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-error mb-4">{error}</p>
          <Button onClick={fetchCoupons} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Pokušaj ponovo
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card padding="none">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-primary">Kuponi</h3>
            <p className="text-sm text-gray-500">
              Upravljajte promotivnim kodovima
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={fetchCoupons}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novi kupon
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                  Kod
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                  Popust
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                  Korištenja
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                  Ističe
                </th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">
                  Status
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                  Akcije
                </th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr
                  key={coupon.id}
                  className="border-b border-gray-50 hover:bg-gray-50"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                        {coupon.code}
                      </code>
                      <button
                        onClick={() => handleCopyCode(coupon.code)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        {copiedCode === coupon.code ? (
                          <Check className="h-4 w-4 text-success" />
                        ) : (
                          <Copy className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {coupon.discountType === "percentage"
                      ? `${coupon.discountValue}%`
                      : `${coupon.discountValue} €`}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {coupon.usageCount}
                    {coupon.usageLimit && ` / ${coupon.usageLimit}`}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {coupon.expiresAt ? formatDate(coupon.expiresAt) : "Nikad"}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge
                      variant={coupon.isActive ? "success" : "outline"}
                      size="sm"
                    >
                      {coupon.isActive ? "Aktivan" : "Neaktivan"}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(coupon.id, coupon.isActive)}
                        disabled={processing === coupon.id}
                      >
                        {processing === coupon.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : coupon.isActive ? (
                          "Deaktiviraj"
                        ) : (
                          "Aktiviraj"
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCoupon(coupon.id)}
                        disabled={processing === coupon.id}
                        className="text-error hover:text-error"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {coupons.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Nema kupona. Stvorite prvi kupon.
          </div>
        )}
      </Card>

      {/* Create coupon modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Novi kupon"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Kod kupona"
            value={newCoupon.code}
            onChange={(e) =>
              setNewCoupon((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
            }
            placeholder="SUMMER2024"
          />

          <Input
            label="Opis (opcionalno)"
            value={newCoupon.description}
            onChange={(e) =>
              setNewCoupon((prev) => ({ ...prev, description: e.target.value }))
            }
            placeholder="Ljetna promocija"
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Tip popusta
              </label>
              <select
                value={newCoupon.discountType}
                onChange={(e) =>
                  setNewCoupon((prev) => ({
                    ...prev,
                    discountType: e.target.value as "percentage" | "fixed",
                  }))
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
              >
                <option value="percentage">Postotak (%)</option>
                <option value="fixed">Fiksni iznos (€)</option>
              </select>
            </div>
            <Input
              label="Vrijednost"
              type="number"
              value={newCoupon.discountValue}
              onChange={(e) =>
                setNewCoupon((prev) => ({
                  ...prev,
                  discountValue: e.target.value,
                }))
              }
              placeholder="20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Minimalna narudžba (€)"
              type="number"
              value={newCoupon.minimumOrder}
              onChange={(e) =>
                setNewCoupon((prev) => ({
                  ...prev,
                  minimumOrder: e.target.value,
                }))
              }
              placeholder="50"
              hint="Ostavite prazno ako nema minimuma"
            />
            <Input
              label="Limit korištenja"
              type="number"
              value={newCoupon.usageLimit}
              onChange={(e) =>
                setNewCoupon((prev) => ({
                  ...prev,
                  usageLimit: e.target.value,
                }))
              }
              placeholder="100"
              hint="Ostavite prazno za neograničeno"
            />
          </div>

          <Input
            label="Datum isteka"
            type="date"
            value={newCoupon.expiresAt}
            onChange={(e) =>
              setNewCoupon((prev) => ({
                ...prev,
                expiresAt: e.target.value,
              }))
            }
          />
        </div>

        <ModalFooter>
          <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
            Odustani
          </Button>
          <Button
            onClick={handleCreateCoupon}
            disabled={!newCoupon.code || !newCoupon.discountValue || processing === "create"}
          >
            {processing === "create" ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Stvori kupon
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
