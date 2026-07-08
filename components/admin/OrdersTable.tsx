"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, Badge, Button, Modal, ModalFooter } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { Eye, Package, Truck, CheckCircle, XCircle, Clock, RefreshCw, Loader2 } from "lucide-react";

type OrderStatus = "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";

interface Order {
  id: string;
  type: "course" | "webshop";
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: number;
  currency: string;
  status: OrderStatus;
  createdAt: string;
  items?: unknown;
  shippingAddress?: {
    fullName: string;
    street: string;
    city: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
}

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Na čekanju",
  paid: "Plaćeno",
  processing: "U obradi",
  shipped: "Poslano",
  delivered: "Dostavljeno",
  cancelled: "Otkazano",
  refunded: "Povrat",
};

const statusIcons: Record<OrderStatus, React.ReactNode> = {
  pending: <Clock className="h-4 w-4" />,
  paid: <CheckCircle className="h-4 w-4" />,
  processing: <Package className="h-4 w-4" />,
  shipped: <Truck className="h-4 w-4" />,
  delivered: <CheckCircle className="h-4 w-4" />,
  cancelled: <XCircle className="h-4 w-4" />,
  refunded: <XCircle className="h-4 w-4" />,
};

const statusVariants: Record<OrderStatus, "warning" | "secondary" | "success" | "error" | "outline"> = {
  pending: "warning",
  paid: "success",
  processing: "secondary",
  shipped: "secondary",
  delivered: "success",
  cancelled: "error",
  refunded: "error",
};

export function OrdersTable() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({ type: "webshop" });
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }

      const response = await fetch(`/api/admin/orders?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }

      const data = await response.json();
      setOrders(data.orders || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setProcessing(orderId);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update order");
      }

      await fetchOrders();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update order");
    } finally {
      setProcessing(null);
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setDetailModalOpen(true);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("hr-HR", {
      style: "currency",
      currency: "EUR",
    }).format(price);
  };

  const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    const flow: Record<OrderStatus, OrderStatus | null> = {
      pending: "processing",
      paid: "processing",
      processing: "shipped",
      shipped: "delivered",
      delivered: null,
      cancelled: null,
      refunded: null,
    };
    return flow[currentStatus];
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
          <Button onClick={fetchOrders} variant="outline">
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
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="font-semibold text-primary">Narudžbe</h3>
            <p className="text-sm text-gray-500">
              {orders.length} narudžbi
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OrderStatus | "all")}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
            >
              <option value="all">Svi statusi</option>
              <option value="pending">Na čekanju</option>
              <option value="paid">Plaćeno</option>
              <option value="processing">U obradi</option>
              <option value="shipped">Poslano</option>
              <option value="delivered">Dostavljeno</option>
              <option value="cancelled">Otkazano</option>
            </select>
            <Button variant="ghost" size="sm" onClick={fetchOrders}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                  Narudžba
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                  Kupac
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                  Datum
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                  Iznos
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
              {orders.map((order) => {
                const nextStatus = getNextStatus(order.status);
                return (
                  <tr
                    key={order.id}
                    className="border-b border-gray-50 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-primary">
                          {order.orderNumber}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {order.type === "webshop" ? "Webshop" : "Tečaj"}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-sm font-medium text-primary">
                          {order.customerName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {order.customerEmail}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-primary text-right">
                      {formatPrice(order.total)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={statusVariants[order.status]} size="sm">
                        <span className="flex items-center gap-1">
                          {statusIcons[order.status]}
                          {ORDER_STATUS_LABELS[order.status]}
                        </span>
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewOrder(order)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {nextStatus && order.type === "webshop" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusChange(order.id, nextStatus)}
                            disabled={processing === order.id}
                          >
                            {processing === order.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                {nextStatus === "processing" && "Obradi"}
                                {nextStatus === "shipped" && "Pošalji"}
                                {nextStatus === "delivered" && "Dostavljeno"}
                              </>
                            )}
                          </Button>
                        )}
                        {(order.status === "pending" || order.status === "paid") && order.type === "webshop" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-error hover:text-error"
                            onClick={() => handleStatusChange(order.id, "cancelled")}
                            disabled={processing === order.id}
                          >
                            Otkaži
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {orders.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Nema narudžbi s odabranim statusom.
          </div>
        )}
      </Card>

      {/* Order detail modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={`Narudžba ${selectedOrder?.orderNumber}`}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-6">
            {/* Status */}
            <div className="flex items-center justify-between">
              <Badge variant={statusVariants[selectedOrder.status]}>
                <span className="flex items-center gap-1">
                  {statusIcons[selectedOrder.status]}
                  {ORDER_STATUS_LABELS[selectedOrder.status]}
                </span>
              </Badge>
              <span className="text-sm text-gray-500">
                {formatDate(selectedOrder.createdAt)}
              </span>
            </div>

            {/* Customer info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-primary mb-2">Kupac</h4>
              <p className="text-sm">{selectedOrder.customerName}</p>
              <p className="text-sm text-gray-600">{selectedOrder.customerEmail}</p>
            </div>

            {/* Shipping address */}
            {selectedOrder.shippingAddress && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-primary mb-2">Adresa dostave</h4>
                <p className="text-sm">{selectedOrder.shippingAddress.fullName}</p>
                <p className="text-sm text-gray-600">
                  {selectedOrder.shippingAddress.street}
                </p>
                <p className="text-sm text-gray-600">
                  {selectedOrder.shippingAddress.postalCode} {selectedOrder.shippingAddress.city}
                </p>
                <p className="text-sm text-gray-600">
                  {selectedOrder.shippingAddress.country}
                </p>
                {selectedOrder.shippingAddress.phone && (
                  <p className="text-sm text-gray-600 mt-1">
                    Tel: {selectedOrder.shippingAddress.phone}
                  </p>
                )}
              </div>
            )}

            {/* Order total */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between font-semibold text-primary">
                <span>Ukupno</span>
                <span>{formatPrice(selectedOrder.total)}</span>
              </div>
            </div>
          </div>
        )}

        <ModalFooter>
          <Button variant="outline" onClick={() => setDetailModalOpen(false)}>
            Zatvori
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
