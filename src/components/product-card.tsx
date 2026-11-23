import { Link } from "@tanstack/react-router";
import { MapPin, Leaf, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import { rupees } from "@/lib/telangana";
import { toast } from "sonner";
import { useState } from "react";

export type ProductRow = {
  id: string;
  farmer_id: string | null;
  listing_key?: string | null;
  crop_name: string;
  crop_name_te: string | null;
  variety?: string;
  category: string;
  rollout_phase?: number;
  district?: string | null;
  raw_price_per_quintal?: number | null;
  price: number;
  unit: string;
  quantity: number;
  reserved_quantity?: number;
  min_order: number;
  pack_sizes?: number[];
  low_stock_threshold?: number;
  organic: boolean;
  organic_verified?: boolean;
  quality: string;
  location: string | null;
  image_url: string | null;
  status?: string;
  is_demo?: boolean;
  supplier_verified?: boolean;
  price_verified?: boolean;
  stock_verified?: boolean;
  created_at?: string;
  description?: string | null;
  farmers?: { id?: string; name: string; district: string; village?: string | null } | null;
};

export function ProductCard({ product }: { product: ProductRow }) {
  const { t, pick } = useI18n();
  const { add } = useCart();
  const [selectedPack, setSelectedPack] = useState(
    product.pack_sizes?.find((size) => size <= product.quantity) ?? product.min_order,
  );
  const district = product.district ?? product.farmers?.district ?? product.location ?? "Telangana";
  const farmerName = product.farmers?.name ?? "Supplier not listed";
  const isPlanned = product.status === "planned";
  const isAvailable = product.status === "active" && product.quantity > 0;
  const canPurchase =
    !product.is_demo &&
    !isPlanned &&
    isAvailable &&
    product.supplier_verified === true &&
    product.price_verified === true &&
    product.stock_verified === true &&
    product.farmer_id !== null &&
    product.quantity >= product.min_order &&
    (product.pack_sizes?.length ?? 0) > 0;
  const isOrganicVerified = product.organic && product.organic_verified === true;

  return (
    <article className="group surface-panel flex flex-col overflow-hidden rounded-3xl transition-shadow hover:shadow-lg">
      <Link
        to="/marketplace/$productId"
        params={{ productId: product.id }}
        className="relative block aspect-4/3 overflow-hidden bg-muted"
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.crop_name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-muted-foreground">
            <Leaf className="h-10 w-10" />
          </div>
        )}
        {isOrganicVerified && (
          <div className="absolute top-3 left-3 flex flex-wrap gap-2">
            {isOrganicVerified && <Badge className="bg-leaf text-primary-foreground">{t("organic")}</Badge>}
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="truncate font-display text-lg font-bold">{pick(product.crop_name, product.crop_name_te)}</h3>
        {product.variety && <p className="mt-0.5 truncate text-sm font-medium">{product.variety}</p>}
        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {district}
          {product.supplier_verified && product.farmer_id ? ` • ${farmerName}` : ""}
        </p>

        <div className="mt-3 flex items-end justify-between gap-2">
          <div>
            <span className="font-display text-xl font-bold text-primary">{rupees(product.price)}</span>
            <span className="text-xs text-muted-foreground"> / {product.unit}</span>
          </div>
          <span className="text-right text-xs text-muted-foreground">
            {isPlanned ? `${product.quantity} ${product.unit} planned` : isAvailable ? `${product.quantity} ${product.unit} available` : "Unavailable"}
          </span>
        </div>

        <p className="mt-2 text-xs text-muted-foreground">
          {product.category} • Min. {product.min_order} {product.unit}
        </p>
        {isPlanned && <p className="mt-2 text-xs text-muted-foreground">Indicative offer · Farmer confirmation pending</p>}
        {product.pack_sizes && product.pack_sizes.length > 0 && (
          <div className="mt-3">
            <label className="mb-1 block text-xs font-semibold">
              {pick("Pack size", "ప్యాక్ పరిమాణం")}
            </label>
            <select
              value={selectedPack}
              onChange={(event) => setSelectedPack(Number(event.target.value))}
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
            >
              {product.pack_sizes
                .filter((size) => size <= product.quantity)
                .map((size) => (
                  <option key={size} value={size}>
                    {size} {product.unit}
                  </option>
                ))}
            </select>
            <p className="mt-2 text-sm font-bold text-primary">
              {pick("Total", "మొత్తం")}: ₹{(Number(product.price) * selectedPack).toLocaleString("en-IN")}
            </p>
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <Button
            className="flex-1"
            disabled={!canPurchase}
            onClick={() => {
              if (selectedPack > product.quantity) {
                toast.error("Selected pack exceeds available stock");
                return;
              }
              add({
                product_id: product.id,
                farmer_id: product.farmer_id,
                farmer_name: farmerName,
                crop_name: product.crop_name,
                crop_name_te: product.crop_name_te,
                variety: product.variety ?? "",
                district,
                unit: product.unit,
                price: Number(product.price),
                image_url: product.image_url,
                quantity: selectedPack,
                location: product.location,
                is_demo: product.is_demo === true,
                supplier_verified: product.supplier_verified === true,
                price_verified: product.price_verified === true,
                stock_verified: product.stock_verified === true,
                min_order: Number(product.min_order) || 1,
                pack_sizes: product.pack_sizes ?? [],
                available_stock: product.quantity,
              });
              toast.success(`${product.crop_name} added to cart`);
            }}
          >
            <ShoppingCart className="mr-1.5 h-4 w-4" />
            {canPurchase ? t("addToCart") : isPlanned ? "Farmer confirmation pending" : "Unavailable"}
          </Button>
          <Button asChild variant="outline">
            <Link to="/marketplace/$productId" params={{ productId: product.id }}>
              {t("viewProduct")}
            </Link>
          </Button>
        </div>
        <Button asChild variant="ghost" className="mt-2 w-full">
          <Link to="/groups">{pick("Join / view group buying", "సమూహ కొనుగోలు చూడండి")}</Link>
        </Button>
      </div>
    </article>
  );
}
