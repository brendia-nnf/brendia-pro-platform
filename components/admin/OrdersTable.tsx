"use client";

import { useState } from "react";
import { Card, Badge, Button, Modal, ModalFooter } from "@/components/ui";
import { mockOrders } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { Eye, Package, Truck, CheckCircle, XCircle, Clock } from "lucide-react";
import type { Order, OrderStatus } from "@/lib/types/webshop";
import { ORDER_STATUS_LABELS } from "@/lib/types/webshop";

const statusIcons: Record<OrderStatus, React.ReactNode> = {
  pending: <Clock className="h-4 w-4" />,
  processing: <Package className="h-4 w-4" />,
  shipped: <Truck className="h-4 w-4" />,
  delivered: <CheckCircle className="h-4 w-4" />,
  cancelled: <XCircle className="h-4 w-4" />,
};

const statusVariants: Record<OrderStatus, "warning" | "secondary" | "success" | "error" | "outline"> = {
  pending: "warning",
  processing: "secondary",
  shipped: "secondary",
  delivered: "success",
  cancelled: "error",
};

export function OrdersTable() {
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const filteredOrders = orders.filter((order) => {
    if (statusFilter === "all") return true;
    return order.status === statusFilter;
  });

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, status: newStatus, updatedAt: new Date() } : o
      )
    );
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
      processing: "shipped",
      shipped: "delivered",
      delivered: null,
      cancelled: null,
    };
    return flow[currentStatus];
  };

  return (
    <>
      <Card padding="none">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="font-semibold text-primary">Narudžbe</h3>
            <p className="text-sm text-gray-500">
              {filteredOrders.length} narudžbi
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
              <option value="processing">U obradi</option>
              <option value="shipped">Poslano</option>
              <option value="delivered">Dostavljeno</option>
              <option value="cancelled">Otkazano</option>
            </select>
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
              {filteredOrders.map((order) => {
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
                        <p className="text-xs text-gray-500">
                          {order.items.length} artikala
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
                        {nextStatus && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusChange(order.id, nextStatus)}
                          >
                            {nextStatus === "processing" && "Obradi"}
                            {nextStatus === "shipped" && "Pošalji"}
                            {nextStatus === "delivered" && "Dostavljeno"}
                          </Button>
                        )}
                        {order.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-error hover:text-error"
                            onClick={() => handleStatusChange(order.id, "cancelled")}
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

        {filteredOrders.length === 0 && (
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
                <p className="text-sm text-gray-600 mt-1">
                  Tel: {selectedOrder.shippingAddress.phone}
                </p>
              </div>
            )}

            {/* Order items */}
            <div>
              <h4 className="font-medium text-primary mb-3">Artikli</h4>
              <div className="space-y-2">
                {selectedOrder.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">{item.product.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatPrice(item.product.price)} x {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-medium">
                      {formatPrice(item.product.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Order totals */}
            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Međuzbroj</span>
                <span>{formatPrice(selectedOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Dostava</span>
                <span>
                  {selectedOrder.shipping === 0
                    ? "Besplatno"
                    : formatPrice(selectedOrder.shipping)}
                </span>
              </div>
              <div className="flex justify-between font-semibold text-primary pt-2 border-t border-gray-200">
                <span>Ukupno</span>
                <span>{formatPrice(selectedOrder.total)}</span>
              </div>
            </div>

            {/* Notes */}
            {selectedOrder.notes && (
              <div className="bg-warning/10 rounded-lg p-4">
                <h4 className="font-medium text-warning mb-1">Napomena</h4>
                <p className="text-sm">{selectedOrder.notes}</p>
              </div>
            )}
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
