import BannerCard from "./components/BannerCard";
import { Banner } from "@/types/User";

interface Props {
  banners: Banner[];
  view: "grid" | "row";
  onDelete: (id: number) => void;
}

export default function BannerList({ banners, view, onDelete }: Props) {
  return (
    <div className={view === "grid" ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3" : "space-y-4"}>
      {banners.map(banner => (
        <BannerCard key={banner.id} onEdit={() => {}} onDelete={() => onDelete(banner.id)} view={view} banner={banner} />
      ))}
    </div>
  );
}
