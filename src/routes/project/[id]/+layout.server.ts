import { error } from '@sveltejs/kit';
import { serverConvex } from '$lib/server/convex';
import { api } from '$convex/_generated/api';

export async function load({ params, locals }) {
	const project = await serverConvex(locals.token)
		.query(api.projects.getById, { id: params.id })
		.catch(() => null);

	if (!project) {
		throw error(404, {
			message: 'Project not found'
		});
	}

	return {
		project
	};
}
