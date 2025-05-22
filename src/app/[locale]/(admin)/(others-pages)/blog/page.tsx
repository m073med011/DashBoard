import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { AxiosHeaders } from "axios";
import { getTranslations } from "next-intl/server";
import { getData } from "@/libs/axios/server";
import { Blog } from "@/types/User";

const BlogsPage = async ({ params }: { params: { locale: string } }) => {
  const locale = params.locale;

  // Get token from cookies
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    // Redirect to login if no token
    return {
      redirect: {
        destination: `/${locale}/login`,
        permanent: false,
      },
    };
  }

  const fetchBlogs = async () => {
    try {
      const res = await getData(
        "owner/blogs",
        {},
        new AxiosHeaders({
          Authorization: `Bearer ${token}`,
          lang: locale,
        })
      );
      return res.data;
    } catch (error) {
      console.error("Error fetching blogs:", error);
      throw error;
    }
  };

  const t = await getTranslations("blogs");
  const blogs = await fetchBlogs();   

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">
          {t("Manage Blogs")}
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
          {t("Add New Blog")}
        </Link>
      </header>

      {blogs.length === 0 ? (
        <p className="text-center text-gray-700 dark:text-gray-300 text-lg mt-20">
          {t("No blogs found.")}
        </p>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogs.map((blog: Blog) => (
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
                  priority={false}
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
                  {t("Read More")}
                </Link>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
};

export default BlogsPage;
