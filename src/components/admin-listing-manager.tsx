import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, DISTRICTS, rupees } from "@/lib/telangana";
import type { ProductRow } from "@/components/product-card";

type FarmerOption = { id: string; name: string; district: string };
type ListingDraft = {
  crop_name: string;
  variety: string;
  category: string;
  rollout_phase: string;
  district: string;
  farmer_id: string;
  raw_price_per_quintal: string;
  price: string;
  quantity: string;
  min_order: string;
  pack_sizes: string;
  low_stock_threshold: string;
  image_url: string;
  status: string;
  is_demo: boolean;
  supplier_verified: boolean;
  price_verified: boolean;
  stock_verified: boolean;
  organic: boolean;
  organic_verified: boolean;
};

function listingDraft(product?: ProductRow): ListingDraft {
  return {
    crop_name: product?.crop_name ?? "",
    variety: product?.variety ?? "",
    category: product?.category ?? "grains",
    rollout_phase: String(product?.rollout_phase ?? 1),
    district: product?.district ?? "",
    farmer_id: product?.farmer_id ?? "",
    raw_price_per_quintal:
      product?.raw_price_per_quintal == null ? "" : String(product.raw_price_per_quintal),
    price: product ? String(product.price) : "",
    quantity: product ? String(product.quantity) : "",
    min_order: product ? String(product.min_order) : "5",
    pack_sizes: (product?.pack_sizes ?? []).join(", "),
    low_stock_threshold: product ? String(product.low_stock_threshold ?? 0) : "20",
    image_url: product?.image_url ?? "",
    status: product?.status ?? "inactive",
    is_demo: product?.is_demo ?? true,
    supplier_verified: product?.supplier_verified ?? false,
    price_verified: product?.price_verified ?? false,
    stock_verified: product?.stock_verified ?? false,
    organic: product?.organic ?? false,
    organic_verified: product?.organic_verified ?? false,
  };
}

function parsePackSizes(value: string) {
  return [...new Set(value.split(",").map((part) => Number(part.trim())).filter((size) => Number.isFinite(size) && size > 0))]
    .sort((a, b) => a - b);
}

function ListingFields({
  draft,
  setDraft,
  farmers,
}: {
  draft: ListingDraft;
  setDraft: (draft: ListingDraft) => void;
  farmers: FarmerOption[];
}) {
  function set<K extends keyof ListingDraft>(key: K, value: ListingDraft[K]) {
    setDraft({ ...draft, [key]: value });
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <div>
        <Label>Product name</Label>
        <Input required value={draft.crop_name} onChange={(e) => set("crop_name", e.target.value)} />
      </div>
      <div>
        <Label>Variety / grade</Label>
        <Input required value={draft.variety} onChange={(e) => set("variety", e.target.value)} />
      </div>
      <div>
        <Label>Category</Label>
        <Select value={draft.category} onValueChange={(value) => set("category", value)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((category) => (
              <SelectItem key={category.value} value={category.value}>{category.en}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Rollout phase</Label>
        <Select value={draft.rollout_phase} onValueChange={(value) => set("rollout_phase", value)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Phase 1</SelectItem>
            <SelectItem value="2">Phase 2</SelectItem>
            <SelectItem value="3">Phase 3</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>District</Label>
        <Select value={draft.district || "none"} onValueChange={(value) => set("district", value === "none" ? "" : value)}>
          <SelectTrigger><SelectValue placeholder="Select district" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Not assigned</SelectItem>
            {DISTRICTS.map((district) => (
              <SelectItem key={district} value={district}>{district}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Supplier (existing profile only)</Label>
        <Select value={draft.farmer_id || "none"} onValueChange={(value) => set("farmer_id", value === "none" ? "" : value)}>
          <SelectTrigger><SelectValue placeholder="Not assigned" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No supplier assigned</SelectItem>
            {farmers.map((farmer) => (
              <SelectItem key={farmer.id} value={farmer.id}>
                {farmer.name} — {farmer.district}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Customer price (₹/kg)</Label>
        <Input required type="number" min="0" step="0.01" value={draft.price} onChange={(e) => set("price", e.target.value)} />
      </div>
      <div>
        <Label>Raw price (₹/quintal)</Label>
        <Input type="number" min="0" step="0.01" value={draft.raw_price_per_quintal} onChange={(e) => set("raw_price_per_quintal", e.target.value)} />
      </div>
      <div>
        <Label>Available stock (kg)</Label>
        <Input required type="number" min="0" step="1" value={draft.quantity} onChange={(e) => set("quantity", e.target.value)} />
      </div>
      <div>
        <Label>Minimum order (kg)</Label>
        <Input required type="number" min="1" step="1" value={draft.min_order} onChange={(e) => set("min_order", e.target.value)} />
      </div>
      <div>
        <Label>Pack sizes (kg, comma-separated)</Label>
        <Input required value={draft.pack_sizes} onChange={(e) => set("pack_sizes", e.target.value)} placeholder="5, 10, 15" />
      </div>
      <div>
        <Label>Low-stock threshold (kg)</Label>
        <Input required type="number" min="0" step="1" value={draft.low_stock_threshold} onChange={(e) => set("low_stock_threshold", e.target.value)} />
      </div>
      <div>
        <Label>Image URL</Label>
        <Input value={draft.image_url} onChange={(e) => set("image_url", e.target.value)} placeholder="https://..." />
      </div>
      <div>
        <Label>Availability</Label>
        <Select value={draft.status} onValueChange={(value) => set("status", value)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Published</SelectItem>
            <SelectItem value="inactive">Unpublished</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-wrap gap-4 sm:col-span-2 lg:col-span-3">
        {([
          ["is_demo", "DEMO listing"],
          ["supplier_verified", "Supplier verified"],
          ["price_verified", "Price verified"],
          ["stock_verified", "Stock verified"],
          ["organic", "Organic claim"],
          ["organic_verified", "Organic independently verified"],
        ] as const).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft[key]}
              onChange={(event) => set(key, event.target.checked)}
            />
            {label}
          </label>
        ))}
      </div>
    </div>
  );
}

function ListingEditor({
  listing,
  farmers,
}: {
  listing: ProductRow;
  farmers: FarmerOption[];
}) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState(() => listingDraft(listing));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const packSizes = parsePackSizes(draft.pack_sizes);
    const minOrder = Number(draft.min_order);
    const price = Number(draft.price);
    const quantity = Number(draft.quantity);
    if (!packSizes.includes(minOrder)) {
      toast.error("Pack sizes must include the minimum order.");
      return;
    }
    if (![minOrder, price, quantity].every(Number.isFinite) || minOrder <= 0 || price < 0 || quantity < 0) {
      toast.error("Enter valid prices, stock, and minimum order.");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("products")
      .update({
        crop_name: draft.crop_name.trim(),
        variety: draft.variety.trim(),
        category: draft.category,
        rollout_phase: Number(draft.rollout_phase),
        district: draft.district || null,
        farmer_id: draft.farmer_id || null,
        raw_price_per_quintal: draft.raw_price_per_quintal ? Number(draft.raw_price_per_quintal) : null,
        price,
        quantity,
        min_order: minOrder,
        pack_sizes: packSizes,
        low_stock_threshold: Number(draft.low_stock_threshold),
        image_url: draft.image_url || null,
        location: draft.district || null,
        status: draft.status,
        is_demo: draft.is_demo,
        supplier_verified: Boolean(draft.farmer_id) && draft.supplier_verified,
        price_verified: draft.price_verified,
        stock_verified: draft.stock_verified,
        organic: draft.organic,
        organic_verified: draft.organic && draft.organic_verified,
      })
      .eq("id", listing.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Listing updated.");
    void queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    void queryClient.invalidateQueries({ queryKey: ["products"] });
  }

  async function uploadImage(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file.");
      return;
    }
    setUploading(true);
    const path = `${listing.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
    setUploading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    setDraft((current) => ({ ...current, image_url: data.publicUrl }));
    toast.success("Image uploaded. Save the listing to publish it.");
  }

  async function deleteListing() {
    if (!window.confirm(`Delete ${listing.crop_name} — ${listing.variety}?`)) return;
    const { error } = await supabase.from("products").delete().eq("id", listing.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Listing deleted.");
    void queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    void queryClient.invalidateQueries({ queryKey: ["products"] });
  }

  return (
    <details className="surface-panel rounded-2xl p-4">
      <summary className="cursor-pointer list-none">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-semibold">
            {listing.crop_name} — {listing.variety} · {listing.district ?? listing.farmers?.district ?? "District not set"}
          </span>
          <span className="text-sm text-muted-foreground">
            {rupees(listing.price)}/kg · {listing.quantity} kg
            {listing.quantity <= (listing.low_stock_threshold ?? 0) ? " · LOW STOCK" : ""}
            {listing.is_demo ? " · DEMO" : ""}
            {` · Phase ${listing.rollout_phase ?? 1}`}
          </span>
        </div>
      </summary>
      <form onSubmit={save} className="mt-4 space-y-4">
        <ListingFields draft={draft} setDraft={setDraft} farmers={farmers} />
        <div className="flex flex-wrap items-center gap-3">
          <Input
            type="file"
            accept="image/*"
            className="max-w-xs"
            onChange={(event) => void uploadImage(event.target.files?.[0])}
            disabled={uploading}
          />
          <Button type="submit" disabled={saving || uploading}>{saving ? "Saving..." : "Save changes"}</Button>
          <Button type="button" variant="destructive" onClick={() => void deleteListing()}>Delete listing</Button>
        </div>
      </form>
    </details>
  );
}

function NewListingForm({ farmers }: { farmers: FarmerOption[] }) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState(() => listingDraft());
  const [saving, setSaving] = useState(false);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const packSizes = parsePackSizes(draft.pack_sizes);
    const minOrder = Number(draft.min_order);
    const price = Number(draft.price);
    const quantity = Number(draft.quantity);
    if (!packSizes.includes(minOrder)) {
      toast.error("Pack sizes must include the minimum order.");
      return;
    }
    if (![minOrder, price, quantity].every(Number.isFinite) || minOrder <= 0 || price < 0 || quantity < 0) {
      toast.error("Enter valid prices, stock, and minimum order.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("products").insert({
      farmer_id: draft.farmer_id || null,
      crop_name: draft.crop_name.trim(),
      variety: draft.variety.trim(),
      category: draft.category,
      rollout_phase: Number(draft.rollout_phase),
      district: draft.district || null,
      raw_price_per_quintal: draft.raw_price_per_quintal ? Number(draft.raw_price_per_quintal) : null,
      price,
      quantity,
      unit: "kg",
      min_order: minOrder,
      pack_sizes: packSizes,
      low_stock_threshold: Number(draft.low_stock_threshold),
      image_url: draft.image_url || null,
      location: draft.district || null,
      quality: "Unverified",
      organic: draft.organic,
      organic_verified: draft.organic && draft.organic_verified,
      is_demo: !draft.farmer_id || draft.is_demo,
      supplier_verified: Boolean(draft.farmer_id) && draft.supplier_verified,
      price_verified: draft.price_verified,
      stock_verified: draft.stock_verified,
      status: draft.status,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Listing created. Verify its supplier, price, and stock before enabling purchases.");
    setDraft(listingDraft());
    void queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    void queryClient.invalidateQueries({ queryKey: ["products"] });
  }

  return (
    <details className="surface-panel rounded-2xl p-4">
      <summary className="cursor-pointer font-semibold">Add listing</summary>
      <form onSubmit={create} className="mt-4 space-y-4">
        <ListingFields draft={draft} setDraft={setDraft} farmers={farmers} />
        <Button type="submit" disabled={saving}>{saving ? "Creating..." : "Create listing"}</Button>
      </form>
    </details>
  );
}

export function AdminListingManager() {
  const { data: products = [], isLoading: loadingProducts, error: productsError } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, farmers(id, name, district)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ProductRow[];
    },
  });
  const { data: farmers = [], error: farmersError } = useQuery({
    queryKey: ["admin-farmers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("farmers").select("id, name, district").order("name");
      if (error) throw error;
      return data;
    },
  });
  const { data: orders = [], error: ordersError } = useQuery({
    queryKey: ["admin-order-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_code, created_at, order_status, payment_status, total_amount, delivery_fee")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  return (
    <section className="mt-10 space-y-5">
      <div>
        <h2 className="font-display text-2xl font-bold">Marketplace listings</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Prices and inventory in DEMO listings remain unverified until confirmed. Unverified products cannot be purchased.
        </p>
      </div>
      {productsError && <p role="alert" className="text-sm text-destructive">{productsError.message}</p>}
      {farmersError && <p role="alert" className="text-sm text-destructive">{farmersError.message}</p>}
      <NewListingForm farmers={farmers} />
      {loadingProducts ? (
        <p className="text-sm text-muted-foreground">Loading listings...</p>
      ) : (
        <div className="space-y-3">
          {products.map((listing) => (
            <ListingEditor key={listing.id} listing={listing} farmers={farmers} />
          ))}
        </div>
      )}

      <div className="pt-6">
        <h2 className="font-display text-2xl font-bold">Recent order history</h2>
        {ordersError && <p role="alert" className="mt-2 text-sm text-destructive">{ordersError.message}</p>}
        <ul className="mt-4 space-y-2">
          {orders.map((order) => (
            <li key={order.id} className="surface-panel flex flex-wrap justify-between gap-2 rounded-xl p-3 text-sm">
              <span>#{order.order_code} · {new Date(order.created_at).toLocaleDateString()} · {order.order_status}</span>
              <span>{order.payment_status} · {rupees(order.total_amount)}</span>
            </li>
          ))}
          {orders.length === 0 && !ordersError && (
            <li className="text-sm text-muted-foreground">No orders found.</li>
          )}
        </ul>
      </div>
    </section>
  );
}
