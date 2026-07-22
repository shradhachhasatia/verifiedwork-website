-- Cap free accounts at 3 projects; founding members (premium) are unlimited.
--
-- The app enforces this in the /add page and the createEntry server action, but
-- both run with the user's own session, so a determined user could insert an
-- entry directly through the API and skip the check. This trigger is the hard
-- backstop: it runs inside the database on every insert regardless of path.
--
-- Keep the limit in step with FREE_PROJECT_LIMIT in app/lib/format.ts.

create or replace function public.enforce_free_project_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_premium boolean;
  project_count integer;
begin
  select premium into is_premium from public.users where id = new.user_id;

  -- Founding members have no cap.
  if coalesce(is_premium, false) then
    return new;
  end if;

  select count(*) into project_count
  from public.entries
  where user_id = new.user_id;

  if project_count >= 3 then
    raise exception 'free_project_limit'
      using hint = 'Free accounts can hold up to 3 projects. Upgrade for unlimited.';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_free_project_limit on public.entries;

create trigger enforce_free_project_limit
  before insert on public.entries
  for each row execute function public.enforce_free_project_limit();
