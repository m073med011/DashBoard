"use client";

import { useState } from "react";
import { useBanners } from "./hooks/useBanners";
import BannerCard from "./components/BannerCard";
import BannerTable from "./components/BannerTable";
import ConfirmDeleteModal from "./components/ConfirmDeleteModal";
import BannerFormModal from "./components/BannerFormModal";
import { Banner } from "@/types/User";

export default function BannersPage() {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "row">("grid");
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  const {
    banners,
    fetchBanners,
    confirmDeleteId,
    setConfirmDeleteId,
    showCreate,
    setShowCreate,
    handleDelete,
    token
  } = useBanners();

  const filtered = banners.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 text-gray-800 dark:text-white">
      <div className="mb-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <input
          type="text"
          placeholder="Search banners..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-1/2 p-2 border border-gray-300 rounded dark:bg-gray-700"
        />
        <div className="flex gap-2">
          <button
            onClick={() => setView(view === "grid" ? "row" : "grid")}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            {view === "grid" ? "Row View" : "Card View"}
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            + Create New Banner
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p>No banners found.</p>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filtered.map((banner) => (
            <BannerCard
              key={banner.id}
              banner={banner}
              onDelete={() => setConfirmDeleteId(banner.id)}
              onEdit={(b) => setEditingBanner(b)}
              view={view}
            />
          ))}
        </div>
      ) : (
        <BannerTable
          banners={filtered}
          onDelete={setConfirmDeleteId}
        />
      )}

      {confirmDeleteId && (
        <ConfirmDeleteModal
          onCancel={() => setConfirmDeleteId(null)}
          onConfirm={() => handleDelete(confirmDeleteId)}
        />
      )}

      {(showCreate || editingBanner) && (
        <BannerFormModal
          onClose={() => {
            setShowCreate(false);
            setEditingBanner(null);
          }}
          onCreated={fetchBanners}
          token={token}
          IsEdit={!!editingBanner}
          Banner={editingBanner || {} as Banner}
        />
      )}
    </div>
  );
}
