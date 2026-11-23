import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { MapPin, Leaf, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import { rupees } from "@/lib/telangana";
import type { ProductRow } from "@/components/product-card";

export const Route = createFileRoute("/marketplace/$productId")({
  head: () => ({
    meta: [
      { title: "Product Details — Telangana Farmers Marketplace" },
      { name: "description", content: "See price, quantity, quality grade and the farmer behind this produce before you order." },
      { property: "og:title", content: "Product Details — Telangana Farmers Marketplace" },
      { property: "og:description", content: "Fresh produce direct from a Telangana farmer." },
    ],
  }),
  component: ProductDetail,
});

function ProductDetail() {
  const { productId } = Route.useParams();
  const { t, pick } = useI18n();
  const { add } = useCart();
  const [qty, setQty] = useState(1);

  const supabaseConfigured = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
  const { data: liveProduct, isLoading } = useQuery({
    enabled: supabaseConfigured,
    queryKey: ["product", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, farmers(name, district, village)")
        .eq("id", productId)
        .in("status", ["active","planned"])
        .maybeSingle();
      if (error) throw error;
      return data as unknown as (ProductRow & { harvest_date: string | null; description: string | null }) | null;
    },
  });

  const product = liveProduct;
  if (supabaseConfigured && isLoading) return <div className="mx-auto max-w-5xl px-4 py-10"><Skeleton className="h-96 rounded-3xl" /></div>;
  if (!product)
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 text-center">
        <p className="text-muted-foreground">{pick("Product not found.", "ఉత్పత్తి కనబడలేదు.")}</p>
        <Button asChild className="mt-6"><Link to="/marketplace">{t("marketplace")}</Link></Button>
      </div>
    );

  const district = product.district ?? product.farmers?.district ?? product.location ?? "Telangana";
  const farmerName = product.farmers?.name ?? "Supplier not listed";
  const packSizes = (product.pack_sizes ?? []).filter((size) => size <= product.quantity);
  const selectedQty = packSizes.includes(qty) ? qty : (packSizes[0] ?? 0);
  const canPurchase =
    product.status === "active" &&
    product.supplier_verified === true &&
    product.price_verified === true &&
    product.stock_verified === true &&
    product.farmer_id !== null &&
    product.quantity >= product.min_order &&
    packSizes.length > 0;
  const isOrganicVerified = product.organic && product.organic_verified === true;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="surface-panel aspect-4/3 overflow-hidden rounded-3xl bg-muted">
          {product.image_url ? (
            <img src={product.image_url} alt={product.crop_name} className="h-full w-full object-cover" width={1200} height={900} />
          ) : (
            <div className="grid h-full place-items-center"><Leaf className="h-12 w-12 text-muted-foreground" /></div>
          )}
        </div>

        <div>
          <div className="flex flex-wrap gap-2">
            {product.status === "planned" && <Badge variant="secondary">Indicative offer</Badge>}
            {isOrganicVerified && <Badge className="bg-leaf text-primary-foreground">{t("organic")}</Badge>}
          </div>
          <h1 className="mt-3 font-display text-3xl font-extrabold">{pick(product.crop_name, product.crop_name_te)}</h1>
          {product.variety && <p className="mt-1 text-lg font-medium">{product.variety}</p>}
          <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" /> {district}
            {product.supplier_verified && product.farmer_id ? ` • ${farmerName}` : ""}
          </p>

          <p className="mt-5">
            <span className="font-display text-4xl font-extrabold text-primary">{rupees(product.price)}</span>
            <span className="text-muted-foreground"> / {product.unit}</span>
          </p>

          {product.description && <p className="mt-5 text-muted-foreground">{product.description}</p>}

          <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-secondary p-3">
              <dt className="text-muted-foreground">{product.status === "planned" ? "Planned quantity" : pick("Available", "అందుబాటులో")}</dt>
              <dd className="font-semibold">{product.quantity} {product.unit}</dd>
            </div>
            <div className="rounded-2xl bg-secondary p-3">
              <dt className="text-muted-foreground">{pick("Quality grade", "నాణ్యత గ్రేడ్")}</dt>
              <dd className="font-semibold">{product.quality}</dd>
            </div>
            <div className="rounded-2xl bg-secondary p-3">
              <dt className="text-muted-foreground">{pick("Minimum order", "కనీస ఆర్డర్")}</dt>
              <dd className="font-semibold">{product.min_order} {product.unit}</dd>
            </div>
            <div className="rounded-2xl bg-secondary p-3">
              <dt className="text-muted-foreground">{pick("Category", "వర్గం")}</dt>
              <dd className="font-semibold">{product.category}</dd>
            </div>
          </dl>

          {product.status === "planned" && (
            <p className="mt-4 rounded-2xl bg-secondary p-3 text-sm text-muted-foreground">
              Indicative catalogue offer. Register interest through a community buying group; farmer confirmation is pending.
            </p>
          )}
          {product.status !== "planned" && !canPurchase && (
            <p className="mt-4 rounded-2xl bg-secondary p-3 text-sm text-muted-foreground">
              This listing is currently unavailable for ordering.
            </p>
          )}

          <div className="mt-6 flex items-end gap-3">
            <div className="w-32">
              <label htmlFor="qty" className="text-sm font-semibold">{t("quantity")} ({product.unit})</label>
              <Select value={String(selectedQty)} onValueChange={(value) => setQty(Number(value))} disabled={!canPurchase}>
                <SelectTrigger id="qty" className="mt-1.5 h-12"><SelectValue placeholder="Pack size" /></SelectTrigger>
                <SelectContent>
                  {packSizes.map((size) => (
                    <SelectItem key={size} value={String(size)}>{size} {product.unit}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              size="lg"
              className="flex-1"
              disabled={!canPurchase}
              onClick={() => {
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
                  quantity: selectedQty,
                  location: product.location,
                  is_demo: product.is_demo === true,
                  supplier_verified: product.supplier_verified === true,
                  price_verified: product.price_verified === true,
                  stock_verified: product.stock_verified === true,
                  min_order: product.min_order,
                  pack_sizes: product.pack_sizes ?? [],
                  available_stock: product.quantity,
                });
                toast.success(pick("Added to cart", "బండిలో చేర్చబడింది"));
              }}
            >
              <ShoppingCart className="mr-2 h-5 w-5" /> {canPurchase ? t("addToCart") : product.status === "planned" ? "Farmer confirmation pending" : "Currently unavailable"}
            </Button>
          </div>

          <Button asChild variant="outline" size="lg" className="mt-3 w-full">
            <Link to="/cart">{t("cart")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
