import { useState, useEffect } from "react";
import { getData, deleteData } from "@/libs/axios/server";
import { AxiosHeaders } from "axios";
import { Banner } from "@/types/User";

export function useBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const fetchBanners = async (authToken: string) => {
    try {
      const res = await getData("owner/banners", {}, new AxiosHeaders({
        Authorization: `Bearer ${authToken}`,
      }));
      setBanners(res.data);
    } catch (err) {
      console.error("Fetch error", err);
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
      fetchBanners(savedToken);
    }
  }, []);

  const handleDelete = async (id: number) => {
    if (!token) return;
    try {
      await deleteData(`owner/banners/${id}`, new AxiosHeaders({
        Authorization: `Bearer ${token}`,
      }));
      fetchBanners(token);
      setConfirmDeleteId(null);
    } catch (err) {
      console.error("Delete error", err);
    }
  };

  return {
    banners,
    fetchBanners: () => token && fetchBanners(token),
    token,
    confirmDeleteId,
    setConfirmDeleteId,
    showCreate,
    setShowCreate,
    handleDelete,
  };
}
