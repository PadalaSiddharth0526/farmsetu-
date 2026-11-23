-- Buyer quote interest is not an order, payment, or binding acceptance.
create table if not exists public.quote_interests (
 id uuid primary key default gen_random_uuid(),
 group_id uuid not null references public.purchase_groups(id) on delete cascade,
 quote_id uuid not null references public.group_quotes(id) on delete cascade,
 buyer_id uuid not null references auth.users(id) on delete cascade,
 status text not null default 'interested' check (status in ('interested','withdrawn')),
 created_at timestamptz not null default now(),
 unique(group_id,buyer_id)
);
alter table public.quote_interests enable row level security;
create policy "Buyers view own quote interests" on public.quote_interests for select to authenticated using (buyer_id=auth.uid());
create policy "Buyers express own quote interest" on public.quote_interests for insert to authenticated with check (buyer_id=auth.uid() and exists(select 1 from public.group_quotes q where q.id=quote_id and q.group_id=group_id));
create policy "Buyers update own quote interest" on public.quote_interests for update to authenticated using (buyer_id=auth.uid()) with check (buyer_id=auth.uid() and exists(select 1 from public.group_quotes q where q.id=quote_id and q.group_id=group_id));

create table if not exists public.product_research_feedback (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 group_id uuid references public.purchase_groups(id) on delete set null,
 role text not null check(role in ('buyer','farmer')),
 ease_score integer not null check(ease_score between 1 and 5),
 clarity_score integer not null check(clarity_score between 1 and 5),
 trust_score integer not null check(trust_score between 1 and 5),
 issue text not null check(char_length(issue) between 1 and 500),
 suggestion text not null default '' check(char_length(suggestion)<=500),
 created_at timestamptz not null default now()
);
alter table public.product_research_feedback enable row level security;
create policy "Research participants submit own feedback" on public.product_research_feedback for insert to authenticated with check (user_id=auth.uid());
create policy "Research participants view own feedback" on public.product_research_feedback for select to authenticated using (user_id=auth.uid());
