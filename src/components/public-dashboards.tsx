import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Link } from '@tanstack/react-router';
import { BarChart3, Sprout, Users, ShoppingBasket, ArrowUpRight } from 'lucide-react';

const views = ['Admin Intelligence', 'Farmer Business', 'Buyer Savings', 'Product Analytics'];
const colors = ['#16835d', '#5794c4', '#e5a44b', '#9c79bb', '#d16c69'];
type Row = Record<string, unknown>;
const get = (r: Row, ...keys: string[]) => keys.map(k => r[k]).find(v => v !== undefined && v !== null);
const dateOf = (r: Row) => new Date(String(get(r, 'created_at') ?? '')).getTime();

export function PublicDashboards() {
  const [view, setView] = useState(0);
  const [days, setDays] = useState('30');
  const [crop, setCrop] = useState('All');
  // Never query private orders, memberships, personal profiles, or financial records here.
  // All queries use the anonymous user's normal Supabase RLS permissions.
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['crowdquote-public-dashboards'],
    queryFn: async () => {
      const names = ['products', 'purchase_groups', 'group_quotes', 'group_plans'] as const;
      const results = await Promise.all(names.map(name => (supabase as any).from(name).select('*').limit(1000)));
      return Object.fromEntries(names.map((name, i) => [name, {
        rows: (results[i].data ?? []) as Row[],
        error: results[i].error?.message as string | undefined,
      }]));
    },
    staleTime: 60000,
  });
  const { products, groups, quotes, plans, plannedProducts } = useMemo(() => {
    const cutoff = Date.now() - Number(days) * 86400000;
    const filtered = (table: string) => ((data?.[table]?.rows ?? []) as Row[]).filter(r => {
      const d = dateOf(r);
      if (!Number.isFinite(d) || d < cutoff) return false;
      const name = String(get(r, 'crop_name', 'crop', 'product_name', 'category') ?? '').toLowerCase();
      return crop === 'All' || !name || name.includes(crop.toLowerCase());
    });
    return { products: filtered('products').filter(r => r.is_demo !== true && r.supplier_verified === true && r.price_verified === true && r.stock_verified === true && r.status === 'active'), plannedProducts: filtered('products').filter(r => r.status === 'planned'), plans: filtered('group_plans'), groups: filtered('purchase_groups'), quotes: filtered('group_quotes') };
  }, [data, days, crop]);
  const groupsWithQuotes = new Set(quotes.map(r => String(get(r, 'group_id'))));
  const coverage = groups.length ? `${Math.round(groups.filter(g => groupsWithQuotes.has(String(g.id))).length / groups.length * 100)}%` : '—';
  const cards: Array<[string, string | number]> = view === 0
    ? [['Catalogue products', products.length + plannedProducts.length], ['Planned stock (kg)', plannedProducts.reduce((sum,r)=>sum+Number(r.quantity||0),0)], ['Planned buying groups', plans.length], ['Active buying groups', groups.length]]
    : view === 1 ? [['Catalogue products', products.length + plannedProducts.length], ['Active listings', products.filter(r => get(r, 'status') === 'active').length], ['Crops listed', new Set(products.map(r => String(get(r, 'crop_name', 'category') ?? 'Other'))).size], ['Visible quotations', quotes.length]]
    : view === 2 ? [['Buying groups', groups.length], ['Groups with quotations', groups.filter(g => groupsWithQuotes.has(String(g.id))).length], ['Quotations', quotes.length], ['Verified savings', 'Not tracked']]
    : [['Groups created', groups.length], ['Groups with quotations', groups.filter(g => groupsWithQuotes.has(String(g.id))).length], ['Quotation coverage', coverage], ['Retention', 'Not tracked']];
  const chartSource = view === 1 ? products : view === 3 ? quotes : groups;
  const chart = Array.from({ length: 7 }, (_, i) => {
    const now = Date.now();
    const end = now - ((6 - i) / 7) * Number(days) * 86400000;
    const start = now - ((7 - i) / 7) * Number(days) * 86400000;
    return { label: `${i + 1}`, count: chartSource.filter(r => dateOf(r) >= start && dateOf(r) < end).length };
  });
  const categories = products.reduce<Record<string, number>>((acc, r) => {
    const key = String(get(r, 'crop_name', 'category') ?? 'Other'); acc[key] = (acc[key] ?? 0) + 1; return acc;
  }, {});
  const pie = Object.entries(categories).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, value]) => ({ name, value }));
  return <section aria-label="Public marketplace dashboards" className="space-y-7">
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-700 px-6 py-9 text-white shadow-lg sm:px-10"><div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[.2em] text-emerald-200">FarmSetu · Insights center</p><h1 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">A clearer view of farm-to-community commerce.</h1><p className="mt-3 text-sm leading-6 text-emerald-100">Explore marketplace performance, farmer activity, community buying and crop trends. Live figures appear as registered farmers, buyers and groups begin using FarmSetu.</p><div className="mt-6 flex flex-wrap gap-3"><Link to="/overview" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-emerald-950">View overview <ArrowUpRight className="h-4 w-4"/></Link><Link to="/marketplace" className="rounded-xl border border-white/40 px-4 py-2.5 text-sm font-semibold">Browse products</Link></div></div></div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[{icon:BarChart3,title:'Admin intelligence',detail:'Listings, groups and quotations'},{icon:Sprout,title:'Farmer business',detail:'Crop inventory and supply activity'},{icon:Users,title:'Buyer savings',detail:'Community purchases and quotes'},{icon:ShoppingBasket,title:'Product analytics',detail:'Crop mix and demand signals'}].map(({icon:Icon,title,detail})=><div key={title} className="rounded-2xl border bg-card p-4 shadow-sm"><Icon className="h-6 w-6 text-primary"/><h3 className="mt-3 font-semibold">{title}</h3><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div>)}</div>
    <div className="flex flex-wrap gap-3"><Link to="/groups" className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">Find buying groups</Link><Link to="/auth" className="rounded-xl border px-4 py-2.5 text-sm font-semibold">Create an account</Link><Link to="/farmer/sell" className="rounded-xl border px-4 py-2.5 text-sm font-semibold">List farm produce</Link></div>
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-2xl font-bold">Marketplace Intelligence</h2><p className="text-sm text-muted-foreground">Aggregated activity from records visible to your account</p></div><Button variant="outline" disabled={isFetching} onClick={() => refetch()}>{isFetching ? 'Refreshing…' : 'Refresh'}</Button></div>
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Dashboard views">{views.map((name, i) => <button key={name} role="tab" aria-selected={view === i} onClick={() => setView(i)} className={`rounded-xl border px-4 py-2 text-sm font-semibold ${view === i ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}>{name}</button>)}</div>
    <div className="flex flex-wrap gap-3"><label className="text-sm">Period <select aria-label="Date range" className="ml-2 rounded-lg border bg-background p-2" value={days} onChange={e => setDays(e.target.value)}>{['7','30','90','365'].map(d => <option key={d} value={d}>Last {d} days</option>)}</select></label><label className="text-sm">Crop <select aria-label="Crop" className="ml-2 rounded-lg border bg-background p-2" value={crop} onChange={e => setCrop(e.target.value)}>{['All','Rice','Toor Dal','Turmeric','Jowar','Groundnut'].map(c => <option key={c}>{c}</option>)}</select></label></div>

    {isLoading && <p role="status">Loading dashboard data…</p>}
    {data && ['products','purchase_groups','group_quotes'].filter(t => data[t]?.error).map(t => <p key={t} role="status" className="text-sm text-amber-700">{t}: {data[t]?.error}. Public read access may be restricted by Supabase policies.</p>)}
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards.map(([label, value]) => <div key={label} className="surface-panel rounded-2xl p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-extrabold text-primary">{value}</p></div>)}</div>
    <div className="grid gap-4 lg:grid-cols-2"><div className="surface-panel rounded-2xl p-5"><h3 className="mb-4 font-bold">{view === 1 ? 'Listing activity' : view === 3 ? 'Quotation activity' : 'Buying group activity'}</h3><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={chart}><CartesianGrid strokeDasharray="3 3" opacity={0.25}/><XAxis dataKey="label"/><YAxis allowDecimals={false}/><Tooltip/><Bar dataKey="count" fill="#16835d" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div><p className="text-xs text-muted-foreground">Seven time buckets across the selected period</p></div><div className="surface-panel rounded-2xl p-5"><h3 className="mb-4 font-bold">Crop listing distribution</h3>{pie.length ? <div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pie} dataKey="value" nameKey="name" outerRadius={78} label>{pie.map((p,i) => <Cell key={p.name} fill={colors[i % colors.length]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer></div> : <p className="text-sm text-muted-foreground">No visible crop listings for this period.</p>}</div></div>
    <p className="text-xs text-muted-foreground">Public dashboards intentionally exclude private farmer revenue, individual purchase history, member details and raw records. Figures may be incomplete if Supabase row-level security restricts access or if a table exceeds 1,000 records. Actual savings, retention and payments require additional verified tracking.</p>
  </section>;
}
