import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Button } from '@/components/ui/button';

type RecordRow = Record<string, any>;
const colors = ['#16835d','#5794c4','#e5a44b','#9c79bb','#d16c69'];
const tables = ['farmers','products','orders','purchase_groups','group_memberships','group_quotes'] as const;
const titles = ['Admin Intelligence','Farmer Business','Buyer Savings','Product Analytics'];
const money = (n:number) => '₹'+Math.round(n).toLocaleString('en-IN');
const csv = (rows:RecordRow[]) => {
  if (!rows.length) return;
  const fields = Object.keys(rows[0]);
  const contents = [fields.join(','),...rows.map(row=>fields.map(k=>'"'+String(row[k]??'').replace(/"/g,'""')+'"').join(','))].join('\n');
  const url=URL.createObjectURL(new Blob([contents],{type:'text/csv'}));
  const a=document.createElement('a');a.href=url;a.download='crowdquote-dashboard.csv';a.click();URL.revokeObjectURL(url);
};
export function AdminDashboards(){
 const [tab,setTab]=useState(0),[days,setDays]=useState('30'),[crop,setCrop]=useState('All'),[query,setQuery]=useState('');
 const {data, isLoading, refetch, isFetching}=useQuery({queryKey:['crowdquote-dashboard-v1'],queryFn:async()=>{
   const responses=await Promise.all(tables.map(table=>(supabase as any).from(table).select('*').limit(1000)));
   return Object.fromEntries(tables.map((table,i)=>[table,{rows:(responses[i].data??[]) as RecordRow[],error:responses[i].error?.message as string|undefined}]));
 },staleTime:60000});
 const filtered=useMemo(()=>{
   const cutoff=Date.now()-Number(days)*86400000;
   const out:Record<string,RecordRow[]>={};
   for(const table of tables) out[table]=(data?.[table]?.rows??[]).filter(r=>{
     const date=r.created_at?new Date(r.created_at).getTime():NaN;
     const inPeriod=Number.isFinite(date)&&date>=cutoff;
     const cropText=String(r.crop_name??r.crop??r.product_name??'');
     return inPeriod&&(crop==='All'||!cropText||cropText.toLowerCase().includes(crop.toLowerCase()));
   });
   return out;
 },[data,days,crop]);
 const farmers=filtered.farmers??[], products=filtered.products??[],orders=filtered.orders??[],groups=filtered.purchase_groups??[],members=filtered.group_memberships??[],quotes=filtered.group_quotes??[];
 const revenue=orders.reduce((s,r)=>s+Number(r.total_amount||0),0);
 const uniqueGroups=new Set(quotes.map(r=>r.group_id));
 const groupsWithQuotes=groups.filter(r=>uniqueGroups.has(r.id)).length;
 const cards=tab===0?[['Farmers registered',farmers.length],['Buying groups',groups.length],['Quotations',quotes.length],['Order value',money(revenue)]]:tab===1?[['Farmers',farmers.length],['Active listings',products.filter(r=>r.status==='active').length],['Inventory (kg)',products.reduce((s,r)=>s+Number(r.quantity||0),0)],['Orders',orders.length]]:tab===2?[['Group memberships',members.length],['Buying groups',groups.length],['Quotes available',quotes.length],['Orders placed',orders.length]]:[['Groups created',groups.length],['Groups with quotes',groupsWithQuotes],['Quotation coverage',groups.length?Math.round(groupsWithQuotes/groups.length*100)+'%':'—'],['Distinct group buyers',new Set(members.map(r=>r.user_id??r.buyer_id).filter(Boolean)).size]];
 const current=tab===1?products:tab===2?groups:tab===3?quotes:orders;
 const chart=Array.from({length:7},(_,i)=>{
  const date=new Date();date.setDate(date.getDate()-(6-i)*Math.max(1,Math.round(Number(days)/7)));
  const label=date.toLocaleDateString('en-IN',{day:'numeric',month:'short'});
  const source=tab===1?products:tab===2?members:tab===3?quotes:groups;
  const previous=new Date(date);previous.setDate(previous.getDate()-Math.max(1,Math.round(Number(days)/7)));
  return {label,count:source.filter(r=>{const d=new Date(r.created_at).getTime();return d>previous.getTime()&&d<=date.getTime()}).length};
 });
 const categories=products.reduce((acc:Record<string,number>,r)=>{const key=String(r.crop_name||r.category||'Other');acc[key]=(acc[key]||0)+1;return acc;},{});
 const pie=Object.entries(categories).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([name,value])=>({name,value}));
 const visible=current.filter(r=>JSON.stringify(r).toLowerCase().includes(query.toLowerCase())).slice(0,15);
 return <section className="mt-7 space-y-6" aria-label="Interactive procurement dashboards">
  <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-2xl font-bold">Procurement Intelligence</h2><p className="text-sm text-muted-foreground">Live Supabase analytics · records in selected period · up to 1,000 rows per table</p></div><Button variant="outline" onClick={()=>refetch()} disabled={isFetching}>{isFetching?'Refreshing…':'Refresh data'}</Button></div>
  <div className="flex flex-wrap gap-2" role="tablist">{titles.map((name,i)=><button key={name} role="tab" aria-selected={tab===i} onClick={()=>{setTab(i);setQuery('')}} className={'rounded-xl border px-4 py-2 text-sm font-semibold '+(tab===i?'bg-primary text-primary-foreground':'bg-background hover:bg-muted')}>{name}</button>)}</div>
  <div className="flex flex-wrap gap-3"><label className="text-sm">Period <select className="ml-2 rounded-lg border bg-background p-2" value={days} onChange={e=>setDays(e.target.value)}>{['7','30','90','365'].map(d=><option key={d} value={d}>Last {d} days</option>)}</select></label><label className="text-sm">Crop <select className="ml-2 rounded-lg border bg-background p-2" value={crop} onChange={e=>setCrop(e.target.value)}>{['All','Rice','Toor Dal','Turmeric','Jowar','Groundnut'].map(c=><option key={c}>{c}</option>)}</select></label></div>
  {isLoading&&<p role="status">Loading dashboard data…</p>}
  {data&&tables.filter(t=>data[t]?.error).map(t=><p key={t} className="text-sm text-amber-700" role="status">{t}: {data[t]?.error}. Check admin read permissions and migration status.</p>)}
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards.map(([label,value])=><div key={label} className="surface-panel rounded-2xl p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-extrabold text-primary">{value}</p></div>)}</div>
  <div className="grid gap-4 lg:grid-cols-2"><div className="surface-panel rounded-2xl p-5"><h3 className="mb-4 font-bold">{tab===1?'Listing activity':tab===2?'Group participation':tab===3?'Quotation activity':'Group creation activity'}</h3><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={chart}><CartesianGrid strokeDasharray="3 3" opacity={0.25}/><XAxis dataKey="label" fontSize={11}/><YAxis allowDecimals={false}/><Tooltip/><Bar dataKey="count" fill="#16835d" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div></div><div className="surface-panel rounded-2xl p-5"><h3 className="mb-4 font-bold">Crop listing distribution</h3>{pie.length?<div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pie} dataKey="value" nameKey="name" outerRadius={78} label>{pie.map((p,i)=><Cell key={p.name} fill={colors[i%colors.length]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer></div>:<p className="text-sm text-muted-foreground">No crop listings in this period.</p>}<div className="flex flex-wrap gap-2 text-xs">{pie.map((p,i)=><span key={p.name} className="rounded-lg border px-2 py-1"><span style={{color:colors[i%colors.length]}}>●</span> {p.name}: {p.value}</span>)}</div></div></div>
  <div className="surface-panel rounded-2xl p-5"><div className="flex flex-wrap justify-between gap-3"><h3 className="font-bold">Explore underlying records</h3><Button variant="outline" onClick={()=>csv(visible)} disabled={!visible.length}>Export visible CSV</Button></div><input aria-label="Search dashboard records" className="my-4 w-full rounded-xl border bg-background p-3" placeholder="Search records…" value={query} onChange={e=>setQuery(e.target.value)}/><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{['ID','Crop / Name','Status','Date'].map(s=><th key={s} className="border-b p-2">{s}</th>)}</tr></thead><tbody>{visible.map((r,i)=><tr key={String(r.id??i)}><td className="border-b p-2">{String(r.order_code??r.id??'—').slice(0,16)}</td><td className="border-b p-2">{String(r.crop_name??r.name??r.title??'—')}</td><td className="border-b p-2">{String(r.status??r.order_status??'—')}</td><td className="border-b p-2">{r.created_at?new Date(r.created_at).toLocaleDateString('en-IN'):'—'}</td></tr>)}</tbody></table>{!visible.length&&<p className="py-5 text-sm text-muted-foreground">No matching records for this filter.</p>}</div></div>
  <p className="text-xs text-muted-foreground">Reporting note: registration, activity and order value are based on accessible records, not verified payment settlements. Actual savings, retention and funnel conversion need additional baselines and event tracking. Crop filtering applies to tables with crop information; other tables remain period-filtered.</p>
 </section>;
}
