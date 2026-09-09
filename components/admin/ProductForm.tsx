"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, Button, Input } from "@/components/ui";
import { ArrowLeft, Package, Plus, X, Upload, Loader2 } from "lucide-react";
import type { Product, ProductCategory, HairTexture } from "@/lib/types/webshop";
import {
  CATEGORY_LABELS,
  TEXTURE_LABELS,
  VARIANT_LENGTHS_CM,
  VARIANT_WEIGHTS_G,
  VARIANT_TEXTURES,
} from "@/lib/types/webshop";
import Link from "next/link";

interface ProductFormProps {
  product?: Product;
}

interface VariantRow {
  id?: string;
  lengthCm: number | null;
  weightG: number | null;
  texture: HairTexture | null;
  color: string | null;
  price: string;
  stockQuantity: string;
}

// Swatch/image are edited once per color and copied onto every combination row
interface ColorOption {
  name: string;
  hex: string;
  imageUrl: string;
}

const variantKey = (v: {
  lengthCm: number | null;
  weightG: number | null;
  texture: string | null;
  color: string | null;
}) => `${v.lengthCm ?? ""}|${v.weightG ?? ""}|${v.texture ?? ""}|${v.color ?? ""}`;

// Cjenik kose (duljina × gramaža) — predispuna za nove kombinacije
const DEFAULT_VARIANT_PRICES: Record<string, string> = {
  "40|50": "175",
  "40|60": "210",
  "50|50": "225",
  "50|60": "270",
  "60|50": "275",
  "60|60": "330",
};

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const isEditing = !!product;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: product?.name || "",
    slug: product?.slug || "",
    price: product?.price?.toString() || "",
    originalPrice: product?.originalPrice?.toString() || "",
    stockQuantity: product?.stockQuantity?.toString() || "0",
    inStock: product?.inStock ?? true,
    featured: product?.featured ?? false,
    category: product?.category || ("extensions" as ProductCategory),
    description: product?.description || "",
    images: product?.images || [],
    weightGrams: product?.weightGrams?.toString() || "",
    hasVariants: product?.hasVariants ?? false,
  });

  const initialVariants: VariantRow[] = (product?.variants || []).map((v) => ({
    id: v.id,
    lengthCm: v.lengthCm,
    weightG: v.weightG,
    texture: v.texture,
    color: v.color ?? null,
    price: v.price.toString(),
    stockQuantity: v.stockQuantity.toString(),
  }));

  const initialColorOptions: ColorOption[] = (() => {
    const byName = new Map<string, ColorOption>();
    for (const v of product?.variants || []) {
      if (v.color && !byName.has(v.color)) {
        byName.set(v.color, {
          name: v.color,
          hex: v.colorHex || "",
          imageUrl: v.imageUrl || "",
        });
      }
    }
    return [...byName.values()];
  })();

  const [variants, setVariants] = useState<VariantRow[]>(initialVariants);
  const [colorOptions, setColorOptions] =
    useState<ColorOption[]>(initialColorOptions);
  const [selectedLengths, setSelectedLengths] = useState<number[]>(() => [
    ...new Set(initialVariants.map((v) => v.lengthCm).filter((x): x is number => !!x)),
  ]);
  const [selectedWeights, setSelectedWeights] = useState<number[]>(() => [
    ...new Set(initialVariants.map((v) => v.weightG).filter((x): x is number => !!x)),
  ]);
  const [selectedTextures, setSelectedTextures] = useState<HairTexture[]>(() => [
    ...new Set(
      initialVariants.map((v) => v.texture).filter((x): x is HairTexture => !!x)
    ),
  ]);

  // Regenerate the combination matrix from the selected options, keeping the
  // price/stock of combinations that already exist
  const regenerateVariants = (
    lengths: number[],
    weights: number[],
    textures: HairTexture[],
    colors: string[]
  ) => {
    const dims = {
      lengths: lengths.length ? [...lengths].sort((a, b) => a - b) : [null],
      weights: weights.length ? [...weights].sort((a, b) => a - b) : [null],
      textures: textures.length
        ? VARIANT_TEXTURES.filter((t) => textures.includes(t))
        : [null],
      colors: colors.length ? colors : [null],
    };

    setVariants((prev) => {
      const byKey = new Map(prev.map((v) => [variantKey(v), v]));
      const pushed = new Set<string>();
      const next: VariantRow[] = [];
      for (const lengthCm of dims.lengths) {
        for (const weightG of dims.weights) {
          for (const texture of dims.textures) {
            for (const color of dims.colors) {
              if (!lengthCm && !weightG && !texture && !color) continue;
              const key = variantKey({ lengthCm, weightG, texture, color });
              if (pushed.has(key)) continue;
              pushed.add(key);
              const existing = byKey.get(key);
              next.push(
                existing || {
                  lengthCm,
                  weightG,
                  texture,
                  color,
                  price:
                    DEFAULT_VARIANT_PRICES[`${lengthCm}|${weightG}`] ||
                    form.price ||
                    "",
                  stockQuantity: "0",
                }
              );
            }
          }
        }
      }
      return next;
    });
  };

  const toggleDimension = <T,>(
    value: T,
    selected: T[],
    setSelected: (v: T[]) => void,
    dimension: "length" | "weight" | "texture"
  ) => {
    const next = selected.includes(value)
      ? selected.filter((x) => x !== value)
      : [...selected, value];
    setSelected(next);
    regenerateVariants(
      dimension === "length" ? (next as number[]) : selectedLengths,
      dimension === "weight" ? (next as number[]) : selectedWeights,
      dimension === "texture" ? (next as HairTexture[]) : selectedTextures,
      colorOptions.map((c) => c.name).filter(Boolean)
    );
  };

  const addColorOption = () => {
    setColorOptions((prev) => [...prev, { name: "", hex: "#8b5a3c", imageUrl: "" }]);
    // Combinations regenerate when the name is entered (empty names are ignored)
  };

  const removeColorOption = (index: number) => {
    const next = colorOptions.filter((_, i) => i !== index);
    setColorOptions(next);
    regenerateVariants(
      selectedLengths,
      selectedWeights,
      selectedTextures,
      next.map((c) => c.name).filter(Boolean)
    );
  };

  const updateColorOption = (
    index: number,
    field: keyof ColorOption,
    value: string
  ) => {
    const prevName = colorOptions[index]?.name;
    const next = colorOptions.map((c, i) =>
      i === index ? { ...c, [field]: value } : c
    );
    setColorOptions(next);

    if (field === "name") {
      // Rename in place so entered prices/stock survive the rename
      setVariants((rows) =>
        rows.map((r) => (r.color === prevName ? { ...r, color: value || null } : r))
      );
      regenerateVariants(
        selectedLengths,
        selectedWeights,
        selectedTextures,
        next.map((c) => c.name).filter(Boolean)
      );
    }
  };

  const updateVariantField = (
    index: number,
    field: "price" | "stockQuantity",
    value: string
  ) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
  };

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const colorFileInputRef = useRef<HTMLInputElement>(null);
  const [colorUploadIndex, setColorUploadIndex] = useState<number | null>(null);

  const handleColorImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    const index = colorUploadIndex;
    if (!file || index === null) return;

    setIsUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "products");
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Upload failed");
      }
      const data = await response.json();
      setColorOptions((prev) =>
        prev.map((c, i) => (i === index ? { ...c, imageUrl: data.url } : c))
      );
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
      setColorUploadIndex(null);
      if (colorFileInputRef.current) colorFileInputRef.current.value = "";
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[čć]/g, "c")
      .replace(/[šś]/g, "s")
      .replace(/ž/g, "z")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleNameChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      name: value,
      slug: isEditing ? prev.slug : generateSlug(value),
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "products");

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Upload failed");
        }

        const data = await response.json();
        setForm((prev) => ({
          ...prev,
          images: [...prev.images, data.url],
        }));
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.hasVariants) {
      if (variants.length === 0) {
        alert(
          "Odaberite barem jednu opciju (duljinu, gramažu, teksturu ili boju)."
        );
        return;
      }
      if (variants.some((v) => !v.price || Number(v.price) <= 0)) {
        alert("Svaka kombinacija mora imati cijenu.");
        return;
      }
      if (colorOptions.some((c) => !c.name.trim())) {
        alert("Svaka boja mora imati naziv (ili je uklonite).");
        return;
      }
      const colorNames = colorOptions.map((c) => c.name.trim().toLowerCase());
      if (new Set(colorNames).size !== colorNames.length) {
        alert("Dvije boje imaju isti naziv — svaka boja mora biti jedinstvena.");
        return;
      }
    }

    setIsSaving(true);

    // For variant products, the base price/stock are derived from the
    // combinations (base price = lowest, shown as "od X €" in the shop)
    const variantPrices = variants.map((v) => Number(v.price));
    const variantStockTotal = variants.reduce(
      (sum, v) => sum + (Number(v.stockQuantity) || 0),
      0
    );

    const productData = {
      name: form.name,
      slug: form.slug || generateSlug(form.name),
      description: form.description,
      price: form.hasVariants ? Math.min(...variantPrices) : Number(form.price),
      originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
      category: form.category,
      images: form.images,
      inStock: form.hasVariants ? variantStockTotal > 0 : form.inStock,
      stockQuantity: form.hasVariants
        ? variantStockTotal
        : Number(form.stockQuantity),
      featured: form.featured,
      weightGrams: form.weightGrams ? Number(form.weightGrams) : null,
      hasVariants: form.hasVariants,
      variants: form.hasVariants
        ? variants.map((v) => {
            const colorOption = v.color
              ? colorOptions.find((c) => c.name === v.color)
              : undefined;
            return {
              id: v.id,
              lengthCm: v.lengthCm,
              weightG: v.weightG,
              texture: v.texture,
              color: v.color?.trim() || null,
              colorHex: colorOption?.hex || null,
              imageUrl: colorOption?.imageUrl || null,
              price: Number(v.price),
              stockQuantity: Number(v.stockQuantity) || 0,
              inStock: (Number(v.stockQuantity) || 0) > 0,
            };
          })
        : [],
    };

    try {
      const url = isEditing ? `/api/products/${product.id}` : "/api/products";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save product");
      }

      router.push("/admin/proizvodi");
    } catch (error) {
      console.error("Save error:", error);
      alert(error instanceof Error ? error.message : "Failed to save product");
    } finally {
      setIsSaving(false);
    }
  };

  const formatPrice = (price: string) => {
    const num = parseFloat(price);
    if (isNaN(num)) return "0,00 €";
    return new Intl.NumberFormat("hr-HR", {
      style: "currency",
      currency: "EUR",
    }).format(num);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Back link */}
      <Link
        href="/admin/proizvodi"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-secondary transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Natrag na proizvode</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic info */}
          <Card padding="lg">
            <h2 className="text-lg font-semibold text-primary mb-4">
              Osnovni podaci
            </h2>
            <div className="space-y-4">
              <Input
                label="Naziv proizvoda"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Npr. Tape-In Ekstenzije - Smeđa"
                required
              />

              <Input
                label="URL slug"
                value={form.slug}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, slug: e.target.value }))
                }
                placeholder="tape-in-ekstenzije-smeda"
                hint="Automatski generiran iz naziva"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Opis
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary resize-none"
                  placeholder="Detaljan opis proizvoda..."
                  required
                />
              </div>
            </div>
          </Card>

          {/* Images */}
          <Card padding="lg">
            <h2 className="text-lg font-semibold text-primary mb-4">Slike</h2>

            {/* Current images */}
            {form.images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                {form.images.map((image, index) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group"
                  >
                    <Image
                      src={image}
                      alt={`Slika ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    {index === 0 && (
                      <span className="absolute bottom-2 left-2 text-xs bg-black/50 text-white px-2 py-1 rounded">
                        Glavna
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {form.images.length === 0 && (
              <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg mb-4">
                <div className="text-center text-gray-500">
                  <Package className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">Nema slika</p>
                </div>
              </div>
            )}

            {/* Upload image */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Učitavanje...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Učitaj slike
                </>
              )}
            </Button>
            {uploadError && (
              <p className="text-sm text-red-500 mt-2">{uploadError}</p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Podržani formati: JPEG, PNG, WebP, GIF. Maksimalna veličina: 5MB.
              Prva slika će biti prikazana kao glavna.
            </p>
          </Card>

          {/* Pricing */}
          <Card padding="lg">
            <h2 className="text-lg font-semibold text-primary mb-4">Cijena</h2>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Cijena (€)"
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, price: e.target.value }))
                }
                placeholder="99.99"
                required={!form.hasVariants}
                disabled={form.hasVariants}
                hint={
                  form.hasVariants
                    ? "Automatski: najniža cijena varijante (prikaz 'od X €')"
                    : undefined
                }
              />
              <Input
                label="Stara cijena (€)"
                type="number"
                step="0.01"
                min="0"
                value={form.originalPrice}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, originalPrice: e.target.value }))
                }
                placeholder="129.99"
                hint="Opcionalno - za prikaz popusta"
              />
            </div>
            {form.originalPrice && Number(form.originalPrice) > Number(form.price) && (
              <p className="mt-3 text-sm text-success">
                Popust:{" "}
                {Math.round(
                  ((Number(form.originalPrice) - Number(form.price)) /
                    Number(form.originalPrice)) *
                    100
                )}
                %
              </p>
            )}
          </Card>

          {/* Variants (hair options) */}
          <Card padding="lg">
            <h2 className="text-lg font-semibold text-primary mb-1">
              Varijante proizvoda
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Kupac bira duljinu, gramažu paketa, teksturu i/ili boju. Cijena i
              zaliha unose se za svaku kombinaciju.
            </p>

            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors mb-4">
              <input
                type="checkbox"
                checked={form.hasVariants}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, hasVariants: e.target.checked }))
                }
                className="h-4 w-4 rounded border-gray-300 text-secondary focus:ring-secondary"
              />
              <div>
                <p className="font-medium text-gray-700">
                  Ovaj proizvod ima varijante
                </p>
                <p className="text-xs text-gray-500">
                  Kupac mora odabrati kombinaciju prije dodavanja u košaricu
                </p>
              </div>
            </label>

            {form.hasVariants && (
              <div className="space-y-5">
                {/* Option pickers */}
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Duljina
                    </p>
                    <div className="space-y-2">
                      {VARIANT_LENGTHS_CM.map((len) => (
                        <label
                          key={len}
                          className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedLengths.includes(len)}
                            onChange={() =>
                              toggleDimension(
                                len,
                                selectedLengths,
                                setSelectedLengths,
                                "length"
                              )
                            }
                            className="h-4 w-4 rounded border-gray-300 text-secondary focus:ring-secondary"
                          />
                          {len} cm
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Gramaža paketa
                    </p>
                    <div className="space-y-2">
                      {VARIANT_WEIGHTS_G.map((w) => (
                        <label
                          key={w}
                          className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedWeights.includes(w)}
                            onChange={() =>
                              toggleDimension(
                                w,
                                selectedWeights,
                                setSelectedWeights,
                                "weight"
                              )
                            }
                            className="h-4 w-4 rounded border-gray-300 text-secondary focus:ring-secondary"
                          />
                          {w} g paket
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Tekstura
                    </p>
                    <div className="space-y-2">
                      {VARIANT_TEXTURES.map((tex) => (
                        <label
                          key={tex}
                          className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedTextures.includes(tex)}
                            onChange={() =>
                              toggleDimension(
                                tex,
                                selectedTextures,
                                setSelectedTextures,
                                "texture"
                              )
                            }
                            className="h-4 w-4 rounded border-gray-300 text-secondary focus:ring-secondary"
                          />
                          {TEXTURE_LABELS[tex]}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Colors */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700">Boje</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addColorOption}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Dodaj boju
                    </Button>
                  </div>
                  {colorOptions.length === 0 ? (
                    <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
                      Bez boja — proizvod nema izbor boje. Dodajte boju pa joj
                      odredite nijansu (krug u boji) i/ili učitajte sliku te
                      varijante.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {colorOptions.map((color, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 border border-gray-200 rounded-lg p-2.5"
                        >
                          <input
                            type="color"
                            value={color.hex || "#8b5a3c"}
                            onChange={(e) =>
                              updateColorOption(index, "hex", e.target.value)
                            }
                            title="Nijansa za prikaz kupcu"
                            className="h-9 w-9 rounded-full border border-gray-300 cursor-pointer shrink-0 p-0.5"
                          />
                          <input
                            type="text"
                            value={color.name}
                            onChange={(e) =>
                              updateColorOption(index, "name", e.target.value)
                            }
                            placeholder='Naziv boje (npr. "Natural Black")'
                            className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                          />
                          {color.imageUrl ? (
                            <div className="relative w-9 h-9 rounded-lg overflow-hidden shrink-0 group/colorimg">
                              <Image
                                src={color.imageUrl}
                                alt={color.name || "Boja"}
                                fill
                                className="object-cover"
                                sizes="36px"
                              />
                              <button
                                type="button"
                                title="Ukloni sliku"
                                onClick={() =>
                                  updateColorOption(index, "imageUrl", "")
                                }
                                className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover/colorimg:opacity-100 transition-opacity flex items-center justify-center"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              title="Učitaj sliku ove boje (opcionalno)"
                              disabled={isUploading}
                              onClick={() => {
                                setColorUploadIndex(index);
                                colorFileInputRef.current?.click();
                              }}
                            >
                              {isUploading && colorUploadIndex === index ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Upload className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          <button
                            type="button"
                            title="Ukloni boju"
                            onClick={() => removeColorOption(index)}
                            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <p className="text-xs text-gray-500">
                        Slika boje je opcionalna — ako postoji, kupcu se
                        prikazuje umjesto kruga u boji i mijenja glavnu sliku
                        proizvoda pri odabiru.
                      </p>
                    </div>
                  )}
                  <input
                    ref={colorFileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleColorImageUpload}
                    className="hidden"
                  />
                </div>

                {/* Combination matrix */}
                {variants.length > 0 ? (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-4 py-2.5 font-medium text-gray-600">
                            Kombinacija
                          </th>
                          <th className="text-left px-4 py-2.5 font-medium text-gray-600 w-32">
                            Cijena (€)
                          </th>
                          <th className="text-left px-4 py-2.5 font-medium text-gray-600 w-28">
                            Zaliha
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {variants.map((v, index) => (
                          <tr
                            key={variantKey(v)}
                            className="border-t border-gray-100"
                          >
                            <td className="px-4 py-2 text-gray-700">
                              {[
                                v.lengthCm ? `${v.lengthCm} cm` : null,
                                v.weightG ? `${v.weightG} g` : null,
                                v.texture ? TEXTURE_LABELS[v.texture] : null,
                                v.color,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={v.price}
                                onChange={(e) =>
                                  updateVariantField(index, "price", e.target.value)
                                }
                                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                                placeholder="0.00"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="number"
                                min="0"
                                value={v.stockQuantity}
                                onChange={(e) =>
                                  updateVariantField(
                                    index,
                                    "stockQuantity",
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                                placeholder="0"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-4">
                    Označite opcije iznad — kombinacije će se automatski
                    generirati.
                  </p>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card padding="lg">
            <h2 className="text-lg font-semibold text-primary mb-4">Status</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Kategorija
                </label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      category: e.target.value as ProductCategory,
                    }))
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                >
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={form.inStock}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, inStock: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-gray-300 text-secondary focus:ring-secondary"
                />
                <div>
                  <p className="font-medium text-gray-700">Na skladištu</p>
                  <p className="text-xs text-gray-500">
                    Proizvod je dostupan za kupnju
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, featured: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-gray-300 text-secondary focus:ring-secondary"
                />
                <div>
                  <p className="font-medium text-gray-700">Istaknuti proizvod</p>
                  <p className="text-xs text-gray-500">
                    Prikaži na naslovnici webshopa
                  </p>
                </div>
              </label>
            </div>
          </Card>

          {/* Inventory */}
          <Card padding="lg">
            <h2 className="text-lg font-semibold text-primary mb-4">Zaliha</h2>
            <div className="space-y-4">
              {form.hasVariants ? (
                <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
                  Zaliha se vodi po kombinaciji — unesite je u tablici
                  varijanti.
                </p>
              ) : (
                <Input
                  label="Količina na skladištu"
                  type="number"
                  min="0"
                  value={form.stockQuantity}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, stockQuantity: e.target.value }))
                  }
                  placeholder="50"
                />
              )}
              <Input
                label="Težina proizvoda (g)"
                type="number"
                min="0"
                value={form.weightGrams}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, weightGrams: e.target.value }))
                }
                placeholder="150"
                hint="Težina jednog komada s pakiranjem — za budući izračun dostave"
              />
            </div>
          </Card>

          {/* Actions */}
          <Card padding="lg">
            <div className="space-y-3">
              <Button
                type="submit"
                className="w-full"
                size="lg"
                isLoading={isSaving}
              >
                {isEditing ? "Spremi promjene" : "Dodaj proizvod"}
              </Button>
              <Link href="/admin/proizvodi" className="block">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  Odustani
                </Button>
              </Link>
            </div>
          </Card>

          {/* Preview */}
          {form.name && (
            <Card padding="lg" className="bg-gray-50">
              <h2 className="text-sm font-medium text-gray-500 mb-3">
                Pregled
              </h2>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
                  {form.images[0] ? (
                    <Image
                      src={form.images[0]}
                      alt={form.name}
                      width={200}
                      height={200}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-12 w-12 text-gray-300" />
                    </div>
                  )}
                </div>
                <h3 className="font-medium text-primary text-sm line-clamp-2">
                  {form.name || "Naziv proizvoda"}
                </h3>
                <p className="text-lg font-semibold text-primary mt-1">
                  {formatPrice(form.price)}
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </form>
  );
}
