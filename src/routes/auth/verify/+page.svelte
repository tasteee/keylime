<script lang="ts">
	import { onMount } from 'svelte'
	import { page } from '$app/stores'
	import { invalidateAll } from '$app/navigation'
	import { completeLogin } from '$lib/database/auth'
	import { goToPath } from '$lib/modules/navigate'

	// The email link lands here. Trade its token for a session.
	onMount(async () => {
		const linkToken = $page.url.searchParams.get('token') ?? ''
		const result = await completeLogin(linkToken)
		if (!result.success) return goToPath('/auth/login?expired=1')
		await invalidateAll()
		await goToPath('/dashboard')
	})
</script>

<p class="verifyMessage">Signing you in...</p>

<style>
	.verifyMessage {
		display: grid;
		place-items: center;
		min-height: 100vh;
	}
</style>
