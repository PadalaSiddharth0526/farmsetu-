-- Catalogue estimates and procurement planning: not verified inventory, not buyer accounts.
create unique index if not exists products_listing_key_unique_idx on public.products(listing_key) where listing_key is not null;
create table if not exists public.farmer_onboarding_leads(id uuid primary key default gen_random_uuid(),name text not null unique,district text,status text not null default 'invited',created_at timestamptz default now());
alter table public.farmer_onboarding_leads enable row level security;
revoke all on public.farmer_onboarding_leads from anon,authenticated;
create table if not exists public.group_plans(id uuid primary key default gen_random_uuid(),title text not null unique,crop text not null,source_district text not null,community text not null,pack_kg integer not null,target_kg integer not null,status text not null default 'planning',created_at timestamptz default now());
alter table public.group_plans enable row level security;
revoke all on public.group_plans from anon,authenticated;
grant select on public.group_plans to anon,authenticated;
drop policy if exists "Public read group plans" on public.group_plans;
create policy "Public read group plans" on public.group_plans for select to anon,authenticated using(true);
insert into public.farmer_onboarding_leads(name) values ('Busarapu Lingamurthy'),('Balasani Komuraiah'),('Gollepalli Pravin Yadav') on conflict(name) do nothing;
insert into public.group_plans(title,crop,source_district,community,pack_kg,target_kg) values
('Sona Masoori bulk-buy interest','Sona Masoori Rice','Peddapalli','Hyderabad communities',25,500),
('BPT 5204 rice bulk-buy interest','BPT 5204 Rice','Khammam','Hyderabad communities',25,500),
('Turmeric community sourcing','Turmeric','Nizamabad','Hyderabad communities',5,100),
('Red chillies community sourcing','Red Chillies','Khammam','Hyderabad communities',5,100),
('Groundnut community sourcing','Groundnut','Mahabubnagar','Hyderabad communities',5,100)
on conflict(title) do nothing;
-- Rows intentionally have status=planned, no farmer_id and verification flags false.
insert into public.products(listing_key,crop_name,variety,category,district,quantity,price,min_order,pack_sizes,unit,status,is_demo,supplier_verified,price_verified,stock_verified,quality,image_url,description) values
('farmsetu-plan-groundnut','Groundnut','Groundnut','oilseeds','Mahabubnagar',100,121,5,array[5,10,15]::numeric[],'kg','planned',false,false,false,false,'A','/crowdquote/demo-groundnuts.jpg','Indicative offer pending farmer confirmation.'),
('farmsetu-plan-red-chillies','Red Chillies','Red Chillies','spices','Khammam',100,246,5,array[5,10,15]::numeric[],'kg','planned',false,false,false,false,'A','/crowdquote/demo-red-chillies.jpg','Indicative offer pending farmer confirmation.'),
('farmsetu-plan-turmeric','Turmeric','Turmeric','spices','Nizamabad',100,221,5,array[5,10,15]::numeric[],'kg','planned',false,false,false,false,'A','/crowdquote/demo-turmeric.jpg','Indicative offer pending farmer confirmation.'),
('farmsetu-plan-sona-masoori','Rice','Sona Masoori','grains','Peddapalli',500,64,25,array[25,50,75,100]::numeric[],'kg','planned',false,false,false,false,'A','/crowdquote/demo-rice.jpg','Indicative offer pending farmer confirmation.'),
('farmsetu-plan-bpt-5204','Rice','BPT 5204','grains','Khammam',500,60,25,array[25,50,75,100]::numeric[],'kg','planned',false,false,false,false,'A','/crowdquote/demo-rice.jpg','Indicative offer pending farmer confirmation.'),
('farmsetu-plan-telangana-sona','Rice','Telangana Sona (RNR 15048)','grains','Siddipet',500,58,25,array[25,50,75,100]::numeric[],'kg','planned',false,false,false,false,'A','/crowdquote/demo-rice.jpg','Indicative offer pending farmer confirmation.')
on conflict(listing_key) where listing_key is not null do nothing;
create table if not exists public.order_status_events(id uuid primary key default gen_random_uuid(),order_id uuid not null references public.orders(id) on delete cascade,status text not null,actor_id uuid references auth.users(id),created_at timestamptz default now());
alter table public.order_status_events enable row level security;
revoke all on public.order_status_events from anon,authenticated;
grant select on public.order_status_events to authenticated;
drop policy if exists "Participants view order events" on public.order_status_events;
create policy "Participants view order events" on public.order_status_events for select to authenticated using(exists(select 1 from public.orders o where o.id=order_id and (o.customer_id=auth.uid() or o.farmer_id=public.my_farmer_id() or public.has_role(auth.uid(),'admin'))));
create or replace function public.track_order_status() returns trigger language plpgsql security definer set search_path=public as $$
declare expected text;
begin
 if new.customer_id is distinct from old.customer_id or new.farmer_id is distinct from old.farmer_id or new.total_amount is distinct from old.total_amount or new.payment_status is distinct from old.payment_status then raise exception 'Order ownership, price and payment cannot be changed from farmer dashboard'; end if;
 if new.order_status is distinct from old.order_status then
 if not (old.farmer_id=public.my_farmer_id() or public.has_role(auth.uid(),'admin')) then raise exception 'Only assigned farmer can advance order'; end if;
 expected:=case old.order_status when 'placed' then 'accepted' when 'accepted' then 'preparing' when 'preparing' then 'ready' when 'ready' then 'out_for_delivery' when 'out_for_delivery' then 'delivered' else null end;
 if new.order_status is distinct from expected then raise exception 'Complete current stage first'; end if;
 insert into public.order_status_events(order_id,status,actor_id) values(new.id,new.order_status,auth.uid());
 end if;return new;
end $$;
drop trigger if exists track_order_status_trigger on public.orders;
create trigger track_order_status_trigger before update on public.orders for each row execute function public.track_order_status();
revoke all on function public.track_order_status() from public,anon,authenticated;
