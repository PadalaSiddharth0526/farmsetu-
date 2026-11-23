import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { LayoutDashboard, Sprout, ClipboardList, Plus, Search, Menu, ArrowUpRight, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useMyFarmer, useSession } from '@/lib/session';
import './farmer-dashboard.css';

export const Route = createFileRoute('/farmer/dashboard')({
  head: () => ({ meta: [{ title: 'Farmer Dashboard | FarmSetu' }, { name: 'description', content: 'Manage produce, orders and community procurement on FarmSetu.' }] }),
  component: FarmerDashboard,
});
const photos: Record<string,string> = { rice:'/crowdquote/demo-rice.jpg', chilli:'/crowdquote/demo-red-chillies.jpg', turmeric:'/crowdquote/demo-turmeric.jpg', groundnut:'/crowdquote/demo-groundnuts.jpg' };
function cropPhoto(name:string) { const n=name.toLowerCase(); return n.includes('rice')||n.includes('paddy')?photos.rice:n.includes('chilli')||n.includes('chili')?photos.chilli:n.includes('turmeric')?photos.turmeric:n.includes('groundnut')||n.includes('peanut')?photos.groundnut:undefined; }
const nav = [
  { label:'Overview', icon:LayoutDashboard, href:'/farmer/dashboard' },
];
function FarmerDashboard(){
  const {data:session,isLoading:sessionLoading}=useSession();
  const {data:farmer,isLoading:farmerLoading}=useMyFarmer();
  const client=useQueryClient();
  const [search,setSearch]=useState(''); const [mobile,setMobile]=useState(false);
  const {data:products=[],isLoading:productsLoading}=useQuery({queryKey:['cq-farmer-products',farmer?.id],enabled:!!farmer?.id,queryFn:async()=>{const {data,error}=await supabase.from('products').select('id,crop_name,quality,quantity,price,status,image_url').eq('farmer_id',farmer!.id).order('created_at',{ascending:false});if(error)throw error;return data??[];}});
  const {data:orders=[]}=useQuery({queryKey:['cq-farmer-orders',farmer?.id],enabled:!!farmer?.id,queryFn:async()=>{const {data,error}=await supabase.from('orders').select('total_amount,order_status').eq('farmer_id',farmer!.id);if(error)throw error;return data??[];}});
  const active=products.filter(p=>p.status==='active').length;
  const pending=orders.filter(o=>!['delivered','cancelled'].includes(o.order_status)).length;
  const earnings=orders.filter(o=>o.order_status==='delivered').reduce((sum,o)=>sum+Number(o.total_amount||0),0);
  const filtered=useMemo(()=>products.filter(p=>`${p.crop_name} ${p.quality||''}`.toLowerCase().includes(search.toLowerCase())),[products,search]);
  async function toggle(id:string,status:string){const next=status==='active'?'inactive':'active';const {error}=await supabase.from('products').update({status:next}).eq('id',id).eq('farmer_id',farmer!.id);if(error){toast.error(error.message);return;}toast.success(`Listing ${next==='active'?'activated':'paused'}`);client.invalidateQueries({queryKey:['cq-farmer-products',farmer?.id]});}
  if(sessionLoading||farmerLoading)return <div className="cqfd-loading">Loading farmer dashboard…</div>;
  if(!session)return <div className="cqfd-gate"><h1>Farmer workspace</h1><p>Sign in or register to manage your own produce, respond to buying groups, and track real orders.</p><Link to="/auth" search={{role:"farmer"}}>Register or sign in as a farmer →</Link></div>;
  if(!farmer)return <div className="cqfd-gate"><h1>Complete your farmer profile</h1><p>A farmer profile is required to view your own listings and orders.</p><Link to="/auth" search={{role:'farmer'}}>Farmer registration →</Link></div>;
  return <div className="cqfd">
    <aside className={`cqfd-side ${mobile?'open':''}`}>
      <nav>{nav.map(({label,icon:Icon,href})=><a key={label} href={href} className={label==='Overview'?'selected':''}><Icon size={20}/>{label}</a>)}</nav>
      <div className="cqfd-sidefoot">Growing stronger, together.<small>Telangana farmers → Hyderabad communities</small></div>
    </aside>
    <div className="cqfd-main">
      <header className="cqfd-top"><button className="cqfd-mobile" onClick={()=>setMobile(!mobile)} aria-label="Toggle menu"><Menu/></button><label className="cqfd-search"><Search size={19}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search your produce listings…" /></label><div className="cqfd-user"><span className="cqfd-avatar">🌾</span><div><strong>{farmer.name}</strong><small>{farmer.village?`${farmer.village}, `:''}{farmer.district}</small></div></div></header>
      <div className="cqfd-content">
        {!farmer.approved && <div className="mb-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">Your farmer profile is registered and awaiting marketplace verification. You can manage your profile, but products cannot be offered for purchase until supplier, price and stock checks are completed.</div>}
        <div className="cqfd-welcome"><div><h1>Welcome back, {farmer.name} 👋</h1><p>Manage your produce, respond to demand and grow your business with FarmSetu.</p></div></div>
        <div className="cqfd-metrics">
          <div className="cqfd-metric"><span className="cqfd-metricicon">🌿</span><div><small>Active Listings</small><strong>{active}</strong><em>Currently available</em></div></div>
          <div className="cqfd-metric"><span className="cqfd-metricicon">📦</span><div><small>Total Orders</small><strong>{orders.length}</strong><em>Recorded orders</em></div></div>
          <div className="cqfd-metric"><span className="cqfd-metricicon">📋</span><div><small>Pending Orders</small><strong>{pending}</strong><em>Awaiting completion</em></div></div>
          <div className="cqfd-metric"><span className="cqfd-metricicon">₹</span><div><small>Delivered Sales</small><strong>₹{earnings.toLocaleString('en-IN')}</strong><em>Order totals, not net profit</em></div></div>
        </div>
        <div className="cqfd-two">
          <section className="cqfd-panel"><div className="cqfd-panelhead"><h2><BarChart3 size={21}/> Your farm at a glance</h2></div><div className="cqfd-breakdown"><div><span>Active listings</span><b>{active}</b></div><div><span>Paused listings</span><b>{products.length-active}</b></div><div><span>Delivered orders</span><b>{orders.filter(o=>o.order_status==='delivered').length}</b></div></div><p className="cqfd-note">Metrics reflect your connected Supabase records. No fabricated performance trends.</p></section>
          <section className="cqfd-panel"><div className="cqfd-panelhead"><h2><ClipboardList size={21}/> Community procurement</h2><Link to="/groups">View groups <ArrowUpRight size={17}/></Link></div><p className="cqfd-paneltext">Explore Hyderabad community purchase groups and respond to available bulk buying opportunities.</p><div className="cqfd-shortcuts"><Link to="/groups">Browse demand groups →</Link><Link to="/farmer/orders">Manage orders →</Link><Link to="/soil-test">Soil health tools →</Link></div></section>
        </div>
        <section className="cqfd-panel cqfd-listings"><div className="cqfd-panelhead"><h2><Sprout size={23}/> Your Produce Listings</h2><Link className="cqfd-add" to="/farmer/sell"><Plus size={17}/> Add New Listing</Link></div>
          <div className="cqfd-tablewrap"><table><thead><tr><th>Produce</th><th>Variety / Grade</th><th>Available Quantity</th><th>Price (per kg)</th><th>Status</th><th>Actions</th></tr></thead><tbody>
          {filtered.map(p=><tr key={p.id}><td><div className="cqfd-produce">{cropPhoto(p.crop_name)?<img src={cropPhoto(p.crop_name)} alt={p.crop_name}/>:<span>🌱</span>}<div><b>{p.crop_name}</b><small>Farm produce</small></div></div></td><td>{p.quality||'—'}</td><td>{Number(p.quantity).toLocaleString('en-IN')} kg</td><td><b>₹{Number(p.price).toFixed(2)}</b></td><td><span className={`cqfd-status ${p.status==='active'?'active':''}`}>● {p.status}</span></td><td><button className="cqfd-action" onClick={()=>toggle(p.id,p.status)}>{p.status==='active'?'Pause':'Activate'}</button></td></tr>)}
          {!productsLoading&&filtered.length===0&&<tr><td colSpan={6} className="cqfd-empty">{search?'No matching crops.':'No produce listed yet. Add your first crop to get started.'}</td></tr>}
          {productsLoading&&<tr><td colSpan={6} className="cqfd-empty">Loading listings…</td></tr>}
          </tbody></table></div>
        </section>
      </div>
    </div>
  </div>;
}

