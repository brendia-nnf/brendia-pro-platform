"use client";

import { useMemo } from "react";
import type { Product, ProductVariant, HairTexture } from "@/lib/types/webshop";
import { TEXTURE_LABELS } from "@/lib/types/webshop";

export interface VariantSelection {
  lengthCm: number | null;
  weightG: number | null;
  texture: HairTexture | null;
}

interface VariantPickerProps {
  product: Product;
  selection: VariantSelection;
  onSelectionChange: (selection: VariantSelection) => void;
}

// Finds the variant matching a full selection, or undefined
export function findVariant(
  product: Product,
  selection: VariantSelection
): ProductVariant | undefined {
  return (product.variants || []).find(
    (v) =>
      (v.lengthCm ?? null) === selection.lengthCm &&
      (v.weightG ?? null) === selection.weightG &&
      (v.texture ?? null) === selection.texture
  );
}

// True when the user has picked a value for every dimension the product offers
export function isSelectionComplete(
  product: Product,
  selection: VariantSelection
): boolean {
  const variants = product.variants || [];
  const needsLength = variants.some((v) => v.lengthCm);
  const needsWeight = variants.some((v) => v.weightG);
  const needsTexture = variants.some((v) => v.texture);
  return (
    (!needsLength || selection.lengthCm !== null) &&
    (!needsWeight || selection.weightG !== null) &&
    (!needsTexture || selection.texture !== null)
  );
}

export function VariantPicker({
  product,
  selection,
  onSelectionChange,
}: VariantPickerProps) {
  const variants = useMemo(() => product.variants || [], [product.variants]);

  const lengths = useMemo(
    () =>
      [...new Set(variants.map((v) => v.lengthCm).filter((x): x is number => !!x))].sort(
        (a, b) => a - b
      ),
    [variants]
  );
  const weights = useMemo(
    () =>
      [...new Set(variants.map((v) => v.weightG).filter((x): x is number => !!x))].sort(
        (a, b) => a - b
      ),
    [variants]
  );
  const textures = useMemo(
    () => [
      ...new Set(
        variants.map((v) => v.texture).filter((x): x is HairTexture => !!x)
      ),
    ],
    [variants]
  );

  if (variants.length === 0) return null;

  const optionButton = (
    label: string,
    isSelected: boolean,
    onClick: () => void,
    key: string | number
  ) => (
    <button
      key={key}
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
        isSelected
          ? "border-secondary bg-secondary text-white"
          : "border-gray-300 text-gray-700 hover:border-secondary"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-4">
      {lengths.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-600 mb-2">Duljina</p>
          <div className="flex flex-wrap gap-2">
            {lengths.map((len) =>
              optionButton(
                `${len} cm`,
                selection.lengthCm === len,
                () => onSelectionChange({ ...selection, lengthCm: len }),
                len
              )
            )}
          </div>
        </div>
      )}

      {weights.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-600 mb-2">
            Gramaža paketa
          </p>
          <div className="flex flex-wrap gap-2">
            {weights.map((w) =>
              optionButton(
                `${w} g`,
                selection.weightG === w,
                () => onSelectionChange({ ...selection, weightG: w }),
                w
              )
            )}
          </div>
        </div>
      )}

      {textures.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-600 mb-2">Tekstura</p>
          <div className="flex flex-wrap gap-2">
            {textures.map((tex) =>
              optionButton(
                TEXTURE_LABELS[tex],
                selection.texture === tex,
                () => onSelectionChange({ ...selection, texture: tex }),
                tex
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
