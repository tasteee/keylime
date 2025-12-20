<script lang="ts">
	import { Button } from '$lib/components/ui/button'
	import Icon from '@iconify/svelte'
	import { goto } from '$app/navigation'
	import { authStore } from '$lib/stores/auth.svelte'

	type TopBarPropsT = {}
	const props: TopBarPropsT = $props()

	const handleGoBack = () => {
		goto('/dashboard')
	}

	const handleLogout = async () => {
		await authStore.signOut()
		goto('/')
	}
</script>

<header class="header">
	<div class="header-left">
		<Button kind="ghost" size="small" isIcon onclick={handleGoBack}>
			<Icon icon="mingcute:arrow-left-line" class="size-5" />
		</Button>
		<span class="logo-text">KEYLIME</span>
	</div>
	<div class="user-menu">
		<span class="user-name">{authStore.userProfile?.userName}</span>
		<Button kind="ghost" size="small" onclick={handleLogout}>Sign Out</Button>
	</div>
</header>

<style>
	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 40px;
		height: 64px;
		background-color: rgba(255, 255, 255, 0.8);
		backdrop-filter: blur(20px);
		border-bottom: 1px solid rgba(0, 0, 0, 0.05);
		position: sticky;
		top: 0;
		z-index: 10;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.logo-text {
		font-weight: 700;
		font-size: 18px;
		letter-spacing: -0.5px;
		color: #1d1d1f;
	}

	.user-menu {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.user-name {
		font-size: 14px;
		font-weight: 500;
		color: #1d1d1f;
	}
</style>
