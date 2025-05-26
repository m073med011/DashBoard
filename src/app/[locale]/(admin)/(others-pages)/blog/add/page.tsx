"use client";

import React, { useState, ChangeEvent } from "react";
import dynamic from "next/dynamic";
import { EditorState, convertToRaw } from "draft-js";
import type { ComponentType } from "react";
import type { EditorProps } from "react-draft-wysiwyg";
import { postData } from "@/libs/axios/server";
import { AxiosHeaders } from "axios";
import { useRouter } from "next/navigation";

const Editor = dynamic(() =>
  import("react-draft-wysiwyg").then((mod) => mod.Editor as ComponentType<EditorProps>),
  { ssr: false }
);

import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";

// Define the shape of your form
type FormDataState = {
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

const CreateContentPage = () => {
  const router = useRouter();
  const [form, setForm] = useState<FormDataState>({
    user_id: "",
    type_id: "",
    title_en: "",
    slug_en: "",
    title_ar: "",
    slug_ar: "",
    meta_title: "",
    meta_description: "",
    meta_keywords: "",
    user: "",
    keywords: "",
  });

  const [descriptionEn, setDescriptionEn] = useState(EditorState.createEmpty());
  const [descriptionAr, setDescriptionAr] = useState(EditorState.createEmpty());
  const [cover, setCover] = useState<File | null>(null);
  const [image, setImage] = useState<File | null>(null);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("Token not found in localStorage");
      return;
    }
  
    const formData = new FormData();
  
    // Non-nested fields
    formData.append("user_id", form.user_id);
    formData.append("type_id", form.type_id);
  
    // Multilingual & meta fields (use correct nesting)
    formData.append("title[en]", form.title_en);
    formData.append("slug[en]", form.slug_en);
    formData.append("title[ar]", form.title_ar);
    formData.append("slug[ar]", form.slug_ar);
  
    formData.append("meta_title[en]", form.meta_title);
    formData.append("meta_description[en]", form.meta_description);
    formData.append("meta_keywords[en]", form.meta_keywords);
  
    formData.append("user[en]", form.user);         // if you still need this
    formData.append("keywords[en]", form.keywords); // same here
  
    // If you're sending the same values for Arabic as well:
    formData.append("meta_title[ar]", form.meta_title);
    formData.append("meta_description[ar]", form.meta_description);
    formData.append("meta_keywords[ar]", form.meta_keywords);
    formData.append("user[ar]", form.user);
    formData.append("keywords[ar]", form.keywords);
  
    // Files
    if (cover) formData.append("cover", cover);
    if (image) formData.append("image", image);
  
    // Descriptions
    formData.append(
      "description[en]",
      JSON.stringify(convertToRaw(descriptionEn.getCurrentContent()))
    );
    formData.append(
      "description[ar]",
      JSON.stringify(convertToRaw(descriptionAr.getCurrentContent()))
    );
  
    try {
      const res = await postData("owner/blogs", formData, new AxiosHeaders({
        Authorization: `Bearer ${token}`,
      }));
      console.log("Blog created successfully:", res);
      // go back
      router.back();
    } catch (error) {
      console.error("Failed to create blog:", error);
    }
  };
  

  const formFields: [keyof FormDataState, string][] = [
    ["user_id", "User ID"],
    ["type_id", "Type ID"],
    ["title_en", "Title (EN)"],
    ["slug_en", "Slug (EN)"],
    ["title_ar", "Title (AR)"],
    ["slug_ar", "Slug (AR)"],
    ["meta_title", "Meta Title"],
    ["meta_description", "Meta Description"],
    ["meta_keywords", "Meta Keywords"],
    ["user", "User"],
    ["keywords", "Keywords"],
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6">
      <div className="max-w-5xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md p-8">
        <h1 className="text-3xl font-bold mb-6 text-center">📝 Create Content</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {formFields.map(([name, label]) => (
            <div key={name}>
              <label className="block mb-1 font-medium">{label}</label>
              <input
                name={name}
                value={form[name]}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring focus:ring-blue-400"
              />
            </div>
          ))}

          <div>
            <label className="block mb-1 font-medium">Cover</label>
            <input
              type="file"
              onChange={(e) => setCover(e.target.files?.[0] || null)}
              className="w-full border px-4 py-2 rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-sm"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Image</label>
            <input
              type="file"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
              className="w-full border px-4 py-2 rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-sm"
            />
          </div>
        </div>

        {/* English Description */}
        <div className="mt-8">
          <label className="block mb-2 font-medium">Description (EN)</label>
          <div className="border border-gray-300 dark:border-gray-600 rounded overflow-hidden">
            <Editor
              editorState={descriptionEn}
              onEditorStateChange={setDescriptionEn}
              wrapperClassName="editor-wrapper"
              editorClassName="p-4 bg-white dark:bg-gray-700 text-black dark:text-white min-h-[200px]"
              toolbarClassName="border-b bg-gray-100 dark:bg-gray-700"
              toolbar={{
                options: [
                  "inline",
                  // "blockType",
                  "list",
                  "textAlign",
                  // "link",
                  // "image",
                  "remove",
                  "history",
                ],
                // inline: {
                //   options: ["bold", "italic", "underline", "strikethrough"],
                // },
                // link: {
                //   options: ["link", "unlink"],
                //   defaultTargetOption: "_blank",
                // },
              }}
            />
          </div>
        </div>

        {/* Arabic Description */}
        <div className="mt-8">
          <label className="block mb-2 font-medium">Description (AR)</label>
          <div className="border border-gray-300 dark:border-gray-600 rounded overflow-hidden">
            <Editor
              editorState={descriptionAr}
              onEditorStateChange={setDescriptionAr}
              wrapperClassName="editor-wrapper"
              editorClassName="p-4 bg-white dark:bg-gray-700 text-black dark:text-white min-h-[200px]"
              toolbarClassName="border-b bg-gray-100 dark:bg-gray-700"
              toolbar={{
                options: [
                  "inline",
                  // "blockType",
                  "list",
                  "textAlign",
                  // "link",
                  // "image",
                  "remove",
                  "history",
                ],
                // inline: {
                //   options: ["bold", "italic", "underline", "strikethrough"],
                // },
                // image: {
                //   uploadEnabled: true,
                //   // uploadCallback: (file) =>
                //   //   new Promise((resolve, reject) => {
                //   //     const reader = new FileReader();
                //   //     reader.onload = () =>
                //   //       resolve({ data: { link: reader.result as string } });
                //   //     reader.onerror = reject;
                //   //     reader.readAsDataURL(file);
                //   //   }),
                //   previewImage: true,
                // },
                // link: {
                //   options: ["link", "unlink"],
                //   defaultTargetOption: "_blank",
                // },
              }}
            />
          </div>
        </div>

        <div className="mt-10 flex justify-end">
          <button
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded shadow-md transition"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateContentPage;
