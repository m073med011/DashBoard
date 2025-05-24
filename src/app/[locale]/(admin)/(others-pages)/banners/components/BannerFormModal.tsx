"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Banner } from "@/types/User";
import { postData, patchData } from "@/libs/axios/server";
import { AxiosHeaders } from "axios";

export default function BannerFormModal({
  onClose,
  onCreated,
  token,
  IsEdit,
  Banner
}: {
  onClose: () => void;
  onCreated: () => void;
  token: string | null;
  IsEdit: boolean;
  Banner: Banner; // Replace `any` with your actual Banner type
}) {
  const { register, handleSubmit, reset, setValue } = useForm<Banner>();

  useEffect(() => {
    if (IsEdit && Banner) {
      setValue("link", Banner.link);
      setValue("type", Banner.type);
      setValue("name_en", Banner.name_en || "");
      setValue("description_en", Banner.description_en || "");
      setValue("name_ar", Banner.name_ar || "");
      setValue("description_ar", Banner.description_ar || "");
    }
  }, [IsEdit, Banner, setValue]);

  const onSubmit = async (data: Banner) => {
    if (!token) return;

    const formData = new FormData();
    formData.append("link", data.link);
    formData.append("type", data.type);
    formData.append("name[en]", data.name_en);
    formData.append("description[en]", data.description_en);
    formData.append("name[ar]", data.name_ar);
    formData.append("description[ar]", data.description_ar);

    if (data.image_en?.[0]) formData.append("image[en]", data.image_en[0]);
    if (data.image_ar?.[0]) formData.append("image[ar]", data.image_ar[0]);

    try {
      if (IsEdit) {
        await patchData(`owner/banners/${Banner.id}`, formData, new AxiosHeaders({
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        }));
      } else {
        await postData("owner/banners", formData, new AxiosHeaders({
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        }));
      }

      reset();
      onClose();
      onCreated();
    } catch (error) {
      console.error(IsEdit ? "Edit failed" : "Create failed", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-400/50 flex items-center justify-center z-99999">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-xl">
        <h2 className="text-xl font-bold mb-4">{IsEdit ? "Edit Banner" : "Create Banner"}</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input {...register("link", { required: true })} placeholder="Link" className="w-full p-2 border dark:bg-gray-700 rounded" />
          <input {...register("type", { required: true })} placeholder="Type" className="w-full p-2 border dark:bg-gray-700 rounded" />
          <input {...register("name_en", { required: true })} placeholder="Name [EN]" className="w-full p-2 border dark:bg-gray-700 rounded" />
          <input {...register("description_en", { required: true })} placeholder="Description [EN]" className="w-full p-2 border dark:bg-gray-700 rounded" />
          <input {...register("name_ar", { required: true })} placeholder="Name [AR]" className="w-full p-2 border dark:bg-gray-700 rounded" />
          <input {...register("description_ar", { required: true })} placeholder="Description [AR]" className="w-full p-2 border dark:bg-gray-700 rounded" />
          <input type="file" {...register("image_en")} className="w-full" />
          <input type="file" {...register("image_ar")} className="w-full" />
          <div className="flex justify-between">
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
              {IsEdit ? "Update" : "Create"}
            </button>
            <button type="button" onClick={onClose} className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
