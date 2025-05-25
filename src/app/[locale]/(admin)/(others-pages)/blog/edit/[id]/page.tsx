'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getData, patchData } from '@/libs/axios/server';
import { AxiosHeaders } from 'axios';
import Image from 'next/image';

type Blog = {
    id: number;
    title: string;
    description: string;
    slug: string;
    image: string;
    cover: string;
  };

export default function EditBlogPage() {
  const { id } = useParams();
  const router = useRouter();

  const [token, setToken] = useState<string | null>(null);
  const [blog, setBlog] = useState<Blog>({} as Blog);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    } else {
      console.error('Token not found in localStorage');
    }
  }, []);

  useEffect(() => {
    if (token && id) {
      fetchBlog(id as string, token);
    }
  }, [token, id]);

  const fetchBlog = async (blogId: string, token: string) => {
    try {
      const res = await getData(`owner/blogs/${blogId}`, {}, new AxiosHeaders({
        Authorization: `Bearer ${token}`,
      }));
      setBlog(res.data);
    } catch (error) {
      console.error('Failed to fetch blog:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token || !id) return;

    const formData = new FormData(e.currentTarget);
    const payload = new FormData();

    // Always include all fields, even if unchanged
    payload.append('title', formData.get('title') as string ?? blog.title);
    payload.append('slug', formData.get('slug') as string ?? blog.slug);
    payload.append('description', formData.get('description') as string ?? blog.description);

    const imageFile = formData.get('image') as File;
    if (imageFile && imageFile.size > 0) {
      payload.append('image', imageFile);
    }

    const coverFile = formData.get('cover') as File;
    if (coverFile && coverFile.size > 0) {
      payload.append('cover', coverFile);
    }

    try {
      await patchData(`owner/blogs/${id}`, payload, new AxiosHeaders({
        Authorization: `Bearer ${token}`,
      }));
      router.push('/ar/blog'); // go back to blog list
    } catch (error) {
      console.error('Failed to update blog:', error);
    }
  };

  if (loading) return <p className="p-6">Loading...</p>;
  if (!blog) return <p className="p-6">Blog not found.</p>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Edit Blog</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="title"
          defaultValue={blog.title}
          placeholder="Title"
          className="w-full border rounded p-2"
          required
        />
        <textarea
          name="description"
          defaultValue={blog.description}
          placeholder="Description"
          className="w-full border rounded p-2"
          rows={6}
          required
        />
        <input
          type="text"
          name="slug"
          defaultValue={blog.slug}
          placeholder="Slug"
          className="w-full border rounded p-2"
          required
        />
        <div>
          <label className="block mb-1">Image (optional)</label>
          <input type="file" name="image" accept="image/*" className="w-full border rounded p-2" />
          {blog.image && (
            <Image width={50} height={50} src={blog.image} alt="Image" className="mt-2 h-20 rounded" />
          )}
        </div>
        <div>
          <label className="block mb-1">Cover (optional)</label>
          <input type="file" name="cover" accept="image/*" className="w-full border rounded p-2" />
          {blog.cover && (
            <Image src={blog.cover} alt="Cover" className="mt-2 h-20 rounded" />
          )}
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
}
