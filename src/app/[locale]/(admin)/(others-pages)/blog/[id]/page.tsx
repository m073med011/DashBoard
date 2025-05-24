import Image from "next/image";
import { cookies } from "next/headers";
import { AxiosHeaders } from "axios";
import { getTranslations } from "next-intl/server";
import { getData } from "@/libs/axios/server";
import { Blog } from "@/types/User";

type BlogPageProps = {
  params: {
    id: string | number;
  };
};

export default async function BlogPage({ params }: BlogPageProps) {
  const id = Number(params.id);
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value ?? "";
  const locale = cookieStore.get("locale")?.value ?? "en";

  const t = await getTranslations("blogs");

  if (!token) {
    return (
      <div className="p-6 text-center text-red-500">
        {t("You must be logged in to view this blog.")}
      </div>
    );
  }

  let blog: Blog | null = null;
  try {
    const res = await getData(
      `owner/blogs/${id}`,
      {},
      new AxiosHeaders({
        Authorization: `Bearer ${token}`,
        lang: locale,
      })
    );
    blog = res.data;
  } catch (error) {
    console.error("Error fetching blog:", error);
  }

  if (!blog) {
    return (
      <div className="p-6 text-center text-gray-700 dark:text-gray-300">
        {t("Blog not found")}
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-lg shadow-md">
      <h1 className="text-3xl font-bold mb-4 dark:text-white">{blog.title}</h1>
      {blog.image && (
        <div className="relative w-full h-64 mb-6 rounded overflow-hidden shadow-lg">
          <Image
            src={blog.image}
            alt={blog.title}
            fill
            className="object-cover"
            priority={true}
          />
        </div>
      )}
      <p className="text-gray-800 dark:text-gray-300 whitespace-pre-line">
        {blog.description}
      </p>
    </main>
  );
}
