"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import dynamic from "next/dynamic";
import { EditorState, convertToRaw, convertFromRaw } from "draft-js";
import type { ComponentType } from "react";
import type { EditorProps } from "react-draft-wysiwyg";
import { getData, postData } from "@/libs/axios/server";
import { AxiosHeaders } from "axios";
import Image from "next/image";
import { toast } from "react-hot-toast";

const Editor = dynamic(() =>
  import("react-draft-wysiwyg").then((mod) => mod.Editor as ComponentType<EditorProps>),
  { ssr: false }
);

import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";

type Blog = {
  _method: string;
  id: number;
  title: string;
  slug: string;
  description: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  keywords: string;
  user_id?: string;
  type_id?: string;
  image: string;
  cover: string;
  created_at: string;
};

type FormDataState = {
  _method: string;
  user_id: string;
  type_id: string;
  title_en: string;
  slug_en: string;
  title_ar: string;
  slug_ar: string;
  meta_title_en: string;
  meta_description_en: string;
  meta_keywords_en: string;
  user_en: string;
  keywords_en: string;
  meta_title_ar: string;
  meta_description_ar: string;
  meta_keywords_ar: string;
  user_ar: string;
  keywords_ar: string;
};

export default function EditBlogPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<FormDataState>({
    defaultValues: {
      _method: "PUT",
      user_id: "",
      type_id: "",
      title_en: "",
      slug_en: "",
      title_ar: "",
      slug_ar: "",
      meta_title_en: "",
      meta_description_en: "",
      meta_keywords_en: "",
      user_en: "",
      keywords_en: "",
      meta_title_ar: "",
      meta_description_ar: "",
      meta_keywords_ar: "",
      user_ar: "",
      keywords_ar: "",
    }
  });

  const [token, setToken] = useState<string | null>(null);
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [descriptionEn, setDescriptionEn] = useState(EditorState.createEmpty());
  const [descriptionAr, setDescriptionAr] = useState(EditorState.createEmpty());
  const [cover, setCover] = useState<File | null>(null);
  const [image, setImage] = useState<File | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    } else {
      toast.error('Authentication token not found');
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    if (token && id) {
      fetchBlog(id as string, token);
    }
  },);

  const fetchBlog = async (blogId: string, token: string) => {
    try {
      const res = await getData(`owner/blogs/${blogId}`, {}, new AxiosHeaders({
        Authorization: `Bearer ${token}`,
      }));
      
      const blogData: Blog = res.data;
      setBlog(blogData);

      // Set form values based on API response structure
      setValue('_method', 'PUT');
      setValue('user_id', blogData.user_id || '');
      setValue('type_id', blogData.type_id || '');
      setValue('title_en', blogData.title || '');
      setValue('slug_en', blogData.slug || '');
      setValue('title_ar', blogData.title || '');
      setValue('slug_ar', blogData.slug || '');
      setValue('meta_title_en', blogData.meta_title || '');
      setValue('meta_description_en', blogData.meta_description || '');
      setValue('meta_keywords_en', blogData.meta_keywords || '');
      setValue('user_en', '');
      setValue('keywords_en', blogData.keywords || '');
      setValue('meta_title_ar', blogData.meta_title || '');
      setValue('meta_description_ar', blogData.meta_description || '');
      setValue('meta_keywords_ar', blogData.meta_keywords || '');
      setValue('user_ar', '');
      setValue('keywords_ar', blogData.keywords || '');

      // Set editor states - description is a single field with JSON string
      if (blogData.description) {
        try {
          const contentState = convertFromRaw(JSON.parse(blogData.description));
          setDescriptionEn(EditorState.createWithContent(contentState));
          setDescriptionAr(EditorState.createWithContent(contentState));
        } catch  {
          console.warn('Failed to parse description, using empty editor');
          setDescriptionEn(EditorState.createEmpty());
          setDescriptionAr(EditorState.createEmpty());
        }
      }

    } catch (error) {
      console.error('Failed to fetch blog:', error);
      toast.error('Failed to load blog data');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: FormDataState) => {
    if (!token || !id) {
      toast.error('Missing authentication or blog ID');
      return;
    }

    const formData = new FormData();

    // Add all required fields as per API specification
    formData.append("_method", data._method);
    formData.append("user_id", data.user_id);
    formData.append("type_id", data.type_id);
    
    // English fields
    formData.append("title[en]", data.title_en);
    formData.append("description[en]", JSON.stringify(convertToRaw(descriptionEn.getCurrentContent())));
    formData.append("slug[en]", data.slug_en);
    formData.append("meta_title[en]", data.meta_title_en);
    formData.append("meta_description[en]", data.meta_description_en);
    formData.append("meta_keywords[en]", data.meta_keywords_en);
    formData.append("user[en]", data.user_en);
    formData.append("keywords[en]", data.keywords_en);
    
    // Arabic fields
    formData.append("title[ar]", data.title_ar);
    formData.append("description[ar]", JSON.stringify(convertToRaw(descriptionAr.getCurrentContent())));
    formData.append("slug[ar]", data.slug_ar);
    formData.append("meta_title[ar]", data.meta_title_ar);
    formData.append("meta_description[ar]", data.meta_description_ar);
    formData.append("meta_keywords[ar]", data.meta_keywords_ar);
    formData.append("user[ar]", data.user_ar);
    formData.append("keywords[ar]", data.keywords_ar);

    // Files (only append if new files are selected)
    if (cover) formData.append("cover", cover);
    if (image) formData.append("image", image);

    try {
      await postData(`owner/blogs/${id}`, formData, new AxiosHeaders({
        Authorization: `Bearer ${token}`,
      }));
      
      toast.success('Blog updated successfully!');
      router.push('/ar/blog');
    } catch (error) {
      console.error('Failed to update blog:', error);
      toast.error('Failed to update blog. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-xl text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-xl text-gray-600 dark:text-gray-400">Blog not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6">
      <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md p-8">
        <h1 className="text-3xl font-bold mb-6 text-center">✏️ Edit Blog</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Basic Information */}
          <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-1 font-medium">
                  User ID <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("user_id", { required: "User ID is required" })}
                  className={`w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 focus:outline-none focus:ring focus:ring-blue-400 ${
                    errors.user_id ? 'border-red-500' : ''
                  }`}
                />
                {errors.user_id && (
                  <p className="text-red-500 text-sm mt-1">{errors.user_id.message}</p>
                )}
              </div>

              <div>
                <label className="block mb-1 font-medium">
                  Type ID <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("type_id", { required: "Type ID is required" })}
                  className={`w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 focus:outline-none focus:ring focus:ring-blue-400 ${
                    errors.type_id ? 'border-red-500' : ''
                  }`}
                />
                {errors.type_id && (
                  <p className="text-red-500 text-sm mt-1">{errors.type_id.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* English Content */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-blue-800 dark:text-blue-200">English Content</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-1 font-medium">
                  Title (EN) <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("title_en", { required: "English title is required" })}
                  className={`w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 focus:outline-none focus:ring focus:ring-blue-400 ${
                    errors.title_en ? 'border-red-500' : ''
                  }`}
                />
                {errors.title_en && (
                  <p className="text-red-500 text-sm mt-1">{errors.title_en.message}</p>
                )}
              </div>

              <div>
                <label className="block mb-1 font-medium">
                  Slug (EN) <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("slug_en", { required: "English slug is required" })}
                  className={`w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 focus:outline-none focus:ring focus:ring-blue-400 ${
                    errors.slug_en ? 'border-red-500' : ''
                  }`}
                />
                {errors.slug_en && (
                  <p className="text-red-500 text-sm mt-1">{errors.slug_en.message}</p>
                )}
              </div>

              <div>
                <label className="block mb-1 font-medium">
                  Meta Title (EN) <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("meta_title_en", { required: "English meta title is required" })}
                  className={`w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 focus:outline-none focus:ring focus:ring-blue-400 ${
                    errors.meta_title_en ? 'border-red-500' : ''
                  }`}
                />
                {errors.meta_title_en && (
                  <p className="text-red-500 text-sm mt-1">{errors.meta_title_en.message}</p>
                )}
              </div>

              <div>
                <label className="block mb-1 font-medium">
                  Meta Description (EN) <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("meta_description_en", { required: "English meta description is required" })}
                  className={`w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 focus:outline-none focus:ring focus:ring-blue-400 ${
                    errors.meta_description_en ? 'border-red-500' : ''
                  }`}
                />
                {errors.meta_description_en && (
                  <p className="text-red-500 text-sm mt-1">{errors.meta_description_en.message}</p>
                )}
              </div>

              <div>
                <label className="block mb-1 font-medium">
                  Meta Keywords (EN) <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("meta_keywords_en", { required: "English meta keywords is required" })}
                  className={`w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 focus:outline-none focus:ring focus:ring-blue-400 ${
                    errors.meta_keywords_en ? 'border-red-500' : ''
                  }`}
                />
                {errors.meta_keywords_en && (
                  <p className="text-red-500 text-sm mt-1">{errors.meta_keywords_en.message}</p>
                )}
              </div>

              <div>
                <label className="block mb-1 font-medium">
                  User (EN) <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("user_en", { required: "English user is required" })}
                  className={`w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 focus:outline-none focus:ring focus:ring-blue-400 ${
                    errors.user_en ? 'border-red-500' : ''
                  }`}
                />
                {errors.user_en && (
                  <p className="text-red-500 text-sm mt-1">{errors.user_en.message}</p>
                )}
              </div>

              <div>
                <label className="block mb-1 font-medium">
                  Keywords (EN) <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("keywords_en", { required: "English keywords is required" })}
                  className={`w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 focus:outline-none focus:ring focus:ring-blue-400 ${
                    errors.keywords_en ? 'border-red-500' : ''
                  }`}
                />
                {errors.keywords_en && (
                  <p className="text-red-500 text-sm mt-1">{errors.keywords_en.message}</p>
                )}
              </div>
            </div>

            {/* English Description Editor */}
            <div className="mt-6">
              <label className="block mb-2 font-medium">
                Description (EN) <span className="text-red-500">*</span>
              </label>
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
                      "list",
                      "textAlign",
                      "remove",
                      "history",
                    ],
                  }}
                />
              </div>
            </div>
          </div>

          {/* Arabic Content */}
          <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-orange-800 dark:text-orange-200">Arabic Content</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-1 font-medium">
                  Title (AR) <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("title_ar", { required: "Arabic title is required" })}
                  className={`w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 focus:outline-none focus:ring focus:ring-blue-400 ${
                    errors.title_ar ? 'border-red-500' : ''
                  }`}
                  dir="rtl"
                />
                {errors.title_ar && (
                  <p className="text-red-500 text-sm mt-1">{errors.title_ar.message}</p>
                )}
              </div>

              <div>
                <label className="block mb-1 font-medium">
                  Slug (AR) <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("slug_ar", { required: "Arabic slug is required" })}
                  className={`w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 focus:outline-none focus:ring focus:ring-blue-400 ${
                    errors.slug_ar ? 'border-red-500' : ''
                  }`}
                />
                {errors.slug_ar && (
                  <p className="text-red-500 text-sm mt-1">{errors.slug_ar.message}</p>
                )}
              </div>

              <div>
                <label className="block mb-1 font-medium">
                  Meta Title (AR) <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("meta_title_ar", { required: "Arabic meta title is required" })}
                  className={`w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 focus:outline-none focus:ring focus:ring-blue-400 ${
                    errors.meta_title_ar ? 'border-red-500' : ''
                  }`}
                  dir="rtl"
                />
                {errors.meta_title_ar && (
                  <p className="text-red-500 text-sm mt-1">{errors.meta_title_ar.message}</p>
                )}
              </div>

              <div>
                <label className="block mb-1 font-medium">
                  Meta Description (AR) <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("meta_description_ar", { required: "Arabic meta description is required" })}
                  className={`w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 focus:outline-none focus:ring focus:ring-blue-400 ${
                    errors.meta_description_ar ? 'border-red-500' : ''
                  }`}
                  dir="rtl"
                />
                {errors.meta_description_ar && (
                  <p className="text-red-500 text-sm mt-1">{errors.meta_description_ar.message}</p>
                )}
              </div>

              <div>
                <label className="block mb-1 font-medium">
                  Meta Keywords (AR) <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("meta_keywords_ar", { required: "Arabic meta keywords is required" })}
                  className={`w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 focus:outline-none focus:ring focus:ring-blue-400 ${
                    errors.meta_keywords_ar ? 'border-red-500' : ''
                  }`}
                  dir="rtl"
                />
                {errors.meta_keywords_ar && (
                  <p className="text-red-500 text-sm mt-1">{errors.meta_keywords_ar.message}</p>
                )}
              </div>

              <div>
                <label className="block mb-1 font-medium">
                  User (AR) <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("user_ar", { required: "Arabic user is required" })}
                  className={`w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 focus:outline-none focus:ring focus:ring-blue-400 ${
                    errors.user_ar ? 'border-red-500' : ''
                  }`}
                  dir="rtl"
                />
                {errors.user_ar && (
                  <p className="text-red-500 text-sm mt-1">{errors.user_ar.message}</p>
                )}
              </div>

              <div>
                <label className="block mb-1 font-medium">
                  Keywords (AR) <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("keywords_ar", { required: "Arabic keywords is required" })}
                  className={`w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 focus:outline-none focus:ring focus:ring-blue-400 ${
                    errors.keywords_ar ? 'border-red-500' : ''
                  }`}
                  dir="rtl"
                />
                {errors.keywords_ar && (
                  <p className="text-red-500 text-sm mt-1">{errors.keywords_ar.message}</p>
                )}
              </div>
            </div>

            {/* Arabic Description Editor */}
            <div className="mt-6">
              <label className="block mb-2 font-medium">
                Description (AR) <span className="text-red-500">*</span>
              </label>
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
                      "list",
                      "textAlign",
                      "remove",
                      "history",
                    ],
                  }}
                />
              </div>
            </div>
          </div>

          {/* Media Files */}
          <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-green-800 dark:text-green-200">Media Files</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-1 font-medium">Cover Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCover(e.target.files?.[0] || null)}
                  className="w-full border px-4 py-2 rounded-md bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-sm"
                />
                {blog.cover && !cover && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current cover:</p>
                    <Image 
                      width={100} 
                      height={60} 
                      src={blog.cover} 
                      alt="Current Cover" 
                      className="h-20 w-auto rounded border"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block mb-1 font-medium">Featured Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImage(e.target.files?.[0] || null)}
                  className="w-full border px-4 py-2 rounded-md bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-sm"
                />
                {blog.image && !image && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current image:</p>  
                    <Image 
                      width={100} 
                      height={60} 
                      src={blog.image} 
                      alt="Current Image" 
                      className="h-20 w-auto rounded border"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="bg-gray-500 hover:bg-gray-600 text-white font-medium px-6 py-3 rounded shadow-md transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium px-6 py-3 rounded shadow-md transition"
            >
              {isSubmitting ? 'Updating...' : 'Update Blog'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}