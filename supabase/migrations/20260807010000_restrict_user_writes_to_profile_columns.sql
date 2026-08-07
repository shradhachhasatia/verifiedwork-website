-- Close a free-premium hole.
--
-- 20260716000000_add_premium_columns.sql documented premium as "set ONLY by the
-- Razorpay webhook (service role) ... never writable by app roles", but it only
-- ever added a SELECT grant. The earlier grant_table_privileges_to_authenticated
-- migration had handed `authenticated` table-wide INSERT and UPDATE on
-- public.users, and that was never revoked. Combined with the `users: owner
-- update` policy (USING auth.uid() = id, no WITH CHECK), any signed-in user
-- could call
--
--   PATCH /rest/v1/users?id=eq.<their own id>   {"premium": true}
--
-- with the public anon key and take a founding membership without paying.
-- INSERT was exposed the same way, so it could also be done at signup.
--
-- Note: revoking at the *column* level does not work while a *table*-level grant
-- exists - Postgres keeps the broader grant. The table-level privilege has to go
-- first, then be re-granted per column.
--
-- Safe to restrict: the only code that writes premium is app/lib/premium.ts,
-- which uses the service role and bypasses grants entirely. The columns granted
-- back are exactly those the app writes:
--   settings.updateProfile - full_name, title, location, linkedin_url,
--                            website_url, website_label, photo_url
--   onboarding.saveProfile - the above plus slug, onboarded (insert adds id, email)
--   auth/callback upsert   - id, email, full_name, slug

revoke insert, update on public.users from anon, authenticated;

grant insert (id, email, full_name, slug, title, location, photo_url,
              linkedin_url, website_url, website_label, onboarded)
  on public.users to authenticated;

grant update (full_name, slug, title, location, photo_url,
              linkedin_url, website_url, website_label, onboarded)
  on public.users to authenticated;
