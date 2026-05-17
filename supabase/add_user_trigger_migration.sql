-- ============================================
-- AUTO-CREATE all_users PROFILE ON SIGNUP
-- ============================================
-- This trigger fires after a new row is inserted into auth.users.
-- SECURITY DEFINER means it runs as the function owner (postgres),
-- bypassing RLS — so it works whether or not the user has a session yet.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  baseUsername text;
  finalUsername text;
  usernameExists boolean;
  attempt integer := 0;
BEGIN
  baseUsername := split_part(NEW.email, '@', 1);
  finalUsername := baseUsername;

  SELECT EXISTS(
    SELECT 1 FROM public.all_users WHERE "userName" = finalUsername
  ) INTO usernameExists;

  WHILE usernameExists AND attempt < 100 LOOP
    finalUsername := baseUsername || floor(1000 + random() * 9000)::text;
    SELECT EXISTS(
      SELECT 1 FROM public.all_users WHERE "userName" = finalUsername
    ) INTO usernameExists;
    attempt := attempt + 1;
  END LOOP;

  -- Final fallback: base + first 8 chars of UUID (virtually guaranteed unique)
  IF usernameExists THEN
    finalUsername := baseUsername || substr(NEW.id::text, 1, 8);
  END IF;

  INSERT INTO public.all_users (id, "userName", bio, "createdAt", "updatedAt")
  VALUES (NEW.id, finalUsername, '', now(), now())
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
