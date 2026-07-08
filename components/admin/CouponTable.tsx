"use client";

import { useState } from "react";
import { Card, Badge, Button, Input, Modal, ModalFooter } from "@/components/ui";
import { mockCoupons } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { Plus, Edit2, Trash2, Copy, Check } from "lucide-react";
import type { Coupon } from "@/lib/types";

export function CouponTable() {
  const [coupons, setCoupons] = useState(mockCoupons);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    discountType: "percentage" as "percentage" | "fixed",
    discountValue: "",
    usageLimit: "",
    expiresAt: "",
  });

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggleActive = (couponId: string) => {
    setCoupons((prev) =>
      prev.map((c) =>
        c.id === couponId ? { ...c, isActive: !c.isActive } : c
      )
    );
  };

  const handleCreateCoupon = () => {
    const coupon: Coupon = {
      id: `coupon-${Date.now()}`,
      code: newCoupon.code.toUpperCase(),
      discountType: newCoupon.discountType,
      discountValue: Number(newCoupon.discountValue),
      usageLimit: newCoupon.usageLimit ? Number(newCoupon.usageLimit) : undefined,
      usageCount: 0,
      expiresAt: newCoupon.expiresAt ? new Date(newCoupon.expiresAt) : undefined,
      isActive: true,
      createdAt: new Date(),
    };
    setCoupons((prev) => [coupon, ...prev]);
    setCreateModalOpen(false);
    setNewCoupon({
      code: "",
      discountType: "percentage",
      discountValue: "",
      usageLimit: "",
      expiresAt: "",
    });
  };

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
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novi kupon
          </Button>
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
                        onClick={() => handleToggleActive(coupon.id)}
                      >
                        {coupon.isActive ? "Deaktiviraj" : "Aktiviraj"}
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
              setNewCoupon((prev) => ({ ...prev, code: e.target.value }))
            }
            placeholder="SUMMER2024"
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
        </div>

        <ModalFooter>
          <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
            Odustani
          </Button>
          <Button onClick={handleCreateCoupon} disabled={!newCoupon.code}>
            Stvori kupon
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
