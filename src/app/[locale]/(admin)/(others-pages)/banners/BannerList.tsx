import BannerCard from "./components/BannerCard";

interface Banner {
  id: number;
  type: string;
  link: string | null;
  image: string;
  name: string;
  description: string;
}

interface Props {
  banners: Banner[];
  view: "grid" | "row";
  onDelete: (id: number) => void;
}

export default function BannerList({ banners, view, onDelete }: Props) {
  return (
    <div className={view === "grid" ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3" : "space-y-4"}>
      {banners.map(banner => (
        <BannerCard key={banner.id} banner={banner} onDelete={() => onDelete(banner.id)} view={view} />
      ))}
    </div>
  );
}
