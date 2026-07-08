"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuantitySelectorProps {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
  className?: string;
}

export function QuantitySelector({
  quantity,
  onQuantityChange,
  min = 1,
  max = 99,
  size = "md",
  className,
}: QuantitySelectorProps) {
  const handleDecrement = () => {
    if (quantity > min) {
      onQuantityChange(quantity - 1);
    }
  };

  const handleIncrement = () => {
    if (quantity < max) {
      onQuantityChange(quantity + 1);
    }
  };

  const sizes = {
    sm: {
      container: "h-8",
      button: "w-8 h-8",
      icon: "h-3 w-3",
      text: "text-sm w-8",
    },
    md: {
      container: "h-10",
      button: "w-10 h-10",
      icon: "h-4 w-4",
      text: "text-base w-12",
    },
  };

  const sizeStyles = sizes[size];

  return (
    <div
      className={cn(
        "inline-flex items-center border border-gray-200 rounded-lg overflow-hidden",
        sizeStyles.container,
        className
      )}
    >
      <button
        type="button"
        onClick={handleDecrement}
        disabled={quantity <= min}
        className={cn(
          "flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
          sizeStyles.button
        )}
        aria-label="Smanji količinu"
      >
        <Minus className={sizeStyles.icon} />
      </button>
      <span
        className={cn(
          "text-center font-medium text-primary",
          sizeStyles.text
        )}
      >
        {quantity}
      </span>
      <button
        type="button"
        onClick={handleIncrement}
        disabled={quantity >= max}
        className={cn(
          "flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
          sizeStyles.button
        )}
        aria-label="Povećaj količinu"
      >
        <Plus className={sizeStyles.icon} />
      </button>
    </div>
  );
}
