-- Public (logged-out) visitors must be able to read a member's verified work on
-- their public profile page (/[slug]). RLS already scopes these tables to
-- verified rows for the anon role (policies public_verified_entries and
-- public_verifications_for_verified), but the table-level SELECT *grant* was
-- missing for anon, so PostgREST embeds returned nothing for signed-out
-- visitors and public profiles showed no projects.
--
-- These grants are gated by the existing RLS policies, so anon can still only
-- read rows belonging to verified entries.
grant select on public.entries to anon;
grant select on public.verifications to anon;
