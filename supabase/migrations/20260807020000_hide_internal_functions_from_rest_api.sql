-- Stop exposing internal functions as REST endpoints.
--
-- enforce_free_project_limit() is a trigger function and rls_auto_enable() is an
-- RLS helper; neither is meant to be called directly, but Postgres grants
-- EXECUTE to PUBLIC by default, so both were reachable at /rest/v1/rpc/<name>.
-- Not exploitable (they fail outside a trigger context), but they have no
-- business being part of the public API surface.
--
-- Revoking from anon/authenticated individually does nothing while the PUBLIC
-- grant stands - it has to be revoked from PUBLIC.
--
-- This does not disable the free-project cap: trigger functions are invoked by
-- the executor as the table owner and never consult EXECUTE privileges.
--
-- Deliberately NOT touched, because the app depends on them being callable:
--   get_verification_request / submit_verification - the anonymous validator
--     flow, called by people who are not signed in
--   slug_available / suggest_slug - called during onboarding
--   delete_current_user - anon-callable but harmless; auth.uid() is null for an
--     anonymous caller, so it deletes nothing

revoke execute on function public.enforce_free_project_limit() from public;
revoke execute on function public.rls_auto_enable() from public;
