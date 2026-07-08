"use client";

import { useState } from "react";
import Image from "next/image";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center">
        <Package className="h-24 w-24 text-gray-300" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main image */}
      <div className="aspect-square relative bg-gray-50 rounded-xl overflow-hidden">
        <Image
          src={images[selectedIndex]}
          alt={`${productName} - slika ${selectedIndex + 1}`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-3">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "w-20 h-20 relative rounded-lg overflow-hidden border-2 transition-colors",
                selectedIndex === index
                  ? "border-secondary"
                  : "border-transparent hover:border-gray-300"
              )}
            >
              <Image
                src={image}
                alt={`${productName} - mala slika ${index + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
