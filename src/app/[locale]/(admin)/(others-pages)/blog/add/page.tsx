"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { useForm } from "react-hook-form";
import { EditorState, convertToRaw } from "draft-js";
import draftToHtml from "draftjs-to-html";
import type { ComponentType } from "react";
import type { EditorProps } from "react-draft-wysiwyg";
import { postData } from "@/libs/axios/server";
import { AxiosHeaders } from "axios";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Toast from "@/components/Toast";
const Editor = dynamic(() =>
  import("react-draft-wysiwyg").then((mod) => mod.Editor as ComponentType<EditorProps>),
  { ssr: false }
);

import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";

type FormInputs = {
  user_id: string;
  type_id: string;
  title_en: string;
  slug_en: string;
  title_ar: string;
  slug_ar: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  user: string;
  keywords: string;
};

type ToastState = {
  message: string;
  type: "success" | "error" | "info";
  show: boolean;
};

const CreateContentPage = () => {
  const t = useTranslations("blogs");
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInputs>();

  const [descriptionEn, setDescriptionEn] = useState(EditorState.createEmpty());
  const [descriptionAr, setDescriptionAr] = useState(EditorState.createEmpty());
  const [cover, setCover] = useState<File | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [toast, setToast] = useState<ToastState>({
    message: "",
    type: "success",
    show: false,
  });

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type, show: true });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  const onSubmit = async (data: FormInputs) => {
    const token = localStorage.getItem("token");
    if (!token) {
      showToast("Authentication token not found", "error");
      return;
    }

    const formData = new FormData();

    formData.append("user_id", data.user_id);
    formData.append("type_id", data.type_id);

    formData.append("title[en]", data.title_en);
    formData.append("slug[en]", data.slug_en);
    formData.append("title[ar]", data.title_ar);
    formData.append("slug[ar]", data.slug_ar);

    formData.append("meta_title[en]", data.meta_title);
    formData.append("meta_description[en]", data.meta_description);
    formData.append("meta_keywords[en]", data.meta_keywords);

    formData.append("user[en]", data.user);
    formData.append("keywords[en]", data.keywords);

    formData.append("meta_title[ar]", data.meta_title);
    formData.append("meta_description[ar]", data.meta_description);
    formData.append("meta_keywords[ar]", data.meta_keywords);
    formData.append("user[ar]", data.user);
    formData.append("keywords[ar]", data.keywords);

    if (cover) formData.append("cover", cover);
    if (image) formData.append("image", image);

    formData.append("description[en]", draftToHtml(convertToRaw(descriptionEn.getCurrentContent())));
    formData.append("description[ar]", draftToHtml(convertToRaw(descriptionAr.getCurrentContent())));

    try {
      await postData("owner/blogs", formData, new AxiosHeaders({ Authorization: `Bearer ${token}` }));
      showToast("Blog created successfully", "success");
      // goback to the previous page
      router.back();
    } catch (error) {
      console.error("Failed to create blog:", error);
      showToast("Failed to create blog", "error");
    }
  };

  const formFields: { name: keyof FormInputs; label: string }[] = [
    { name: "user_id", label: "User ID" },
    { name: "type_id", label: "Type ID" },
    { name: "title_en", label: "Title (EN)" },
    { name: "slug_en", label: "Slug (EN)" },
    { name: "title_ar", label: "Title (AR)" },
    { name: "slug_ar", label: "Slug (AR)" },
    { name: "meta_title", label: "Meta Title" },
    { name: "meta_description", label: "Meta Description" },
    { name: "meta_keywords", label: "Meta Keywords" },
    { name: "user", label: "User" },
    { name: "keywords", label: "Keywords" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6">
      {toast.show && <Toast message={toast.message} type={toast.type} duration={3000} />}
      <div className="max-w-5xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md p-8">
        <h1 className="text-3xl font-bold mb-6 text-center">{t("Create Content")}</h1>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {formFields.map(({ name, label }) => (
              <div key={name}>
                <label className="block mb-1 font-medium">{t(label)}</label>
                <input
                  {...register(name, { required: true })}
                  className="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring focus:ring-blue-400"
                />
                {errors[name] && (
                  <p className="text-red-500 text-sm mt-1">{t("This field is required")}</p>
                )}
              </div>
            ))}

            <div>
              <label className="block mb-1 font-medium">{t("Cover")}</label>
              <input
                type="file"
                onChange={(e) => setCover(e.target.files?.[0] || null)}
                className="w-full border px-4 py-2 rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-sm"
                required
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">{t("Image")}</label>
              <input
                type="file"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
                className="w-full border px-4 py-2 rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-sm"
                required
              />
            </div>
          </div>

          {/* Description EN */}
          <div className="mt-8">
            <label className="block mb-2 font-medium">{t("Description (EN)")}</label>
            <div className="border border-gray-300 dark:border-gray-600 rounded overflow-hidden">
              <Editor
                editorState={descriptionEn}
                onEditorStateChange={setDescriptionEn}
                wrapperClassName="editor-wrapper"
                editorClassName="p-4 bg-white dark:bg-gray-700 text-black dark:text-white min-h-[200px]"
                toolbarClassName="border-b bg-gray-100 dark:bg-gray-700"
                toolbar={{
                  options: ["inline", "list", "textAlign", "remove", "history"],
                }}
              />
            </div>
          </div>

          {/* Description AR */}
          <div className="mt-8">
            <label className="block mb-2 font-medium">{t("Description (AR)")}</label>
            <div className="border border-gray-300 dark:border-gray-600 rounded overflow-hidden">
              <Editor
                editorState={descriptionAr}
                onEditorStateChange={setDescriptionAr}
                wrapperClassName="editor-wrapper"
                editorClassName="p-4 bg-white dark:bg-gray-700 text-black dark:text-white min-h-[200px]"
                toolbarClassName="border-b bg-gray-100 dark:bg-gray-700"
                toolbar={{
                  options: ["inline", "list", "textAlign", "remove", "history"],
                }}
              />
            </div>
          </div>

          <div className="mt-10 flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded shadow-md transition"
            >
              {t("Submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateContentPage;
