"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { Button } from "./Button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = "md",
  className,
}: ModalProps) {
  const sizes = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          "relative bg-white rounded-xl shadow-xl w-full mx-4 animate-slide-up",
          sizes[size],
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
      >
        {/* Header */}
        {(title || description) && (
          <div className="px-6 pt-6 pb-4 border-b border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                {title && (
                  <h2
                    id="modal-title"
                    className="text-xl font-semibold text-primary"
                  >
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="mt-1 text-sm text-gray-600">{description}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="p-1 -mr-1"
                aria-label="Zatvori"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className={cn("px-6 py-4", !title && !description && "pt-6")}>
          {children}
        </div>
      </div>
    </div>
  );
}

interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div
      className={cn(
        "px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3",
        className
      )}
    >
      {children}
    </div>
  );
}

export { Modal, ModalFooter };
