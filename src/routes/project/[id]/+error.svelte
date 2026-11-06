<script lang="ts">
	import { page } from '$app/stores'
	import { goToPath } from '$lib/modules/navigate'

	const status = $page.status
	const message = $page.error?.message || 'An error occurred'

	const handleReturnToDashboard = () => {
		goToPath('/dashboard')
	}
</script>

<z-center doesCenterBoth minHeight="100vh" inset="lg">
	<z-column gap="md" alignsX="center">
		<z-display size="sm">{status}</z-display>
		<z-text size="lg" color="muted">{message}</z-text>
		<z-button tone="primary" onclick={handleReturnToDashboard}>Return to dashboard</z-button>
	</z-column>
</z-center>
