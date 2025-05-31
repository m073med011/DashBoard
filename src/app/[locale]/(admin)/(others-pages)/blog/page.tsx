"use client";

import { useEffect, useState, useCallback } from "react";
import Table from "@/components/tables/Table";
import ModalForm from "@/components/tables/ModalTableForm";
import { getData, postData, patchData, deleteData } from "@/libs/axios/server";
import { AxiosHeaders } from "axios";
import Image from "next/image";
import Toast from "@/components/Toast";

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
  const [items, setItems] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>({
    message: "",
    type: "info",
    show: false,
  });
  const [modalState, setModalState] = useState<{
    type: "create" | "edit" | "view" | "quick" | null;
    item?: Blog;
  }>({ type: null });

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type, show: true });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  }, []);

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
  }, [token]);  

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
      console.error("Failed to fetch blogs", error);
      showToast("Failed to fetch blogs", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

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
      showToast("Blog deleted successfully", "success");
    } catch {
      console.error("Delete failed");
      showToast("Failed to delete blog", "error");
    }
  }, [token, fetchItems, showToast]);

  const handleView = useCallback((item: Blog) => {
    setModalState({ type: "view", item });
    showToast("Blog loaded successfully", "success");
  }, [showToast]);

  const handleQuickView = useCallback((item: Blog) => {
    setModalState({ type: "quick", item });
    showToast("Opening quick view", "info");
  }, [showToast]);

  const handleCreate = useCallback(() => {
    setModalState({ type: "create" });
    showToast("Create form opened", "info");
  }, [showToast]);

  const handleSubmit = useCallback(async (formData: FormData) => {
    if (!token) {
      showToast("Authentication token not found", "error");
      return;
    }

    const payload = new FormData();
    payload.append("title", formData.get("title") as string);
    payload.append("description", formData.get("description") as string);
    payload.append("slug", formData.get("slug") as string);
    payload.append("user", formData.get("user") as string);

    if (formData.get("image")) {
      payload.append("image", formData.get("image") as File);
    }
    if (formData.get("cover")) {
      payload.append("cover", formData.get("cover") as File);
    }

    try {
      if (modalState.type === "create") {
        await postData("owner/blogs", payload, new AxiosHeaders({
          Authorization: `Bearer ${token}`,
        }));
        showToast("Blog created successfully", "success");
      } else if (modalState.type === "edit" && modalState.item) {
        await patchData(`owner/blogs/${modalState.item.id}`, payload, new AxiosHeaders({
          Authorization: `Bearer ${token}`,
        }));
        showToast("Blog updated successfully", "success");
      }

      await fetchItems(token);
      setModalState({ type: null });
    } catch {
      console.error("Save failed");
      showToast("Failed to save blog", "error");
    }
  }, [token, modalState, fetchItems, showToast]);

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
          onCreatePage={handleCreate}
          onDelete={handleDelete}
          onViewPage={handleView}
          onEditPage={handleQuickView}
        />
      )}

      <ModalForm
        open={!!modalState.type}
        title={
          modalState.type === "create"
            ? "Create Blog"
            : modalState.type === "edit"
            ? "Edit Blog"
            : "View Blog"
        }
        onClose={() => setModalState({ type: null })}
      >
        {modalState.type === "view" || modalState.type === "quick" ? (
          <div className="space-y-2">
            <p><strong>Title:</strong> {modalState.item?.title}</p>
            <div>
              <strong>Description:</strong>
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: modalState.item?.description ?? "" }}
              />
            </div>
            <p><strong>Slug:</strong> {modalState.item?.slug}</p>
            {modalState.item?.image && (
              <Image src={modalState.item.image} alt="Blog image" width={200} height={120} />
            )}
            {modalState.item?.cover && (
              <Image src={modalState.item.cover} alt="Blog cover" width={200} height={120} />
            )}
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleSubmit(formData);
            }}
            className="space-y-3"
          >
            <input
              type="text"
              name="title"
              placeholder="Title"
              defaultValue={modalState.item?.title ?? ""}
              className="w-full border p-2 rounded"
              required
            />
            <textarea
              name="description"
              placeholder="Description"
              defaultValue={modalState.item?.description ?? ""}
              className="w-full border p-2 rounded"
              required
            />
            <input
              type="text"
              name="slug"
              placeholder="Slug"
              defaultValue={modalState.item?.slug ?? ""}
              className="w-full border p-2 rounded"
              required
            />
            <input type="file" name="image" accept="image/*" className="w-full border p-2 rounded" />
            <input type="file" name="cover" accept="image/*" className="w-full border p-2 rounded" />
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
              Submit
            </button>
          </form>
        )}
      </ModalForm>
    </div>
  );
}
