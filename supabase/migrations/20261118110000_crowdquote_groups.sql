-- CrowdQuote community procurement. Apply after existing Farm migrations.
create extension if not exists pgcrypto;
create table if not exists public.purchase_groups (
 id uuid primary key default gen_random_uuid(), creator_id uuid not null references auth.users(id),
 title text not null check(length(title) between 3 and 120),
 crop text not null, source_district text not null default 'Telangana',
 community text not null, delivery_city text not null default 'Hyderabad',
 pack_kg integer not null check(pack_kg in (5,10,15,25,50,75,100)),
 target_kg integer not null check(target_kg between 25 and 100000),
 status text not null default 'collecting' check(status in ('collecting','quoting','confirmed','closed','cancelled')),
 created_at timestamptz not null default now(), deadline timestamptz not null default (now()+interval '14 days'),
 constraint valid_crop_pack check ((lower(crop) like '%rice%' and pack_kg in (25,50,75,100)) or (lower(crop) not like '%rice%' and pack_kg in (5,10,15)))
);
create table if not exists public.group_memberships (
 id uuid primary key default gen_random_uuid(), group_id uuid not null references public.purchase_groups(id) on delete cascade,
 buyer_id uuid not null references auth.users(id), quantity_kg integer not null check(quantity_kg > 0),
 created_at timestamptz not null default now(), unique(group_id,buyer_id)
);
create table if not exists public.group_quotes (
 id uuid primary key default gen_random_uuid(), group_id uuid not null references public.purchase_groups(id) on delete cascade,
 farmer_id uuid not null references public.farmers(id),
 price_per_kg numeric(12,2) not null check(price_per_kg > 0),
 transport_total numeric(12,2) not null default 0 check(transport_total >= 0),
 grade text not null, notes text, available_kg integer not null check(available_kg > 0),
 created_at timestamptz not null default now(), unique(group_id,farmer_id)
);
create index if not exists group_memberships_group_idx on public.group_memberships(group_id);
create index if not exists group_quotes_group_idx on public.group_quotes(group_id);
alter table public.purchase_groups enable row level security;
alter table public.group_memberships enable row level security;
alter table public.group_quotes enable row level security;
create policy "Read public groups" on public.purchase_groups for select using (true);
create policy "Authenticated create groups" on public.purchase_groups for insert to authenticated with check (creator_id = auth.uid() and status='collecting');
create policy "Read group demand" on public.group_memberships for select to authenticated using (true);
create policy "Read quotations" on public.group_quotes for select to authenticated using (true);
create policy "Farmers submit their own quotes" on public.group_quotes for insert to authenticated
 with check (exists (select 1 from public.farmers f where f.id=farmer_id and f.user_id=auth.uid())
 and exists (select 1 from public.purchase_groups g where g.id=group_id and g.status in ('collecting','quoting')));
create policy "Farmers update own quotes" on public.group_quotes for update to authenticated
 using (exists (select 1 from public.farmers f where f.id=farmer_id and f.user_id=auth.uid()))
 with check (exists (select 1 from public.farmers f where f.id=farmer_id and f.user_id=auth.uid()));
-- Atomic membership update: validates status, allowed pack and group target under row lock.
create or replace function public.join_purchase_group(p_group_id uuid, p_quantity_kg integer)
returns uuid language plpgsql security definer set search_path = public as $$
declare g public.purchase_groups%rowtype; total_kg integer; membership_id uuid;
begin
 if auth.uid() is null then raise exception 'Sign in to join a group'; end if;
 select * into g from public.purchase_groups where id=p_group_id for update;
 if not found or g.status <> 'collecting' or g.deadline <= now() then raise exception 'Group is not accepting members'; end if;
 if p_quantity_kg <= 0 or mod(p_quantity_kg,g.pack_kg) <> 0 then raise exception 'Quantity must be a positive multiple of pack size'; end if;
 select coalesce(sum(quantity_kg),0) into total_kg from public.group_memberships where group_id=p_group_id;
 if total_kg + p_quantity_kg > g.target_kg then raise exception 'Quantity exceeds remaining group target'; end if;
 insert into public.group_memberships(group_id,buyer_id,quantity_kg)
 values(p_group_id,auth.uid(),p_quantity_kg) returning id into membership_id;
 return membership_id;
exception when unique_violation then raise exception 'You have already joined this group';
end $$;
revoke all on function public.join_purchase_group(uuid,integer) from public;
grant execute on function public.join_purchase_group(uuid,integer) to authenticated;
