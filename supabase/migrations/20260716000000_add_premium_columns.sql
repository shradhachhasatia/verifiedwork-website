-- Founding-member / premium flag. Set ONLY by the Razorpay webhook (service
-- role); readable by everyone for the badge, never writable by app roles.
alter table public.users add column if not exists premium boolean not null default false;
alter table public.users add column if not exists premium_since timestamptz;
grant select (premium, premium_since) on public.users to anon, authenticated;
