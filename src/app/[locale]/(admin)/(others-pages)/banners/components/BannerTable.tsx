import Image from "next/image";
import { Banner } from "@/types/User";

export default function BannerTable({
  banners,
  onDelete
}: {
  banners: Banner[];
  onDelete: (id: number) => void;
}) {
  return (
    <table className="w-full mt-4 table-auto border dark:border-gray-700">
      <thead>
        <tr className="bg-gray-200 dark:bg-gray-700 text-center">
          <th className="p-2">Image</th>
          <th className="p-2">Name</th>
          <th className="p-2">Description</th>
          <th className="p-2">Actions</th>
        </tr>
      </thead>
      <tbody>
        {banners.map((banner) => (
          <tr key={banner.id} className="border-t dark:border-gray-700 text-center">
            <td className="p-2">
              <Image
                width={100}
                height={100}
                src={banner.image}
                alt={banner.name}
                className="h-12 w-auto mx-auto rounded"
              />
            </td>
            <td className="p-2">{banner.name}</td>
            <td className="p-2">{banner.description}</td>
            <td className="p-2 space-x-2">
              <button
                onClick={() => alert(`View banner ID: ${banner.id}`)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
              >
                View
              </button>
              <button
                onClick={() => onDelete(banner.id)}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
