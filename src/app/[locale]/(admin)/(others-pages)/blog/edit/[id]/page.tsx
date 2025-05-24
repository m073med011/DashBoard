
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { getData } from "@/libs/axios/server";
import { AxiosHeaders } from "axios";
import Link from "next/link";
import Image from "next/image";

interface Blog {
  id: number;
  title: string;
  description: string;
  image: string;
  slug?: string;
  cover?: string;
}

interface PageProps {
  params: {
    id: string;
    locale: string;
  };
}

export default async function EditBlogPage({ params }: PageProps) {
  const { id, locale } = params;

  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return (
      <div className="p-6 text-center text-red-600">
        You must be logged in to edit blogs.
      </div>
    );
  }

  const t = await getTranslations("blogs");

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
  } catch  {
    return (
      <div className="p-6 text-center text-red-600">{t("Failed to load blog data")}</div>
    );
  }

  return (
    <main className="max-w-3xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">{t("Edit Blog")}</h1>
      <form
        action={`/api/blog/edit/${id}`}
        method="post"
        encType="multipart/form-data"
        className="space-y-4"
      >
        <input type="hidden" name="locale" value={locale} />
        <div>
          <label
            htmlFor="title"
            className="block font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {t("Title")}
          </label>
          <input
            id="title"
            name="title"
            type="text"
            defaultValue={blog?.title}
            className="w-full rounded border px-3 py-2 dark:bg-gray-700 dark:text-white"
            required
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {t("Description")}
          </label>
          <textarea
            id="description"
            name="description"
            rows={6}
            defaultValue={blog?.description}
            className="w-full rounded border px-3 py-2 dark:bg-gray-700 dark:text-white"
            required
          />
        </div>

        <div>
          <label
            htmlFor="image"
            className="block font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {t("Image URL")}
          </label>
          <input
            id="image"
            name="image"
            type="url"
            defaultValue={blog?.image}
            className="w-full rounded border px-3 py-2 dark:bg-gray-700 dark:text-white"
            required
          />
        </div>

        {blog?.image && (
          <div className="relative w-full h-48 rounded overflow-hidden shadow-md">
            <Image
              src={blog.image}
              alt="Blog image preview"
              fill
              className="object-cover w-full h-full rounded"
            />
          </div>
        )}

        <button
          type="submit"
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {t("Save Changes")}
        </button>
      </form>

      <Link
        href={`/${locale}/admin/blog`}
        className="mt-6 inline-block text-blue-500 hover:underline"
      >
        {t("Back to Blogs")}
      </Link>
    </main>
  );
}
