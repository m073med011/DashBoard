"use client";

import { useState, useEffect, useCallback } from "react";
import Table from "@/components/tables/Table";
import Toast from "@/components/Toast";
// import Image from "next/image";
import { getData, deleteData } from "@/libs/axios/server";
import { AxiosHeaders } from "axios";
import { useRouter } from "next/navigation";
import {useLocale,useTranslations } from "next-intl";
import ImageWithFallback from "@/components/ImageWithFallback";
type User = {
  id: number;
  name: string;
  email: string;
  phone: string;
  cover: string | null;
  subscription: string;
  role: string;
};

type PropertyType = {
  id: number;
  title: string;
  cover: string | null;
};

// type ImageItem = {
//   id: number;
//   cover: string;
// };

type Location = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
};

type PropertyListing = {
  id: number;
  user: User;
  type: PropertyType;
  price: number;
  kitchen: number;
  title: string;
  description: string;
  slug: string;
  // property_listing_images: ImageItem[];
  cover:string;
  property_locations: Location[];
};

type ToastState = {
  message: string;
  type: "success" | "error" | "info";
  show: boolean;
};

export default function PropertyListingsPage() {
  const t =useTranslations("")
  const locale = useLocale();
  const [items, setItems] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastState>({ message: "", type: "info", show: false });
  const [token, setToken] = useState<string | null>(null);

  const router = useRouter();

  // Toast helper
  const showToast = useCallback((message: string, type: ToastState["type"] = "info") => {
    setToast({ message, type, show: true });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
  }, []);

  // Load token
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) setToken(storedToken);
    else showToast("Authentication token not found", "error");
  }, [showToast]);

  // Fetch property listings
  const fetchItems = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await getData("owner/property_listings", {}, new AxiosHeaders({ Authorization: `Bearer ${token}` , "lang": locale }));
      setItems(res.data ?? []);
    } catch (error) {
      console.error(error);
      showToast("Failed to fetch property listings", "error");
    } finally {
      setLoading(false);
    }
  }, [token, locale, showToast]);

  useEffect(() => {
    if (token) fetchItems();
  }, [token, fetchItems]);

  // Delete item handler
  const handleDelete = useCallback(
    async (item: PropertyListing) => {
      if (!token) return showToast("No auth token", "error");

      // if (!confirm(`Are you sure you want to delete "${item.title}"?`)) return;

      try {
        await deleteData(`owner/property_listings/${item.id}`, new AxiosHeaders({ Authorization: `Bearer ${token}` }));
        showToast("Property deleted successfully", "success");
        await fetchItems();
      } catch (error) {
        console.error(error);
        showToast("Failed to delete property", "error");
      }
    },
    [token, fetchItems, showToast]
  );

  // Navigate handlers
  const handleView = (item: PropertyListing) => router.push(`/properties/view/${item.id}`);
  // const handleEdit = (item: PropertyListing) => router.push(`/properties/edit/${item.id}`);

  return (
    <div className="p-6">
      {toast.show && <Toast message={toast.message} type={toast.type} duration={3000} />}


      {loading ? (
        <div className="flex justify-center items-center min-h-[200px]">{t("Loading")}</div>
      ) : (
        <Table<PropertyListing>
          data={items}
          columns={[
            { key: "title", label: "title" },
            {
              key: "user",
              label: "user",
              render: (item) => item.user?.name ?? "Unknown",
            },
            {
  key: "price",
  label: "price",
  render: (item) => (
    <>
    {item.price}
  <span className="font-bold px-1"> EGY</span>
  </>
),

},

            {
              key: "title",
              label: "images", 
              render: (item) =>
                item ? (
                  // <Image
                  //   src={item.cover}
                  //   alt={item.title}
                  //   width={100}
                  //   height={75}
                  //   className="rounded object-cover"
                  // />
                  <ImageWithFallback
  src={item.cover|| ''}
  alt="User Avatar"
  width={50}
  height={15}
  className="rounded-lg w-full object-cover"
/>
                ) : (
                  "No image"
                ),
            },
          ]}
          onCreatePage={()=>{}}
          onViewPage={handleView}
          // onEditPage={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
