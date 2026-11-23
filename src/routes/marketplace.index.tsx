import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard, type ProductRow } from "@/components/product-card";
import { DISTRICTS } from "@/lib/telangana";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/marketplace/")({
  head: () => ({
    meta: [
      { title: "Farmer Marketplace — Buy Fresh Telangana Produce" },
      {
        name: "description",
        content: "Buy vegetables, fruits, grains and pulses directly from Telangana farmers at farm-gate prices.",
      },
      { property: "og:title", content: "Farmer Marketplace — Buy Fresh Telangana Produce" },
      { property: "og:description", content: "Fresh produce direct from Telangana farmers, no middlemen." },
    ],
  }),
  component: MarketplacePage,
});

function MarketplacePage() {
  const { t, pick } = useI18n();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [district, setDistrict] = useState("all");
  const [organic, setOrganic] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [availability, setAvailability] = useState("all");
  const [sort, setSort] = useState("newest");
  const marketplaceCategories = [
    { value: "groundnut", en: "Groundnut", te: "వేరుశెనగ" },
    { value: "chilli", en: "Red Chillies", te: "ఎర్ర మిరపకాయలు" },
    { value: "turmeric", en: "Turmeric", te: "పసుపు" },
    { value: "rice", en: "Rice", te: "బియ్యం" },
  ];

  const supabaseConfigured = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
  const { data, isLoading, isError } = useQuery({
    enabled: supabaseConfigured,
    queryKey: ["products"],
    queryFn: async () => {
      const { error: reservationError } = await supabase.rpc(
        "release_expired_marketplace_reservations",
      );
      if (reservationError) console.warn("Reservation cleanup unavailable:", reservationError.message);
      const { data, error } = await supabase
        .from("products")
        .select("*, farmers(name, district, village)")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const allowedNames = ["Groundnut", "Groundnuts", "Red Chillies", "Red Chilli", "Turmeric", "Rice"];
      return (data ?? []).filter((row) =>
        allowedNames.some((name) => String(row.crop_name).toLowerCase().includes(name.toLowerCase())),
      ) as unknown as ProductRow[];
    },
  });

  const products = useMemo(() => {
    let list = (data ?? []).filter(p => !p.is_demo && p.farmer_id !== null && p.supplier_verified && p.price_verified && p.stock_verified);
    if (q.trim()) {
      const term = q.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.crop_name.toLowerCase().includes(term) ||
          (p.crop_name_te ?? "").includes(term) ||
          (p.variety ?? "").toLowerCase().includes(term) ||
          (p.district ?? p.farmers?.district ?? "").toLowerCase().includes(term) ||
          (p.supplier_verified ? (p.farmers?.name ?? "").toLowerCase().includes(term) : false),
      );
    }
    if (category !== "all") {
      list = list.filter((p) => {
        const name = p.crop_name.toLowerCase();
        if (category === "groundnut") return name.includes("groundnut");
        if (category === "chilli") return name.includes("chilli") || name.includes("chili");
        if (category === "turmeric") return name.includes("turmeric");
        return name.includes("rice");
      });
    }
    if (district !== "all")
      list = list.filter((p) => (p.district ?? p.farmers?.district) === district);
    if (organic) list = list.filter((p) => p.organic && p.organic_verified);
    if (minPrice) list = list.filter((p) => Number(p.price) >= Number(minPrice));
    if (maxPrice) list = list.filter((p) => Number(p.price) <= Number(maxPrice));
    if (availability === "available")
      list = list.filter((p) => p.status === "active" && p.quantity - (p.reserved_quantity ?? 0) > 0);
    if (availability === "unavailable")
      list = list.filter((p) => p.status !== "active" || p.quantity - (p.reserved_quantity ?? 0) <= 0);
    if (sort === "price_asc") list = [...list].sort((a, b) => Number(a.price) - Number(b.price));
    if (sort === "price_desc") list = [...list].sort((a, b) => Number(b.price) - Number(a.price));
    if (sort === "name") {
      list = [...list].sort((a, b) =>
        `${a.crop_name} ${a.variety ?? ""}`.localeCompare(`${b.crop_name} ${b.variety ?? ""}`),
      );
    }
    return list;
  }, [data, supabaseConfigured, q, category, district, organic, minPrice, maxPrice, availability, sort]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="font-display text-3xl font-extrabold sm:text-4xl">{t("marketplace")}</h1>
      <p className="mt-2 text-muted-foreground">
        {pick("Fresh produce direct from Telangana farmers.", "తెలంగాణ రైతుల నుంచి నేరుగా తాజా ఉత్పత్తులు.")}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-secondary p-4"><div><strong>Buy together, save together</strong><p className="text-sm text-muted-foreground">Explore Hyderabad community purchase groups and bulk quantity targets.</p></div><Button asChild><Link to="/groups">Explore group buying</Link></Button></div>

      {!supabaseConfigured && <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">Marketplace is temporarily unavailable while the live database connection is configured.</div>}
      {supabaseConfigured && isError && <div className="mt-5 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900">Could not load products from Supabase. Check your .env credentials and apply the catalog migrations. Please try again later.</div>}
      <div className="relative mt-6">
        <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("search")}
          className="h-14 rounded-2xl pl-12 text-base"
        />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="surface-panel h-fit rounded-3xl p-5">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold">
            <SlidersHorizontal className="h-4 w-4" /> {pick("Filters", "వడపోతలు")}
          </h2>

          <div className="mt-4 space-y-4">
            <div>
              <Label>{pick("Category", "వర్గం")}</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1.5 h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{pick("All categories", "అన్ని వర్గాలు")}</SelectItem>
                  {marketplaceCategories.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{pick(c.en, c.te)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{t("district")}</Label>
              <Select value={district} onValueChange={setDistrict}>
                <SelectTrigger className="mt-1.5 h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{pick("All districts", "అన్ని జిల్లాలు")}</SelectItem>
                  {DISTRICTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="minprice">{pick("Min price (₹/kg)", "కనిష్ఠ ధర (₹/కిలో)")}</Label>
              <Input id="minprice" type="number" min="0" inputMode="decimal" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="mt-1.5 h-11" placeholder="0" />
              <Label htmlFor="maxprice" className="mt-3 block">{pick("Max price (₹/kg)", "గరిష్ఠ ధర (₹/కిలో)")}</Label>
              <Input id="maxprice" type="number" min="0" inputMode="decimal" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="mt-1.5 h-11" placeholder="100" />
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-secondary p-3">
              <Label htmlFor="organic-switch" className="cursor-pointer">{t("organic")}</Label>
              <Switch id="organic-switch" checked={organic} onCheckedChange={setOrganic} />
            </div>

            <div>
              <Label>{pick("Availability", "లభ్యత")}</Label>
              <Select value={availability} onValueChange={setAvailability}>
                <SelectTrigger className="mt-1.5 h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{pick("Any availability", "ఏదైనా")}</SelectItem>
                  <SelectItem value="available">{pick("In stock", "స్టాక్‌లో ఉంది")}</SelectItem>
                  <SelectItem value="unavailable">{pick("Out of stock", "స్టాక్ లేదు")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{pick("Sort by", "క్రమబద్ధీకరణ")}</Label>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="mt-1.5 h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">{pick("Newest", "కొత్తవి")}</SelectItem>
                  <SelectItem value="price_asc">{pick("Price: low to high", "ధర: తక్కువ నుంచి")}</SelectItem>
                  <SelectItem value="price_desc">{pick("Price: high to low", "ధర: ఎక్కువ నుంచి")}</SelectItem>
                  <SelectItem value="name">{pick("Name", "పేరు")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setQ("");
                setCategory("all");
                setDistrict("all");
                setOrganic(false);
                setMinPrice("");
                setMaxPrice("");
                setAvailability("all");
                setSort("newest");
              }}
            >
              {pick("Clear filters", "వడపోతలు తొలగించు")}
            </Button>
          </div>
        </aside>

        <div>
          <p className="text-sm text-muted-foreground">
            {products.length} {pick("products available", "ఉత్పత్తులు అందుబాటులో")}
          </p>
          {supabaseConfigured && isLoading ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-80 rounded-3xl" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="surface-panel mt-5 grid place-items-center rounded-3xl p-14 text-center">
              <p className="text-muted-foreground">
                {pick("No products match your filters yet.", "మీ వడపోతలకు సరిపోయే ఉత్పత్తులు లేవు.")}
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
