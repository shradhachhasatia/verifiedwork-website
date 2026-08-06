-- Founding-member payment records.
--
-- users.premium is the flag the app reads; this table is the receipt behind it -
-- which Razorpay payment bought the membership, for what, and via which path
-- (the post-payment callback or the webhook backstop). Keeping it separate means
-- a webhook retry or a callback/webhook race can be made idempotent on the
-- primary key instead of duplicating rows.
--
-- Written only by the service role, same as premium itself (see
-- 20260716000000_add_premium_columns.sql). No insert/update policy exists, so
-- even an authenticated user cannot grant themselves membership through the API.

create table if not exists public.founding_members (
  user_id uuid primary key references public.users(id) on delete cascade,
  razorpay_payment_id text,
  razorpay_payment_link_id text,
  amount integer,
  currency text,
  granted_via text not null default 'webhook',
  created_at timestamptz not null default now()
);

alter table public.founding_members enable row level security;

-- Members can see their own receipt; nobody can write through the app roles.
drop policy if exists founding_members_select_own on public.founding_members;
create policy founding_members_select_own on public.founding_members
  for select to authenticated
  using (auth.uid() = user_id);

grant select on public.founding_members to authenticated;
