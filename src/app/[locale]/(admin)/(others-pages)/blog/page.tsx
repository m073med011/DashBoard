"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getData, deleteData } from "@/libs/axios/server";
import { Blog } from "@/types/User";
import { AxiosHeaders } from "axios";

const BlogsPage = ({ params }: { params: { locale: string } }) => {
  const locale = params.locale;
  const router = useRouter();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBlogId, setSelectedBlogId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchBlogs = async (token: string) => {
    try {
      const res = await getData(
        "owner/blogs",
        {},
        new AxiosHeaders({
          Authorization: `Bearer ${token}`,
          lang: locale,
        })
      );
      setBlogs(res.data);
    } catch (error) {
      console.error("Error fetching blogs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: number) => {
    setSelectedBlogId(id);
    setShowModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedBlogId) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await deleteData(
        `owner/delete/${selectedBlogId}`,
        new AxiosHeaders({
          Authorization: `Bearer ${token}`,
        })
      );
      setBlogs(prev => prev.filter(blog => blog.id !== selectedBlogId));
    } catch (error) {
      console.error("Error deleting blog:", error);
    } finally {
      setShowModal(false);
      setSelectedBlogId(null);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push(`/${locale}/login`);
    } else {
      fetchBlogs(token);
    }
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-xl text-gray-700 dark:text-gray-300">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">
          Manage Blogs
        </h1>
        <Link
          href={`/${locale}/blog/create`}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 6v12m6-6H6" />
          </svg>
          Add New Blog
        </Link>
      </header>

      {blogs.length === 0 ? (
        <p className="text-center text-gray-700 dark:text-gray-300 text-lg mt-20">
          No blogs found.
        </p>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogs.map((blog) => (
            <article
              key={blog.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              <div className="relative w-full h-48">
                <Image
                  src={blog.image}
                  alt={blog.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-5">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 truncate">
                  {blog.title}
                </h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-3">
                  {blog.description}
                </p>
                <Link
                  href={`/${locale}/blog/${blog.id}`}
                  className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
                >
                  Read More
                </Link>
                <button
                  onClick={() => handleDelete(blog.id)}
                  className="ml-4 text-red-600 dark:text-red-400 font-medium hover:underline"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-center max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Are you sure?</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">This action cannot be undone.</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded hover:bg-gray-400 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default BlogsPage;
