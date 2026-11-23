-- Group purchase lifecycle. Payments remain pending until a verified gateway webhook is implemented.
create table if not exists public.group_orders (
 id uuid primary key default gen_random_uuid(),
 group_id uuid not null references public.purchase_groups(id),
 quote_id uuid not null references public.group_quotes(id),
 buyer_id uuid not null references auth.users(id),
 farmer_id uuid not null references public.farmers(id),
 quantity_kg integer not null check(quantity_kg>0),
 amount numeric(12,2) not null check(amount>0),
 currency text not null default 'INR' check(currency='INR'),
 order_status text not null default 'placed' check(order_status in ('placed','confirmed','packed','dispatched','in_transit','delivered','cancelled')),
 payment_status text not null default 'pending' check(payment_status in ('pending','paid','failed','refunded')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(group_id,buyer_id)
);
create table if not exists public.group_order_events (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references public.group_orders(id) on delete cascade,
 status text not null, actor_id uuid references auth.users(id), note text, created_at timestamptz not null default now()
);
grant select on public.group_orders, public.group_order_events to authenticated;
create index if not exists group_orders_buyer_idx on public.group_orders(buyer_id);
create index if not exists group_orders_farmer_idx on public.group_orders(farmer_id);
alter table public.group_orders enable row level security;
alter table public.group_order_events enable row level security;
create policy "Buyer supplier or admin can read group orders" on public.group_orders for select to authenticated using
 (buyer_id=auth.uid() or farmer_id=public.my_farmer_id() or public.has_role(auth.uid(),'admin'));
create policy "Order participants read history" on public.group_order_events for select to authenticated using
 (exists(select 1 from public.group_orders o where o.id=order_id and (o.buyer_id=auth.uid() or o.farmer_id=public.my_farmer_id() or public.has_role(auth.uid(),'admin'))));
-- Security-definer RPC: never trust client-supplied prices, buyers, farmers or payment flags.
create or replace function public.place_group_order(p_group_id uuid,p_quote_id uuid)
returns uuid language plpgsql security definer set search_path=public as $$
declare g public.purchase_groups%rowtype; q public.group_quotes%rowtype; m public.group_memberships%rowtype; oid uuid; total numeric(12,2);
begin
 if auth.uid() is null then raise exception 'Sign in first'; end if;
 select * into g from public.purchase_groups where id=p_group_id for update;
 if not found or g.status not in ('collecting','quoting','confirmed') then raise exception 'Group not accepting orders'; end if;
 select * into m from public.group_memberships where group_id=p_group_id and buyer_id=auth.uid();
 if not found then raise exception 'Join the group before ordering'; end if;
 select * into q from public.group_quotes where id=p_quote_id and group_id=p_group_id;
 if not found then raise exception 'Invalid quotation'; end if;
 if q.available_kg<g.target_kg then raise exception 'Supplier cannot fulfil group target'; end if;
 total:=round((m.quantity_kg*q.price_per_kg)+(m.quantity_kg::numeric/g.target_kg*q.transport_total),2);
 insert into public.group_orders(group_id,quote_id,buyer_id,farmer_id,quantity_kg,amount)
 values(p_group_id,p_quote_id,auth.uid(),q.farmer_id,m.quantity_kg,total) returning id into oid;
 insert into public.group_order_events(order_id,status,actor_id,note) values(oid,'placed',auth.uid(),'Order placed; payment pending');
 return oid;
exception when unique_violation then raise exception 'You already placed an order in this group';
end $$;
revoke all on function public.place_group_order(uuid,uuid) from public;
grant execute on function public.place_group_order(uuid,uuid) to authenticated;
create or replace function public.advance_group_order(p_order_id uuid,p_status text)
returns void language plpgsql security definer set search_path=public as $$
declare o public.group_orders%rowtype; next_status text;
begin
 select * into o from public.group_orders where id=p_order_id for update;
 if not found then raise exception 'Order not found'; end if;
 if not (o.farmer_id=public.my_farmer_id() or public.has_role(auth.uid(),'admin')) then raise exception 'Not authorized'; end if;
 next_status:=case o.order_status when 'placed' then 'confirmed' when 'confirmed' then 'packed' when 'packed' then 'dispatched' when 'dispatched' then 'in_transit' when 'in_transit' then 'delivered' else null end;
 if p_status is distinct from next_status then raise exception 'Invalid status transition'; end if;
 -- Dispatch and delivery require a verified payment provider in production.
 if p_status in ('dispatched','in_transit','delivered') and o.payment_status<>'paid' then raise exception 'Verified payment required before dispatch'; end if;
 update public.group_orders set order_status=p_status,updated_at=now() where id=p_order_id;
 insert into public.group_order_events(order_id,status,actor_id) values(p_order_id,p_status,auth.uid());
end $$;
revoke all on function public.advance_group_order(uuid,text) from public;
grant execute on function public.advance_group_order(uuid,text) to authenticated;
-- Payment_status is intentionally not writable by browsers. A verified provider webhook is required.
