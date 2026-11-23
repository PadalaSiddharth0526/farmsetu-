import { useState } from "react";
import { AdminDashboards } from "@/components/admin-dashboards";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin, useSession } from "@/lib/session";
import { useI18n } from "@/lib/i18n";
import { rupees } from "@/lib/telangana";
import { AdminListingManager } from "@/components/admin-listing-manager";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Overview — Telangana Farmers" },
      { name: "description", content: "Platform overview of farmers, listings and orders on Telangana Farmers." },
      { property: "og:title", content: "Admin Overview — Telangana Farmers" },
      { property: "og:description", content: "Platform overview of farmers, listings and orders." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [overviewTab, setOverviewTab] = useState<"overview" | "dashboards">("overview");
  const { t, pick } = useI18n();
  const { data: session } = useSession();
  const { data: isAdmin, isLoading } = useIsAdmin();

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    enabled: !!isAdmin,
    queryFn: async () => {
      const [farmers, products, orders] = await Promise.all([
        supabase.from("farmers").select("id", { count: "exact", head: true }),
        supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("orders").select("total_amount"),
      ]);
      return {
        farmers: farmers.count ?? 0,
        products: products.count ?? 0,
        orders: orders.data?.length ?? 0,
        gmv: (orders.data ?? []).reduce((s, o) => s + Number(o.total_amount), 0),
      };
    },
  });

  if (!session) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-muted-foreground">{pick("Please sign in.", "లాగిన్ అవ్వండి.")}</p>
        <Button asChild className="mt-6"><Link to="/auth">{t("login")}</Link></Button>
      </div>
    );
  }

  if (!isLoading && !isAdmin) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center text-muted-foreground">
        {pick("You do not have admin access.", "మీకు అడ్మిన్ అనుమతి లేదు.")}
      </div>
    );
  }

  const cards = [
    { label: pick("Farmers", "రైతులు"), value: stats?.farmers ?? 0 },
    { label: t("activeListings"), value: stats?.products ?? 0 },
    { label: t("orders"), value: stats?.orders ?? 0 },
    { label: pick("Order value", "ఆర్డర్ విలువ"), value: rupees(stats?.gmv ?? 0) },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-3xl font-extrabold">{t("admin")}</h1>
      <div className="mt-6 flex gap-2 border-b pb-3" role="tablist" aria-label="Admin Overview sections">
        <Button role="tab" aria-selected={overviewTab === "overview"} variant={overviewTab === "overview" ? "default" : "outline"} onClick={() => setOverviewTab("overview")}>Overview</Button>
        <Button role="tab" aria-selected={overviewTab === "dashboards"} variant={overviewTab === "dashboards" ? "default" : "outline"} onClick={() => setOverviewTab("dashboards")}>Dashboards</Button>
      </div>
      {overviewTab === "dashboards" ? <AdminDashboards /> : <>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="surface-panel rounded-3xl p-5">
            <p className="text-sm text-muted-foreground">{c.label}</p>
            <p className="mt-2 font-display text-3xl font-extrabold text-primary">{c.value}</p>
          </div>
        ))}
      </div>
      <AdminListingManager />
      </>}
    </div>
  );
}
