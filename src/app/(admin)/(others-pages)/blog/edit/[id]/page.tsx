'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, SubmitHandler } from 'react-hook-form';
import axios from 'axios';

// Define the Blog interface
interface Blog {
  id: number;
  title: string;
  description: string;
  slug: string;
  image: string;
  cover: string;
  meta_title: string;
  keywords: string | null;
  meta_description: string;
  meta_keywords: string;
}

// Form input interface
interface FormInputs {
  title: string;
  description: string;
  slug: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  keywords: string;
}

// API response interface
interface ApiResponse {
  status: boolean;
  msg: string;
  data: Blog;
}

export default function EditBlogPage() {
  const params = useParams();
  const router = useRouter();
  const blogId = params.id;
  
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // React Hook Form
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormInputs>();

  // Refs for file inputs
  const imageInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  
  // Form data states for file uploads
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Handle token-related redirects
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
      }
    }
  }, [router]);

  // Fetch blog data
  useEffect(() => {
    const fetchBlog = async () => {
      if (!blogId) return;

      try {
        setLoading(true);
        setError(null);
        
        // Get token from localStorage
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('Authentication token not found. Please log in again.');
        }
        
        const response = await axios.get(
          `https://lemonchiffon-octopus-104052.hostingersite.com/api/v1/dashboard/owner/blogs/${blogId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            }
          }
        );
        
        const apiResponse = response.data;
        
        if (apiResponse.status) {
          const blogData = apiResponse.data;
          setBlog(blogData);
          
          // Set form values
          setValue('title', blogData.title);
          setValue('description', blogData.description);
          setValue('slug', blogData.slug);
          setValue('meta_title', blogData.meta_title || '');
          setValue('meta_description', blogData.meta_description || '');
          setValue('meta_keywords', blogData.meta_keywords || '');
          setValue('keywords', blogData.keywords || '');
          
          // Set image previews
          setCoverPreview(blogData.cover);
          setImagePreview(blogData.image);
        } else {
          throw new Error(apiResponse.msg || 'Failed to load blog');
        }
      } catch (err) {
        console.error('Error fetching blog:', err);
        if (axios.isAxiosError(err)) {
          if (err.response?.status === 401) {
            setError('Your session has expired. Please log in again.');
          } else {
            setError(`Failed to fetch blog: ${err.response?.status} ${err.response?.statusText}`);
          }
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load blog. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [blogId, router, setValue]);

  // Handle cover image change
  const handleCoverChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCoverFile(file);
      const objectUrl = URL.createObjectURL(file);
      setCoverPreview(objectUrl);
    }
  };

  // Handle thumbnail image change
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
    }
  };

  // Handle form submission with React Hook Form
  const onSubmit: SubmitHandler<FormInputs> = async (data) => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      // Create FormData object for file uploads
      const formData = new FormData();
      
      // Required method field (needs to be PUT)
      // formData.append('_method', 'PUT');
      
      // User and type information
      formData.append('user_id', '9'); // Using the value from your screenshot
      formData.append('type_id', '1'); // Using the value from your screenshot
      formData.append('user', '9');    // Using the value from your screenshot
      
      // Blog content fields from form data
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('slug', data.slug);
      formData.append('meta_title', data.meta_title || '');
      formData.append('meta_description', data.meta_description || '');
      formData.append('meta_keywords', data.meta_keywords || '');
      formData.append('keywords', data.keywords || '');
      
      // Add files if selected
      if (coverFile) {
        formData.append('cover', coverFile);
      }
      
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const response = await axios.post(
        `https://lemonchiffon-octopus-104052.hostingersite.com/api/v1/dashboard/owner/blogs/${blogId}`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          }
        }
      );

      const result = response.data;
      
      if (result.status) {
        setSuccess('Blog updated successfully!');
        // Update the blog data with the response if needed
        if (result.data) {
          setBlog(result.data);
        }
      } else {
        throw new Error(result.msg || 'Failed to update blog');
      }
    } catch (err) {
      console.error('Error updating blog:', err);
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          setError('Your session has expired. Please log in again.');
        } else {
          setError(`Failed to update blog: ${err.response?.status} ${err.response?.statusText}`);
        }
      } else {
        setError(err instanceof Error ? err.message : 'Failed to update blog. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <Link 
            href="/blog" 
            className="flex items-center text-blue-600 mb-2 hover:text-blue-800"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
            Back to blogs
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Edit Blog</h1>
        </div>
        
        <div className="flex space-x-2">
          <Link
            href={`/blog/${blog?.slug || ''}`}
            target="_blank"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
            </svg>
            View Blog
          </Link>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {/* Error state */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {/* Success message */}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6" role="alert">
          <strong className="font-bold">Success: </strong>
          <span className="block sm:inline">{success}</span>
        </div>
      )}
      
      {/* Edit form */}
      {!loading && blog && (
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Form sections */}
          <div className="p-6 space-y-6">
            {/* Basic Info Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Title*
                  </label>
                  <input
                    id="title"
                    className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${errors.title ? 'border-red-500' : ''}`}
                    {...register('title', { required: 'Title is required' })}
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                    Slug*
                  </label>
                  <input
                    id="slug"
                    className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${errors.slug ? 'border-red-500' : ''}`}
                    {...register('slug', { required: 'Slug is required' })}
                  />
                  {errors.slug && (
                    <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p>
                  )}
                  <p className="mt-1 text-sm text-gray-500">
                    Used in the URL: example.com/blog/<span className="text-blue-600">{blog?.slug || 'your-slug'}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Content</h2>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description*
                </label>
                <textarea
                  id="description"
                  rows={6}
                  className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${errors.description ? 'border-red-500' : ''}`}
                  {...register('description', { required: 'Description is required' })}
                ></textarea>
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>
            </div>

            {/* Images Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Images</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cover Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cover Image
                  </label>
                  <div className="mt-1 flex flex-col items-center">
                    {coverPreview && (
                      <div className="mb-3 w-full h-48 rounded-lg overflow-hidden">
                        <img 
                          src={coverPreview} 
                          alt="Cover preview" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <input
                      type="file"
                      ref={coverInputRef}
                      onChange={handleCoverChange}
                      className="hidden"
                      accept="image/*"
                    />
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {coverPreview ? 'Change Cover Image' : 'Upload Cover Image'}
                    </button>
                  </div>
                </div>

                {/* Thumbnail Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thumbnail Image
                  </label>
                  <div className="mt-1 flex flex-col items-center">
                    {imagePreview && (
                      <div className="mb-3 w-32 h-32 rounded-lg overflow-hidden">
                        <img 
                          src={imagePreview} 
                          alt="Thumbnail preview" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <input
                      type="file"
                      ref={imageInputRef}
                      onChange={handleImageChange}
                      className="hidden"
                      accept="image/*"
                    />
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {imagePreview ? 'Change Thumbnail' : 'Upload Thumbnail'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* SEO Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">SEO Settings</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="meta_title" className="block text-sm font-medium text-gray-700 mb-1">
                    Meta Title
                  </label>
                  <input
                    id="meta_title"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    {...register('meta_title')}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Leave empty to use the blog title
                  </p>
                </div>
                
                <div>
                  <label htmlFor="meta_description" className="block text-sm font-medium text-gray-700 mb-1">
                    Meta Description
                  </label>
                  <textarea
                    id="meta_description"
                    rows={3}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    {...register('meta_description')}
                  ></textarea>
                </div>
                
                <div>
                  <label htmlFor="meta_keywords" className="block text-sm font-medium text-gray-700 mb-1">
                    Meta Keywords
                  </label>
                  <input
                    id="meta_keywords"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    {...register('meta_keywords')}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Comma-separated keywords
                  </p>
                </div>
                
                <div>
                  <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-1">
                    Content Keywords
                  </label>
                  <input
                    id="keywords"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    {...register('keywords')}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Form Actions */}
          <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3 border-t border-gray-200">
            <Link
              href="/blog"
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                saving 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {saving ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : 'Save Changes'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}