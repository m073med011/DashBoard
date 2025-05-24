import Image from "next/image";
import {Banner}  from "@/types/User"  
export default function BannerCard({
  banner,
  onDelete,
  onEdit,
  view,
}: {
  banner: Banner;
  onDelete: () => void;
  onEdit: (banner: Banner) => void;
  view: "grid" | "row";
}) {
  return (
    <div className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow ${view === "row" ? "flex items-center space-x-4" : ""}`}>
      <Image
        width={100}
        height={100}
        src={banner.image}
        alt={banner.name}
        className={`rounded object-cover ${view === "grid" ? "w-full h-40 mb-4" : "w-32 h-32"}`}
      />
      <div className={view === "row" ? "flex-1" : ""}>
        <h2 className="text-xl font-bold">{banner.name}</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">{banner.description}</p>
        <div className="w-full gap-2 flex">
          <button
            onClick={() => alert(`View banner ID: ${banner.id}`)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            View
          </button>
          <button
            onClick={onDelete}
            className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
          >
            Delete
          </button>
          <button
            onClick={() => onEdit(banner)}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}
