"use client"
import { useEffect, useState } from "react";
import  { AxiosHeaders } from "axios";
import { getData,postData,deleteData } from "@/libs/axios/server";
import { Type } from "@/types/User";
export default function TypesPage() {
  const [types, setTypes] = useState([]);
  const [search, setSearch] = useState("");
  const [filteredTypes, setFilteredTypes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ id: null, title: "" });
  const [deleteId, setDeleteId] = useState(null);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchTypes = async () => {
    if (!token) return;
    const headers = new AxiosHeaders({ Authorization: `Bearer ${token}` });
    try {
      const res = await getData("owner/types", {}, headers);
      setTypes(res.data);
    } catch (err) {
      console.error("Failed to fetch types", err);
    }
  };

  useEffect(() => {
    fetchTypes();
  });

  useEffect(() => {
    setFilteredTypes(
      types.filter((type: Type) =>
        type.title.toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [search, types]);

  const handleSubmit = async () => {
    if (!token) return;
    const form = new FormData();
    form.append("title", formData.title);
    if (formData.id) form.append("_method", "PUT");
    const headers = new AxiosHeaders({ Authorization: `Bearer ${token}` });

    await postData(
      `owner/types/${formData.id || ""}`,
      form,
      headers
    );

    fetchTypes();
    setShowModal(false);
    setFormData({ id: null, title: "" });
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    const headers = new AxiosHeaders({ Authorization: `Bearer ${token}` });
    await deleteData(`owner/types/${id}`, headers);
    fetchTypes();
    setDeleteId(null);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Search types..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 px-3 py-2 rounded w-1/2"
        />
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={() => setShowModal(true)}
        >
          Create New
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTypes.map((type: Type) => (
          <div key={type.id} className="border p-4 rounded shadow">
            <h2 className="text-lg font-semibold mb-2">{type.title}</h2>
            <div className="flex gap-2">
              {/* <button
                className="bg-yellow-400 text-white px-3 py-1 rounded"
                onClick={() => { setFormData({ id: type.id || null, title: type.title }); setShowModal(true); }}
              >
                Edit
              </button>
              <button
                className="bg-red-600 text-white px-3 py-1 rounded"
                onClick={() => setDeleteId(type.id || null)}
              >
                Delete
              </button> */}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-md w-96">
            <h2 className="text-xl font-bold mb-4">{formData.id ? "Edit" : "Create"} Type</h2>
            <input
              type="text"
              placeholder="Type title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border border-gray-300 px-3 py-2 rounded mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                className="border px-4 py-2 rounded"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded"
                onClick={handleSubmit}
              >
                {formData.id ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-md w-96 text-center">
            <p className="text-lg mb-4">Are you sure you want to delete this type?</p>
            <div className="flex justify-center gap-4">
              <button
                className="border px-4 py-2 rounded"
                onClick={() => setDeleteId(null)}
              >
                Cancel
              </button>
              <button
                className="bg-red-600 text-white px-4 py-2 rounded"
                onClick={() => handleDelete(deleteId)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}