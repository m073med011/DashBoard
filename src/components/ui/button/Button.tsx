import React from "react";

type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "destructive" | "secondary";
  className?: string;
};

export default function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  className = "",
}: ButtonProps) {
  let variantClass = "";

  if (variant === "primary") {
    variantClass = "bg-blue-600 text-white hover:bg-blue-700";
  } else if (variant === "secondary") {
    variantClass = "bg-gray-200 text-black hover:bg-gray-300";
  } else if (variant === "destructive") {
    variantClass = "bg-red-600 text-white hover:bg-red-700";
  }

  return (
    <button
      type={type}
      onClick={onClick}
      className={`px-4 py-2 rounded-md font-semibold focus:outline-none transition ${variantClass} ${className}`}
    >
      {children}
    </button>
  );
}
