import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2, ShoppingCart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { rupees } from "@/lib/telangana";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart — Telangana Farmers" },
      { name: "description", content: "Review the produce you picked from Telangana farmers before placing your order." },
      { property: "og:title", content: "Your Cart — Telangana Farmers" },
      { property: "og:description", content: "Review your farm-fresh order before checkout." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { t, pick } = useI18n();
  const { items, remove, setQuantity, subtotal } = useCart();
  const productIds = items.map((item) => item.product_id).sort();
  const {
    data: currentProducts = [],
    isLoading: checkingProducts,
    isError: productCheckFailed,
  } = useQuery({
    queryKey: ["cart-products", productIds],
    enabled: productIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(
          "id, crop_name, variety, price, quantity, unit, status, farmer_id, min_order, pack_sizes, is_demo, supplier_verified, price_verified, stock_verified",
        )
        .in("id", productIds);
      if (error) throw error;
      return data ?? [];
    },
  });
  const currentProductById = new Map(currentProducts.map((product) => [product.id, product]));
  const currentSubtotal = items.reduce(
    (sum, item) => sum + Number(currentProductById.get(item.product_id)?.price ?? item.price) * item.quantity,
    0,
  );
  const displaySubtotal = checkingProducts ? subtotal : currentSubtotal;
  const farmerCount = new Set(
    items.map((item) => currentProductById.get(item.product_id)?.farmer_id ?? item.farmer_id).filter(Boolean),
  ).size;
  const delivery = farmerCount * 40;
  const cartVerified = items.every((item) => {
    const product = currentProductById.get(item.product_id);
    return (
      product?.status === "active" &&
      product.farmer_id !== null &&
      product.supplier_verified &&
      product.price_verified &&
      product.stock_verified &&
      product.quantity >= item.quantity &&
      item.quantity >= product.min_order &&
      product.pack_sizes.includes(item.quantity)
    );
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-3xl font-extrabold">{t("cart")}</h1>

      {items.length === 0 ? (
        <div className="surface-panel mt-8 grid place-items-center rounded-3xl p-14 text-center">
          <ShoppingCart className="h-10 w-10 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">{pick("Your cart is empty.", "మీ బండి ఖాళీగా ఉంది.")}</p>
          <Button asChild className="mt-6"><Link to="/marketplace">{t("buyFresh")}</Link></Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <ul className="space-y-4">
            {items.map((item) => (
              <li key={item.product_id} className="surface-panel grid grid-cols-[80px_minmax(0,1fr)_auto] items-center gap-4 rounded-3xl p-4">
                {(() => {
                  const product = currentProductById.get(item.product_id);
                  const packs = (product?.pack_sizes ?? item.pack_sizes ?? []).filter(
                    (size) => size <= (product?.quantity ?? item.available_stock ?? 0),
                  );
                  return (
                    <>
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-muted">
                  {item.image_url && <img src={item.image_url} alt={item.crop_name} className="h-full w-full object-cover" loading="lazy" />}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-display font-bold">{product?.crop_name ?? pick(item.crop_name, item.crop_name_te)}</p>
                  {item.variety && <p className="truncate text-sm">{product?.variety ?? item.variety}</p>}
                  <p className="truncate text-xs text-muted-foreground">
                    {item.district ?? item.location}
                    {product?.is_demo && " • DEMO"}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-primary">
                    {rupees(Number(product?.price ?? item.price))} / {product?.unit ?? item.unit}
                  </p>
                  <Select
                    value={String(item.quantity)}
                    onValueChange={(value) => setQuantity(item.product_id, Number(value))}
                    disabled={packs.length === 0}
                  >
                    <SelectTrigger className="mt-2 h-10 w-32"><SelectValue placeholder="Pack size" /></SelectTrigger>
                    <SelectContent>
                      {packs.map((size) => (
                        <SelectItem key={size} value={String(size)}>{size} {product?.unit ?? item.unit}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {product && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {product.quantity} {product.unit} available
                    </p>
                  )}
                </div>
                <Button variant="ghost" size="icon" onClick={() => remove(item.product_id)} aria-label="Remove">
                  <Trash2 className="h-5 w-5 text-destructive" />
                </Button>
                    </>
                  );
                })()}
              </li>
            ))}
          </ul>

          <aside className="surface-panel h-fit rounded-3xl p-6">
            <h2 className="font-display text-lg font-bold">{pick("Order summary", "ఆర్డర్ సారాంశం")}</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><dt>{pick("Subtotal", "మొత్తం")}</dt><dd>{rupees(displaySubtotal)}</dd></div>
              <div className="flex justify-between"><dt>{pick("Delivery", "డెలివరీ")}</dt><dd>{rupees(delivery)}</dd></div>
              <div className="flex justify-between"><dt>{pick("Approved discounts", "ఆమోదించిన తగ్గింపులు")}</dt><dd>{rupees(0)}</dd></div>
              <div className="flex justify-between border-t border-border pt-3 font-display text-lg font-bold">
                <dt>{pick("Total", "మొత్తం")}</dt><dd>{rupees(displaySubtotal + delivery)}</dd>
              </div>
            </dl>
            {productCheckFailed && (
              <p role="alert" className="mt-4 text-sm text-destructive">
                Could not verify current listings. Refresh and try again.
              </p>
            )}
            {!checkingProducts && !productCheckFailed && !cartVerified && (
              <p className="mt-4 text-sm text-muted-foreground">
                One or more listings are unverified, unavailable, or have an invalid pack size. They cannot be purchased.
              </p>
            )}
            <Button
              asChild={cartVerified && !checkingProducts && !productCheckFailed}
              size="lg"
              className="mt-6 w-full"
              disabled={!cartVerified || checkingProducts || productCheckFailed}
            >
              {cartVerified && !checkingProducts && !productCheckFailed ? (
                <Link to="/checkout">{t("placeOrder")}</Link>
              ) : (
                <span>{t("placeOrder")}</span>
              )}
            </Button>
          </aside>
        </div>
      )}
    </div>
  );
}
