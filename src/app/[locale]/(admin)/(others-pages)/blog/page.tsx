"use client";

import { useEffect, useState, useCallback } from "react";
import Table from "@/components/tables/Table";
import { getData, deleteData } from "@/libs/axios/server";
import { AxiosHeaders } from "axios";
import Image from "next/image";
import Toast from "@/components/Toast";
import { useTranslations } from "next-intl";

type Blog = {
  id: number;
  title: string;
  description: string;
  slug: string;
  image: string;
  cover: string;
  user: string;
};

type ToastState = {
  message: string;
  type: "success" | "error" | "info";
  show: boolean;
};

export default function BlogsPage() {
  const t = useTranslations("blogs");
  const [items, setItems] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>({
    message: "",
    type: "info",
    show: false,
  });


  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type, show: true });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  }, []);

  const fetchItems = useCallback(async (authToken: string) => {
    setLoading(true);
    try {
      const res = await getData("owner/blogs", {}, new AxiosHeaders({
        Authorization: `Bearer ${authToken}`,
      }));

      const rawData = res.data ?? [];
      const normalized: Blog[] = rawData.map((entry: { blog: Blog }) => {
        const blog = entry.blog;
        return {
          id: blog.id,
          title: blog.title,
          description: blog.description,
          slug: blog.slug,
          image: blog.image,
          cover: blog.cover,
          user: blog.user,
        };
      });

      setItems(normalized);
    } catch (error) {
      // console.error("Failed to fetch blogs", error);
      showToast(t("Failed to fetch blogs" + error), "error");
    } finally {
      setLoading(false);
    }
  }, [showToast, t]);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
    } else {
      console.error("Token not found in localStorage");
      showToast("Authentication token not found", "error");
    }
  }, [showToast]);

  useEffect(() => {
    if (token) fetchItems(token);
  }, [token, fetchItems]);

  const handleDelete = useCallback(async (item: Blog) => {
    if (!token) {
      showToast("Authentication token not found", "error");
      return;
    }

    try {
      await deleteData(`owner/blogs/${item.id}`, new AxiosHeaders({
        Authorization: `Bearer ${token}`,
      }));
      await fetchItems(token);
      showToast(t("Blog deleted successfully"), "success");
    } catch {
      // console.error("Delete failed");
      showToast(t("Failed to delete blog"), "error");
    }
  }, [token, fetchItems, showToast, t]);

 

  

  return (
    <div className="p-6">
      {toast.show && (
        <Toast message={toast.message} type={toast.type} duration={3000} />
      )}

      {loading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="loader">Loading...</div>
        </div>
      ) : (
        <Table<Blog>
          data={items}
          columns={[
            { key: "title", label: "Title" },
            { key: "user", label: "User" },
            {
              key: "image",
              label: "Image",
              render: (item) =>
                item.image && (
                  <Image src={item.image} alt="image" width={100} height={100} className="rounded object-cover" />
                ),
            },
            {
              key: "cover",
              label: "Cover",
              render: (item) =>
                item.cover && (
                  <Image src={item.cover} alt="cover" width={100} height={100} className="rounded object-cover" />
                ),
            },
            { key: "slug", label: "Slug" },
          ]}
          onCreatePage={()=>{}}
          onDelete={handleDelete}
          onViewPage={()=>{}}
          onEditPage={()=>{}}
        />
      )}

     
    </div>
  );
}
