import type { RequestHandler } from './$types';
import type { Session } from '@supabase/supabase-js';
import { json } from '@sveltejs/kit';

type AuthCallbackPayloadT = {
  event: string
  session: Session | null
};

export const POST: RequestHandler = async (event) => {
  const payload = (await event.request.json()) as AuthCallbackPayloadT;
  const supabaseServerClient = event.locals.supabase;
  const hasNoSupabaseClient = !supabaseServerClient;
  if (hasNoSupabaseClient) return json({ success: false, reason: 'missing_supabase_client' }, { status: 500 });

  const isSignOutEvent = payload.event === 'SIGNED_OUT' || payload.event === 'USER_DELETED';
  if (isSignOutEvent) {
    await supabaseServerClient.auth.signOut();
    return json({ success: true });
  }

  if (!payload.session) return json({ success: true });

  await supabaseServerClient.auth.setSession(payload.session);

  return json({ success: true });
};
