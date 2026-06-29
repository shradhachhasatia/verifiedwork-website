-- Let members say whether their website is a company or personal site.
alter table public.users add column if not exists website_label text;

alter table public.users drop constraint if exists users_website_label_check;
alter table public.users add constraint users_website_label_check
  check (website_label is null or website_label in ('company', 'personal'));

grant select (website_label) on public.users to anon, authenticated;
-- INSERT/UPDATE are already granted at table level, so writes are covered.
