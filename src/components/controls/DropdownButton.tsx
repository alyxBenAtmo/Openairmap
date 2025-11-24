import React from "react";
import { cn } from "../../lib/utils";

interface DropdownButtonProps {
  children: React.ReactNode;
  className?: string;
  variant?: "minimal" | "elegant" | "soft" | "modern";
}

// Variantes de style pour les boutons dropdown
const variants = {
  minimal: {
    base: "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm",
    icon: "text-gray-500",
  },
  elegant: {
    base: "bg-gradient-to-br from-gray-50 to-white border border-gray-200/60 text-gray-800 hover:from-gray-100 hover:to-gray-50 hover:border-gray-300 shadow-sm backdrop-blur-sm",
    icon: "text-gray-600",
  },
  soft: {
    base: "bg-[#f8f9fa] border border-gray-200 text-gray-800 hover:bg-[#eef1f3] hover:border-[#4271B3]/30 shadow-sm",
    icon: "text-gray-600",
  },
  modern: {
    base: "bg-white/80 backdrop-blur-md border border-gray-200/50 text-gray-800 hover:bg-white hover:border-[#4271B3]/40 hover:shadow-md transition-all duration-200 shadow-sm",
    icon: "text-gray-600",
  },
};

export const DropdownButton: React.FC<DropdownButtonProps> = ({
  children,
  className,
  variant = "elegant",
}) => {
  const variantStyles = variants[variant];

  return (
    <button
      type="button"
      className={cn(
        "relative rounded-lg px-3 py-2 text-left text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#4271B3]/20 focus:border-[#4271B3]",
        variantStyles.base,
        className
      )}
    >
      <span className="block truncate pr-6">{children}</span>
      <span
        className={cn(
          "absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none transition-transform duration-200",
          variantStyles.icon
        )}
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </span>
    </button>
  );
};

export default DropdownButton;

