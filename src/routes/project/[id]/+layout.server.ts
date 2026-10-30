import { error } from '@sveltejs/kit';
import { getProjectById } from '$lib/server/repo';

export async function load({ params, locals, platform }) {
  const project = await getProjectById(platform!.env.DB, params.id, locals.user?.id ?? null);
  if (!project) throw error(404, { message: 'Project not found' });
  return { project };
}
