"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getData, postData, patchData, deleteData } from "@/libs/axios/server";
import { AxiosHeaders } from "axios";

interface Amenity {
  id: number;
  title: string;
  type: string | null;
}

const AmenitiesPage = () => {
  const router = useRouter();
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingAmenity, setEditingAmenity] = useState<Amenity | null>(null);
  const [title, setTitle] = useState("");

  const fetchAmenities = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const headers = new AxiosHeaders({ Authorization: `Bearer ${token}` });
      const res = await getData("owner/amenities", {}, headers);
      setAmenities(res.data);
    } catch (error) {
      console.error("Failed to fetch amenities", error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingAmenity(null);
    setTitle("");
    setShowFormModal(true);
  };

  const openEditModal = (amenity: Amenity) => {
    setEditingAmenity(amenity);
    setTitle(amenity.title);
    setShowFormModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;

    const headers = new AxiosHeaders({ Authorization: `Bearer ${token}` });
    const formData = new FormData();
    // append method
    formData.append("method", "PUT");
    formData.append("property_listing_id", editingAmenity?.id.toString() || "");
    formData.append("title[en]", title);
    formData.append("title[ar]", title);

    try {
      if (editingAmenity) {
        await postData(`owner/amenities/${editingAmenity.id}`, formData, headers);
      } else {
        await postData("owner/amenities", formData, headers);
      }
      await fetchAmenities();
      setShowFormModal(false);
    } catch (error) {
      console.error("Submit error", error);
    }
  };

  const handleDelete = async (id: number) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const headers = new AxiosHeaders({ Authorization: `Bearer ${token}` });

    try {
      await deleteData(`owner/amenities/${id}`, headers);
      setAmenities(amenities.filter((a) => a.id !== id));
    } catch (error) {
      console.error("Delete error", error);
    }
  };

  useEffect(() => {
    fetchAmenities();
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Amenities</h1>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Create New
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2 border">ID</th>
              <th className="p-2 border">Title</th>
              <th className="p-2 border text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {amenities.map((amenity) => (
              <tr key={amenity.id} className="border-t">
                <td className="p-2 border">{amenity.id}</td>
                <td className="p-2 border">{amenity.title}</td>
                <td className="p-2 border text-center space-x-2">
                  <button
                    onClick={() => openEditModal(amenity)}
                    className="px-3 py-1 bg-yellow-400 rounded hover:bg-yellow-500"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(amenity.id)}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showFormModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded shadow w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">
              {editingAmenity ? "Edit Amenity" : "Create Amenity"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border p-2 rounded"
                placeholder="Amenity Title"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  {editingAmenity ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AmenitiesPage;
