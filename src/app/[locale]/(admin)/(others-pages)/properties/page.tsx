"use client";

import { useState, useEffect, useCallback } from "react";
import Table from "@/components/tables/Table";
import Toast from "@/components/Toast";
// import Image from "next/image";
import { getData, deleteData, postData } from "@/libs/axios/server";
import { AxiosHeaders } from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import {useLocale,useTranslations } from "next-intl";
import ImageWithFallback from "@/components/ImageWithFallback";
type User = {
  id: number;
  name: string;
  email: string;
  phone: string;
  cover: string | null;
  subscription: string;
  role: string;
};

type PropertyType = {
  id: number;
  title: string;
  cover: string | null;
};

// type ImageItem = {
//   id: number;
//   cover: string;
// };

type Location = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
};

type PropertyListing = {
  id: number;
  user: User;
  type: PropertyType;
  price: number;
  title: string;
  description: string;
  slug: string;
  // property_listing_images: ImageItem[];
  cover:string;
  property_locations: Location[];
  approval_status?: string;
};

type ToastState = {
  message: string;
  type: "success" | "error" | "info";
  show: boolean;
};

export default function PropertyListingsPage() {
  const t =useTranslations("")
  const locale = useLocale();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastState>({ message: "", type: "info", show: false });
  const [token, setToken] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const router = useRouter();

  // Initialize filter from URL query parameter
  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam && ['accepted', 'pending', 'cancelled'].includes(filterParam)) {
      setStatusFilter(filterParam);
    }
  }, [searchParams]);

  const statusOptions = [
    { value: 'accepted', label: 'Accepted', color: 'text-green-600', bgColor: 'bg-green-50 hover:bg-green-100' },
    { value: 'pending', label: 'Pending', color: 'text-yellow-600', bgColor: 'bg-yellow-50 hover:bg-yellow-100' },
    { value: 'cancelled', label: 'Cancelled', color: 'text-red-600', bgColor: 'bg-red-50 hover:bg-red-100' }
  ];

  // Toast helper
  const showToast = useCallback((message: string, type: ToastState["type"] = "info") => {
    setToast({ message, type, show: true });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
  }, []);

  // Load token
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) setToken(storedToken);
    else showToast("Authentication token not found", "error");
  }, [showToast]);

  // Fetch property listings
  const fetchItems = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await getData("owner/property_listings", {}, new AxiosHeaders({ Authorization: `Bearer ${token}` , "lang": locale }));
      setItems(res.data ?? []);
    } catch (error) {
      console.error(error);
      showToast("Failed to fetch property listings", "error");
    } finally {
      setLoading(false);
    }
  }, [token, locale, showToast]);

  useEffect(() => {
    if (token) fetchItems();
  }, [token, fetchItems]);

  // Delete item handler
  const handleDelete = useCallback(
    async (item: PropertyListing) => {
      if (!token) return showToast("No auth token", "error");

      // if (!confirm(`Are you sure you want to delete "${item.title}"?`)) return;

      try {
        await deleteData(`owner/property_listings/${item.id}`, new AxiosHeaders({ Authorization: `Bearer ${token}` }));
        showToast("Property deleted successfully", "success");
        await fetchItems();
      } catch (error) {
        console.error(error);
        showToast("Failed to delete property", "error");
      }
    },
    [token, fetchItems, showToast]
  );

  // Update status handler
  const handleStatusChange = useCallback(
    async (item: PropertyListing, newStatus: string) => {
      if (!token) return showToast("No auth token", "error");
      
      setUpdatingStatus(item.id);
      try {
        const response = await postData(
          `owner/property_listings/${item.id}/change-status`,
          { approval_status: newStatus },
          new AxiosHeaders({ Authorization: `Bearer ${token}` })
        );
        
        if (response.status === 200 || response.message) {
          showToast(response.message || "Status updated successfully", "success");
          // Update local state
          setItems(prevItems =>
            prevItems.map(prevItem =>
              prevItem.id === item.id ? { ...prevItem, approval_status: newStatus } : prevItem
            )
          );
        }
      } catch (error: unknown) {
        console.error(error);
        if (typeof error === 'object' && error !== null && 'response' in error) {
          const axiosError = error as {
            response?: { data?: { message?: string } };
          };
          showToast(axiosError.response?.data?.message || 'Failed to update status', 'error');
        } else {
          showToast('Failed to update status', 'error');
        }
      } finally {
        setUpdatingStatus(null);
      }
    },
    [token, showToast]
  );

  const getStatusColor = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option ? option.color : 'text-gray-600';
  };

  const getStatusBgColor = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option ? option.bgColor : 'bg-gray-50 hover:bg-gray-100';
  };

  // Filter items based on selected status
  const filteredItems = items.filter((item) => {
    if (statusFilter === "all") return true;
    return (item.approval_status || 'pending') === statusFilter;
  });

  // Get counts for each status
  const statusCounts = {
    all: items.length,
    accepted: items.filter(item => (item.approval_status || 'pending') === 'accepted').length,
    pending: items.filter(item => (item.approval_status || 'pending') === 'pending').length,
    cancelled: items.filter(item => (item.approval_status || 'pending') === 'cancelled').length,
  };

  // Navigate handlers
  const handleView = (item: PropertyListing) => router.push(`/properties/view/${item.id}?tab=main`);
  // const handleEdit = (item: PropertyListing) => router.push(`/properties/edit/${item.id}`);

  return (
    <div className="p-6">
      {toast.show && <Toast message={toast.message} type={toast.type} duration={3000} />}

      {/* Status Filters */}
      <div className="mb-6 flex flex-wrap gap-3 items-center">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">
          {t("Filter by Status") || "Filter by Status"}:
        </div>
        <button
          onClick={() => setStatusFilter("all")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
            statusFilter === "all"
              ? "bg-blue-600 text-white shadow-md"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          }`}
        >
          {t("All") || "All"} ({statusCounts.all})
        </button>
        {statusOptions.map((option) => {
          const count = statusCounts[option.value as keyof typeof statusCounts];
          const isActive = statusFilter === option.value;
          return (
            <button
              key={option.value}
              onClick={() => setStatusFilter(option.value)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                isActive
                  ? `${option.bgColor} ${option.color} shadow-md`
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              {option.label} ({count})
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center items-center min-h-[200px]">{t("Loading")}</div>
      ) : (
        <Table<PropertyListing>
          data={filteredItems}
          columns={[
            { key: "title", label: "title" },
            {
              key: "user",
              label: "user",
              render: (item) => item.user?.name ?? "Unknown",
            },
            {
  key: "price",
  label: "price",
  render: (item) => (
    <>
    {item.price}
  <span className="font-bold px-1"> EGY</span>
  </>
),

},

             {
  key: "title",
  label: "Image",
  render: (item) =>
    item.cover ? (
      <div className="flex items-center justify-center w-24 h-24 mx-auto">
        <div className="relative w-full h-full overflow-hidden rounded">
          <ImageWithFallback
            src={item.cover} 
            alt="cover" 
            fill
            className="object-cover" 
          />
        </div>
      </div>
    ) : (
      <div className="flex items-center justify-center w-24 h-24 mx-auto text-gray-400">
        No Cover
      </div>
    )
},
            {
              key: "approval_status",
              label: "Status",
              render: (item) => {
                const currentStatus = item.approval_status || 'pending';
                const isUpdating = updatingStatus === item.id;
                
                return (
                  <div className="relative inline-block text-left">
                    <select
                      value={currentStatus}
                      onChange={(e) => handleStatusChange(item, e.target.value)}
                      disabled={isUpdating}
                      className={`inline-flex items-center justify-center w-full px-3 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${getStatusBgColor(currentStatus)} ${getStatusColor(currentStatus)}`}
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              }
            },
          ]}
          onCreatePage={()=>{}}
          onViewPage={handleView}
          // onEditPage={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
