import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useSession } from "@/lib/session";
import { useI18n } from "@/lib/i18n";
import { rupees, STATUS_LABEL } from "@/lib/telangana";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "My Account & Orders — Telangana Farmers" },
      { name: "description", content: "Track your farm-direct orders and manage your Telangana Farmers profile." },
      { property: "og:title", content: "My Account & Orders — Telangana Farmers" },
      { property: "og:description", content: "Track your farm-direct orders in one place." },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { t, pick, lang } = useI18n();
  const { data: session } = useSession();
  const { data: profile } = useProfile();

  const { data: orders } = useQuery({
    queryKey: ["my-orders", session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*), farmers(name, district)")
        .eq("customer_id", session!.user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const stages = ["placed","accepted","preparing","ready","out_for_delivery","delivered"];
  if (!session) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-muted-foreground">{pick("Please sign in to view your account.", "మీ ఖాతా చూడటానికి లాగిన్ అవ్వండి.")}</p>
        <Button asChild className="mt-6"><Link to="/auth">{t("login")}</Link></Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-3xl font-extrabold">{pick("My Account", "నా ఖాతా")}</h1>
      <p className="mt-2 text-muted-foreground">{profile?.name} • {profile?.email}</p>

      <h2 className="mt-10 font-display text-2xl font-bold">{t("orders")}</h2>
      <div className="mt-5 space-y-4">
        {(orders ?? []).length === 0 && (
          <div className="surface-panel grid place-items-center rounded-3xl p-12 text-center">
            <p className="text-muted-foreground">{pick("No orders yet.", "ఇంకా ఆర్డర్లు లేవు.")}</p>
            <Button asChild className="mt-5"><Link to="/marketplace">{t("buyFresh")}</Link></Button>
          </div>
        )}
        {(orders ?? []).map((order) => (
          <article key={order.id} className="surface-panel rounded-3xl p-5">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="min-w-0">
                <p className="truncate font-display font-bold">#{order.order_code}</p>
                <p className="text-xs text-muted-foreground">
                  {order.farmers?.name} • {new Date(order.created_at).toLocaleDateString()}
                </p>
              </div>
              <Badge variant="secondary" className="shrink-0">
                {STATUS_LABEL[order.order_status]?.[lang === "te" ? 1 : 0] ?? order.order_status}
              </Badge>
            </div>
            <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
              {order.order_items?.map((i) => (
                <li key={i.id}>{i.crop_name} × {i.quantity} {i.unit} — {rupees(i.price * i.quantity)}</li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-1" aria-label="Order tracking stages">{stages.map((stage,i)=><span key={stage} className={`rounded-lg px-2 py-1 text-xs ${stages.indexOf(order.order_status)>=i?"bg-primary text-primary-foreground":"bg-secondary text-muted-foreground"}`}>{STATUS_LABEL[stage]?.[lang === "te" ? 1 : 0] ?? stage}</span>)}</div>
            <p className="mt-3 font-display text-lg font-bold">{rupees(order.total_amount)}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
