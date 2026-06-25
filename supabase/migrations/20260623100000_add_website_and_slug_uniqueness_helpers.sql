-- 1) Personal/company website on the profile.
alter table public.users add column if not exists website_url text;

-- Match the per-column SELECT grants used elsewhere (email stays hidden); the
-- public profile page (anon) and the owner (authenticated) both read it.
grant select (website_url) on public.users to anon, authenticated;
-- INSERT/UPDATE are already granted at table level, so writes are covered.

-- 2) Username (slug) uniqueness helpers. RLS hides other users' un-onboarded
-- rows, so a normal query can't reliably tell whether a handle is free. These
-- run SECURITY DEFINER to check the whole table, and only ever return a boolean
-- or a derived handle (slugs are already public), never private data.
create or replace function public.slug_available(p_slug text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select not exists (
    select 1 from public.users
    where slug = lower(p_slug)
      and id <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
  );
$$;

create or replace function public.suggest_slug(p_base text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  base text;
  candidate text;
  n int := 1;
begin
  base := regexp_replace(lower(coalesce(p_base, '')), '[^a-z0-9-]+', '-', 'g');
  base := regexp_replace(base, '-+', '-', 'g');
  base := btrim(base, '-');
  if base = '' then base := 'user'; end if;
  candidate := base;
  while exists (
    select 1 from public.users
    where slug = candidate
      and id <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
  ) loop
    n := n + 1;
    candidate := base || '-' || n;
  end loop;
  return candidate;
end;
$$;

revoke all on function public.slug_available(text) from public, anon;
revoke all on function public.suggest_slug(text) from public, anon;
grant execute on function public.slug_available(text) to authenticated;
grant execute on function public.suggest_slug(text) to authenticated;
