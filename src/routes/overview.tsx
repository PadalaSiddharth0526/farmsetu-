import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { createFileRoute } from '@tanstack/react-router';
import { PublicOverview } from '@/components/public-overview';

export const Route = createFileRoute('/overview')({
  component: OverviewPage,
  head: () => ({ meta: [{ title: 'Marketplace Overview — FarmSetu' }] }),
});

function OverviewPage() {
  return <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
    <PublicOverview />
    <QaOrderOverview />
  </main>;
}

function QaOrderOverview() {
  const { data = [], isLoading, error } = useQuery({
    queryKey: ['qa-order-overview'],
    queryFn: async () => {
      const { data, error } = await supabase.from('qa_orders').select('code,crop_name,quantity_kg,total_amount,order_status').order('code');
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 30000,
  });
  const counts = { accepted: 0, preparing: 0, out_for_delivery: 0 };
  for (const order of data) {
    if (order.order_status in counts) counts[order.order_status as keyof typeof counts] += 1;
  }
  return <section className="mt-10 rounded-3xl border bg-card p-6">
    <div className="mb-5">
      <h2 className="text-2xl font-bold">Order tracking — test scenarios</h2>
      <p className="mt-1 text-sm text-muted-foreground">These are simulated QA orders, not customer purchases or farmer-confirmed dispatches. Real order totals are tracked separately.</p>
    </div>
    {isLoading && <p>Loading test orders…</p>}
    {error && <p className="text-destructive">Test order dashboard could not load.</p>}
    <div className="grid gap-4 sm:grid-cols-3">
      {([{status:'accepted',title:'Accepted by farmer'},{status:'preparing',title:'Packing in progress'},{status:'out_for_delivery',title:'Dispatched'}] as const).map(item =>
        <div key={item.status} className="rounded-2xl border p-5">
          <p className="text-sm text-muted-foreground">{item.title}</p>
          <p className="mt-2 text-3xl font-bold">{counts[item.status]}</p>
          <p className="text-xs text-muted-foreground">Test orders</p>
        </div>)}
    </div>
    <div className="mt-5 overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead><tr className="border-b"><th className="py-2">Test order</th><th>Product</th><th>Quantity</th><th>Amount</th><th>Status</th></tr></thead>
        <tbody>{data.map(o=><tr key={o.code} className="border-b last:border-0">
          <td className="py-2 font-medium">{o.code}</td><td>{o.crop_name}</td><td>{o.quantity_kg} kg</td>
          <td>₹{Number(o.total_amount).toLocaleString('en-IN')}</td><td>{o.order_status==='out_for_delivery'?'Dispatched':o.order_status==='preparing'?'Packing':'Accepted'}</td>
        </tr>)}</tbody>
      </table>
    </div>
  </section>;
}
