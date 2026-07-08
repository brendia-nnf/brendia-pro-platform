"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, Badge, Button, Modal, ModalFooter } from "@/components/ui";
import { mockProducts } from "@/lib/mock-data";
import { Plus, Edit2, Trash2, Search, Package } from "lucide-react";
import type { Product, ProductCategory } from "@/lib/types/webshop";
import { CATEGORY_LABELS } from "@/lib/types/webshop";

const categoryVariants: Record<ProductCategory, "secondary" | "success" | "warning"> = {
  extensions: "secondary",
  tools: "success",
  care: "warning",
};

export function ProductsTable() {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | "all">("all");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("hr-HR", {
      style: "currency",
      currency: "EUR",
    }).format(price);
  };

  const handleDeleteClick = (product: Product) => {
    setSelectedProduct(product);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!selectedProduct) return;
    setProducts((prev) => prev.filter((p) => p.id !== selectedProduct.id));
    setDeleteModalOpen(false);
    setSelectedProduct(null);
  };

  const handleToggleStock = (productId: string) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, inStock: !p.inStock } : p
      )
    );
  };

  return (
    <>
      <Card padding="none">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="font-semibold text-primary">Proizvodi</h3>
            <p className="text-sm text-gray-500">
              {filteredProducts.length} proizvoda
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Pretraži proizvode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary w-full sm:w-64"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) =>
                setCategoryFilter(e.target.value as ProductCategory | "all")
              }
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
            >
              <option value="all">Sve kategorije</option>
              <option value="extensions">Ekstenzije</option>
              <option value="tools">Alati</option>
              <option value="care">Njega</option>
            </select>
            <Link href="/admin/proizvodi/novi">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novi proizvod
              </Button>
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                  Proizvod
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                  Kategorija
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                  Cijena
                </th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">
                  Zaliha
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
              {filteredProducts.map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-gray-50 hover:bg-gray-50"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                        {product.images[0] ? (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-primary line-clamp-1">
                          {product.name}
                        </p>
                        {product.featured && (
                          <Badge variant="secondary" size="sm">
                            Istaknuto
                          </Badge>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge
                      variant={categoryVariants[product.category]}
                      size="sm"
                    >
                      {CATEGORY_LABELS[product.category]}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div>
                      <p className="font-medium text-primary">
                        {formatPrice(product.price)}
                      </p>
                      {product.originalPrice && (
                        <p className="text-xs text-gray-400 line-through">
                          {formatPrice(product.originalPrice)}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`text-sm font-medium ${
                        product.stockQuantity > 10
                          ? "text-success"
                          : product.stockQuantity > 0
                            ? "text-warning"
                            : "text-error"
                      }`}
                    >
                      {product.stockQuantity}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge
                      variant={product.inStock ? "success" : "error"}
                      size="sm"
                    >
                      {product.inStock ? "Na skladištu" : "Nema"}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStock(product.id)}
                      >
                        {product.inStock ? "Sakrij" : "Prikaži"}
                      </Button>
                      <Link href={`/admin/proizvodi/${product.id}`}>
                        <Button variant="ghost" size="sm">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-error hover:text-error"
                        onClick={() => handleDeleteClick(product)}
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

        {filteredProducts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Nema proizvoda koji odgovaraju pretrazi.
          </div>
        )}
      </Card>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Obriši proizvod"
        size="sm"
      >
        <p className="text-gray-600">
          Jeste li sigurni da želite obrisati proizvod{" "}
          <strong>{selectedProduct?.name}</strong>? Ova radnja se ne može
          poništiti.
        </p>

        <ModalFooter>
          <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
            Odustani
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete}>
            Obriši
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
