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

<z-center doesCenterBoth minHeight="100vh">
	<z-column gap="md" alignsX="center">
		<z-skeleton shape="circle" width="2.5rem"></z-skeleton>
		<z-text color="muted">Signing you in…</z-text>
	</z-column>
</z-center>
