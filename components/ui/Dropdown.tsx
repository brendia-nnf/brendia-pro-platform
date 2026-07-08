"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState, type ReactNode } from "react";

interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: "left" | "right";
  className?: string;
}

function Dropdown({ trigger, children, align = "left", className }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>

      {isOpen && (
        <div
          className={cn(
            "absolute z-50 mt-2 min-w-[200px] rounded-lg bg-white shadow-lg border border-gray-100 py-1 animate-slide-down",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

interface DropdownItemProps {
  children: ReactNode;
  onClick?: () => void;
  icon?: ReactNode;
  danger?: boolean;
  className?: string;
}

function DropdownItem({
  children,
  onClick,
  icon,
  danger = false,
  className,
}: DropdownItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors duration-150",
        danger
          ? "text-error hover:bg-red-50"
          : "text-gray-700 hover:bg-gray-50",
        className
      )}
    >
      {icon && <span className="text-gray-400">{icon}</span>}
      {children}
    </button>
  );
}

interface DropdownSeparatorProps {
  className?: string;
}

function DropdownSeparator({ className }: DropdownSeparatorProps) {
  return <div className={cn("my-1 h-px bg-gray-100", className)} />;
}

export { Dropdown, DropdownItem, DropdownSeparator };
