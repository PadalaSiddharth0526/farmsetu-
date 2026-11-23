import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { rupees } from "@/lib/telangana";
import { useProfile, useSession } from "@/lib/session";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Telangana Farmers" },
      { name: "description", content: "Confirm your delivery details and place your farm-direct order." },
      { property: "og:title", content: "Checkout — Telangana Farmers" },
      { property: "og:description", content: "Confirm delivery details and place your order." },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { t, pick } = useI18n();
  const { items, subtotal, clear } = useCart();
  const { data: session } = useSession();
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [placing, setPlacing] = useState(false);
  const productIds = items.map((item) => item.product_id).sort();
  const {
    data: currentProducts = [],
    isLoading: checkingProducts,
    isError: productCheckFailed,
  } = useQuery({
    queryKey: ["checkout-products", productIds],
    enabled: productIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(
          "id, crop_name, variety, price, quantity, unit, status, farmer_id, min_order, pack_sizes, supplier_verified, price_verified, stock_verified",
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

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!session) {
      toast.error(pick("Please sign in to place an order", "ఆర్డర్ పెట్టడానికి లాగిన్ అవ్వండి"));
      navigate({ to: "/auth" });
      return;
    }
    if (checkingProducts || productCheckFailed || !cartVerified) {
      toast.error("Some listings are unverified, unavailable, or have changed. Refresh your cart.");
      return;
    }

    setPlacing(true);
    const { error } = await supabase.rpc("place_marketplace_orders", {
      p_items: items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        expected_price: currentProductById.get(item.product_id)?.price,
      })),
      p_customer_name: name || profile?.name || null,
      p_customer_phone: phone || profile?.phone || null,
      p_delivery_address: address,
    });

    setPlacing(false);
    if (error) {
      toast.error(error.message);
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["cart-products"] });
      void queryClient.invalidateQueries({ queryKey: ["checkout-products"] });
      return;
    }
    clear();
    toast.success(pick("Order placed! The farmer has been notified.", "ఆర్డర్ పెట్టబడింది! రైతుకు తెలియజేయబడింది."));
    void queryClient.invalidateQueries({ queryKey: ["products"] });
    navigate({ to: "/account" });
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-muted-foreground">{pick("Your cart is empty.", "మీ బండి ఖాళీగా ఉంది.")}</p>
        <Button asChild className="mt-6"><Link to="/marketplace">{t("buyFresh")}</Link></Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-3xl font-extrabold">{t("placeOrder")}</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <form onSubmit={placeOrder} className="surface-panel space-y-4 rounded-3xl p-6">
          <div>
            <Label htmlFor="co-name">{t("fullName")}</Label>
            <Input id="co-name" required value={name || profile?.name || ""} onChange={(e) => setName(e.target.value)} className="mt-1.5 h-12" />
          </div>
          <div>
            <Label htmlFor="co-phone">{t("mobile")}</Label>
            <Input id="co-phone" required inputMode="tel" value={phone || profile?.phone || ""} onChange={(e) => setPhone(e.target.value)} className="mt-1.5 h-12" />
          </div>
          <div>
            <Label htmlFor="co-address">{pick("Delivery address", "డెలివరీ చిరునామా")}</Label>
            <Textarea id="co-address" required rows={4} value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1.5" />
          </div>
          <p className="rounded-2xl bg-secondary p-3 text-sm">
            💵 {pick("Payment: Cash on delivery", "చెల్లింపు: డెలివరీ సమయంలో నగదు")}
          </p>
          <Button type="submit" size="lg" className="w-full" disabled={placing}>{t("placeOrder")}</Button>
        </form>

        <aside className="surface-panel h-fit rounded-3xl p-6">
          <h2 className="font-display text-lg font-bold">{pick("Order summary", "ఆర్డర్ సారాంశం")}</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {items.map((i) => (
              <li key={i.product_id} className="flex justify-between gap-3">
                <span className="min-w-0 truncate">
                  {currentProductById.get(i.product_id)?.crop_name ?? i.crop_name}
                  {currentProductById.get(i.product_id)?.variety
                    ? ` — ${currentProductById.get(i.product_id)?.variety}`
                    : ""} × {i.quantity} {currentProductById.get(i.product_id)?.unit ?? i.unit}
                  <span className="block text-xs text-muted-foreground">
                    {rupees(Number(currentProductById.get(i.product_id)?.price ?? i.price))} / kg
                  </span>
                </span>
                <span className="shrink-0">
                  {rupees(Number(currentProductById.get(i.product_id)?.price ?? i.price) * i.quantity)}
                </span>
              </li>
            ))}
          </ul>
          {productCheckFailed && (
            <p role="alert" className="mt-4 text-sm text-destructive">
            Could not verify current listings. Refresh and try again.
            </p>
          )}
          {!checkingProducts && !productCheckFailed && !cartVerified && (
            <p className="mt-4 text-sm text-muted-foreground">
            Unverified DEMO products cannot be purchased or paid for. Remove them or wait for supplier verification.
            </p>
          )}
          <div className="mt-4 flex justify-between border-t border-border pt-3 font-display text-lg font-bold">
            <span>{pick("Subtotal", "మొత్తం")}</span><span>{rupees(currentSubtotal || subtotal)}</span>
          </div>
          <div className="mt-2 flex justify-between text-sm">
            <span>{pick("Delivery", "డెలివరీ")}</span><span>{rupees(delivery)}</span>
          </div>
          <div className="mt-2 flex justify-between text-sm">
            <span>{pick("Approved discounts", "ఆమోదించిన తగ్గింపులు")}</span><span>{rupees(0)}</span>
          </div>
          <div className="mt-2 flex justify-between border-t border-border pt-3 font-display text-lg font-bold">
            <span>{pick("Total", "మొత్తం")}</span><span>{rupees(currentSubtotal + delivery)}</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Prices are checked again before the order is placed. Reservations expire after 30 minutes if the order is not accepted.
          </p>
        </aside>
      </div>
    </div>
  );
}
