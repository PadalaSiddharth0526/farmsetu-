import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useMyFarmer, useSession } from "@/lib/session";
import { useI18n } from "@/lib/i18n";
import { CATEGORIES, CROP_IMAGES, QUALITY_GRADES, UNITS } from "@/lib/telangana";

export const Route = createFileRoute("/farmer/sell")({
  head: () => ({
    meta: [
      { title: "Sell My Crop — Telangana Farmers" },
      { name: "description", content: "List your harvest with your own price and sell directly to customers with zero commission." },
      { property: "og:title", content: "Sell My Crop — Telangana Farmers" },
      { property: "og:description", content: "List your harvest and sell direct with zero commission." },
    ],
  }),
  component: SellPage,
});

function SellPage() {
  const { t, pick } = useI18n();
  const { data: session } = useSession();
  const { data: farmer } = useMyFarmer();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    crop_name: "",
    crop_name_te: "",
    category: "vegetables",
    price: "",
    unit: "kg",
    quantity: "",
    min_order: "1",
    pack_sizes: "1, 5, 10, 25",
    quality: "A",
    harvest_date: "",
    description: "",
    image_url: CROP_IMAGES[0]!.url,
    organic: false,
  });

  function set(key: keyof typeof form, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!farmer) {
      toast.error(pick("Farmer profile not found.", "రైతు ప్రొఫైల్ కనబడలేదు."));
      return;
    }
    const minOrder = Number(form.min_order);
    const packSizes = [...new Set(form.pack_sizes.split(",").map((value) => Number(value.trim())).filter((value) => Number.isFinite(value) && value > 0))].sort((a, b) => a - b);
    if (!packSizes.includes(minOrder)) {
      toast.error("Allowed pack sizes must include the minimum order.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("products").insert({
      farmer_id: farmer.id,
      crop_name: form.crop_name,
      crop_name_te: form.crop_name_te || null,
      district: farmer.district,
      category: form.category,
      price: Number(form.price),
      unit: form.unit,
      quantity: Number(form.quantity),
      min_order: minOrder,
      pack_sizes: packSizes,
      low_stock_threshold: 0,
      supplier_verified: false,
      price_verified: false,
      stock_verified: false,
      organic_verified: false,
      quality: form.quality,
      harvest_date: form.harvest_date || null,
      description: form.description || null,
      image_url: form.image_url,
      organic: form.organic,
      location: farmer.village ? `${farmer.village}, ${farmer.district}` : farmer.district,
      status: "active",
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(pick("Product listed!", "ఉత్పత్తి జాబితా చేయబడింది!"));
    navigate({ to: "/marketplace" });
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-muted-foreground">{pick("Please sign in as a farmer to sell.", "అమ్మడానికి రైతుగా లాగిన్ అవ్వండి.")}</p>
        <Button asChild className="mt-6"><Link to="/auth" search={{ role: "farmer" }}>{t("login")}</Link></Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-3xl font-extrabold">{t("sellMyCrop")}</h1>
      <form onSubmit={submit} className="surface-panel mt-8 grid gap-5 rounded-3xl p-6 sm:grid-cols-2">
        <div>
          <Label htmlFor="crop">{pick("Crop name (English)", "పంట పేరు (ఇంగ్లీష్)")}</Label>
          <Input id="crop" required value={form.crop_name} onChange={(e) => set("crop_name", e.target.value)} className="mt-1.5 h-12" />
        </div>
        <div>
          <Label htmlFor="crop-te">{pick("Crop name (Telugu)", "పంట పేరు (తెలుగు)")}</Label>
          <Input id="crop-te" value={form.crop_name_te} onChange={(e) => set("crop_name_te", e.target.value)} className="mt-1.5 h-12" />
        </div>
        <div>
          <Label>{pick("Category", "వర్గం")}</Label>
          <Select value={form.category} onValueChange={(v) => set("category", v)}>
            <SelectTrigger className="mt-1.5 h-12"><SelectValue /></SelectTrigger>
            <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{pick(c.en, c.te)}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>{pick("Quality grade", "నాణ్యత గ్రేడ్")}</Label>
          <Select value={form.quality} onValueChange={(v) => set("quality", v)}>
            <SelectTrigger className="mt-1.5 h-12"><SelectValue /></SelectTrigger>
            <SelectContent>{QUALITY_GRADES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="price">{t("price")} (₹)</Label>
          <Input id="price" required inputMode="decimal" value={form.price} onChange={(e) => set("price", e.target.value)} className="mt-1.5 h-12" />
        </div>
        <div>
          <Label>{pick("Unit", "యూనిట్")}</Label>
          <Select value={form.unit} onValueChange={(v) => set("unit", v)}>
            <SelectTrigger className="mt-1.5 h-12"><SelectValue /></SelectTrigger>
            <SelectContent>{UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="qty">{t("quantity")}</Label>
          <Input id="qty" required inputMode="decimal" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} className="mt-1.5 h-12" />
        </div>
        <div>
          <Label htmlFor="minorder">{pick("Minimum order", "కనీస ఆర్డర్")}</Label>
          <Input id="minorder" inputMode="decimal" value={form.min_order} onChange={(e) => set("min_order", e.target.value)} className="mt-1.5 h-12" />
        </div>
        <div>
          <Label htmlFor="packs">{pick("Available pack sizes", "అందుబాటులో ఉన్న ప్యాక్ పరిమాణాలు")}</Label>
          <Input id="packs" required value={form.pack_sizes} onChange={(e) => set("pack_sizes", e.target.value)} className="mt-1.5 h-12" placeholder="5, 10, 15" />
        </div>
        <div>
          <Label htmlFor="harvest">{pick("Harvest date", "కోత తేదీ")}</Label>
          <Input id="harvest" type="date" value={form.harvest_date} onChange={(e) => set("harvest_date", e.target.value)} className="mt-1.5 h-12" />
        </div>
        <div className="flex items-center justify-between rounded-2xl bg-secondary p-3">
          <Label htmlFor="organic">{t("organic")}</Label>
          <Switch id="organic" checked={form.organic} onCheckedChange={(v) => set("organic", v)} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="desc">{pick("Description", "వివరణ")}</Label>
          <Textarea id="desc" rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} className="mt-1.5" />
        </div>
        <div className="sm:col-span-2">
          <Label>{pick("Choose a photo", "ఫోటో ఎంచుకోండి")}</Label>
          <div className="mt-2 grid grid-cols-3 gap-3 sm:grid-cols-6">
            {CROP_IMAGES.map((img) => (
              <button
                key={img.url}
                type="button"
                onClick={() => set("image_url", img.url)}
                className={`overflow-hidden rounded-2xl border-2 ${form.image_url === img.url ? "border-primary" : "border-transparent"}`}
              >
                <img src={img.url} alt={img.label} loading="lazy" className="h-20 w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" size="lg" className="w-full" disabled={saving}>{t("addProduct")}</Button>
        </div>
      </form>
    </div>
  );
}
