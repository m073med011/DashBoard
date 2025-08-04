"use client";

import React, { useRef, useState } from "react";
import NextImage from "next/image";
import { useTranslations } from "next-intl";
import Toast from '@/components/Toast';

type ImageUploadFieldProps = {
  label: string;
  id: string;
  value: string | null;
  preview: string | null;
  onChange: (file: File | null) => void;
  required?: boolean;
  allowedSizes?: string;
  accept?: string;
  name?: string;
};

type ToastState = {
  message: string;
  type: "success" | "error" | "info";
  show: boolean;
};

const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  label,
  id,
  value,
  preview,
  onChange,
  required = false,
  allowedSizes,
  accept = "image/*",
  name,
}) => {
  const t = useTranslations("blogs");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<ToastState>({ message: "", type: "success", show: false });

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type, show: true });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 9000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;

    if (file && allowedSizes) {
      const img = new globalThis.Image();
      img.onload = () => {
        const [minWidth, minHeight] = allowedSizes.split("x").map(Number);

        if (img.width < minWidth || img.height < minHeight) {
          showToast(
            `Image must be at least ${minWidth}×${minHeight} pixels. Detected: ${img.width}×${img.height}`,
            "error"
          );
          // Reset input after validation failure
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
          return;
        }

        onChange(file);
        // Clean up the object URL after successful validation
        URL.revokeObjectURL(img.src);
      };

      img.onerror = () => {
        showToast("Invalid image file.", "error");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        URL.revokeObjectURL(img.src);
      };

      img.src = URL.createObjectURL(file);
    } else {
      onChange(file);
    }
  };

  const triggerFileInput = () => {
    // Don't reset the input here - let it handle naturally
    fileInputRef.current?.click();
  };


  const displaySrc = preview || value;
  const hasImage = !!displaySrc;

  return (
    <div>
      {toast.show && <Toast message={toast.message} type={toast.type} duration={9000} />}
      
      <label className="block mb-2 font-semibold text-gray-800 dark:text-gray-200">
        {t(label)} {required && <span className="text-red-500">*</span>}
      </label>

      {allowedSizes && (
        <p className="text-xs text-blue-500 mb-2">
          {`Minimum size: ${allowedSizes}`}
        </p>
      )}

      {hasImage ? (
        <div className="relative inline-block">
          <NextImage
            src={displaySrc!}
            alt={`${label} preview`}
            width={200}
            height={120}
            className="w-full h-32 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-600 shadow-sm"
          />
          {!preview && value && (
            <p className="text-xs text-gray-500 mt-1">{t("Current image")}</p>
          )}
          {/* Add button to change image when there's already one */}
          <div className="mt-2">
            <button
              type="button"
              onClick={triggerFileInput}
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              {t("Change image")}
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={triggerFileInput}
          className="w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors duration-200"
        >
          <svg
            className="w-8 h-8 text-gray-400 mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("Click to upload")}</p>
        </div>
      )}

      <input
        id={id}
        ref={fileInputRef}
        name={name}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        key={hasImage ? 'with-image' : 'without-image'} // Force re-render when image state changes
      />

      {!value && !preview && required && (
        <p className="text-xs text-gray-500 mt-1">{t("Required for new entries")}</p>
      )}
    </div>
  );
};

export default ImageUploadField;