import { error } from '@sveltejs/kit'

export async function load({ params, locals }) {
	const result = await locals.supabase.from('all_projects').select('*').eq('id', params.id).single()

	if (result.error || !result.data) {
		throw error(404, {
			message: 'Project not found'
		})
	}

	return {
		project: result.data
	}
}
