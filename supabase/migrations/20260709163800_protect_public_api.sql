-- The application accesses Supabase only from the Express server using
-- service_role. Keep the Data API closed to public roles.

ALTER TABLE public.cronograma_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cronograma_person_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cronograma_sessions_deny_public_api ON public.cronograma_sessions;
DROP POLICY IF EXISTS cronograma_person_preferences_deny_public_api ON public.cronograma_person_preferences;

CREATE POLICY cronograma_sessions_deny_public_api ON public.cronograma_sessions AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY cronograma_person_preferences_deny_public_api ON public.cronograma_person_preferences AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

REVOKE ALL ON TABLE
  public.cronograma_sessions,
  public.cronograma_person_preferences
FROM anon, authenticated;
