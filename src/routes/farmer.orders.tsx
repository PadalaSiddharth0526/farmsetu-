import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useMyFarmer, useSession } from "@/lib/session";
import { useI18n } from "@/lib/i18n";
import { ORDER_STATUSES, STATUS_LABEL, rupees } from "@/lib/telangana";

export const Route = createFileRoute("/farmer/orders")({
  head: () => ({
    meta: [
      { title: "Manage Orders — Telangana Farmers" },
      { name: "description", content: "Accept, prepare and deliver customer orders for your farm listings." },
      { property: "og:title", content: "Manage Orders — Telangana Farmers" },
      { property: "og:description", content: "Accept and fulfil customer orders for your produce." },
    ],
  }),
  component: FarmerOrders,
});

function FarmerOrders() {
  const { t, pick, lang } = useI18n();
  const { data: session } = useSession();
  const { data: farmer } = useMyFarmer();
  const queryClient = useQueryClient();

  const { data: orders } = useQuery({
    queryKey: ["farmer-orders", farmer?.id],
    enabled: !!farmer,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("farmer_id", farmer!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const stages = ["placed","accepted","preparing","ready","out_for_delivery","delivered"];
  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from("orders").update({ order_status: status }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    void queryClient.invalidateQueries({ queryKey: ["farmer-orders"] });
    toast.success(pick("Order updated", "ఆర్డర్ నవీకరించబడింది"));
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-muted-foreground">{pick("Please sign in as a farmer.", "రైతుగా లాగిన్ అవ్వండి.")}</p>
        <Button asChild className="mt-6"><Link to="/auth" search={{ role: "farmer" }}>{t("login")}</Link></Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-3xl font-extrabold">{t("manageOrders")}</h1>
      <div className="mt-8 space-y-4">
        {(orders ?? []).length === 0 && (
          <div className="surface-panel grid place-items-center rounded-3xl p-12 text-center text-muted-foreground">
            {pick("No orders yet.", "ఇంకా ఆర్డర్లు లేవు.")}
          </div>
        )}
        {(orders ?? []).map((order) => (
          <article key={order.id} className="surface-panel rounded-3xl p-5">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="min-w-0">
                <p className="truncate font-display font-bold">#{order.order_code}</p>
                <p className="text-xs text-muted-foreground">
                  {order.customer_name} • {order.customer_phone} • {new Date(order.created_at).toLocaleDateString()}
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
            {order.delivery_address && <p className="mt-2 text-sm">📍 {order.delivery_address}</p>}
            <div className="mt-4 flex flex-wrap gap-1">{stages.map((stage,i)=><span key={stage} className={`rounded-lg px-2 py-1 text-xs ${stages.indexOf(order.order_status)>=i?"bg-primary text-primary-foreground":"bg-secondary text-muted-foreground"}`}>{STATUS_LABEL[stage]?.[lang === "te" ? 1 : 0] ?? stage}</span>)}</div>
            <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <Select value={order.order_status} onValueChange={(v) => updateStatus(order.id, v)} disabled={order.order_status === "delivered" || order.order_status === "cancelled"}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.filter(s=>s===order.order_status || s===stages[stages.indexOf(order.order_status)+1]).map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_LABEL[s]?.[lang === "te" ? 1 : 0] ?? s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="font-display text-lg font-bold">{rupees(order.total_amount)}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
