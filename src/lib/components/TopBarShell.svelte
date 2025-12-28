<script lang="ts">
	import { Button } from '$lib/components/ui/button'
	import Divider from './ui/divider.svelte'
	import { OrangeSlice, Plus, SignOut } from 'phosphor-svelte'
	import { goto, invalidateAll } from '$app/navigation'
	import { authStore } from '$lib/stores/auth.svelte'
	import * as Avatar from '$lib/components/ui/avatar'
	import Box from './ui/box.svelte'

	let props = $props()

	const goToDashboard = () => {
		console.log('[TopBar] Navigating to /dashboard')
		goto('/dashboard')
	}

	const handleLogout = async () => {
		console.log('[TopBar] handleLogout called')
		await authStore.signOut()
	}
</script>

<div class="TopBar">
	<Box class="left" align="center" gap="24px" height="100%">
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div onclick={goToDashboard} class="logoBox">
			<OrangeSlice class="logoIcon" size={32} weight="fill" color="var(--n-03)" />
			<span class="logo">KEYLIME</span>
		</div>

		<Divider isThin />
	</Box>

	{@render props.children?.()}

	<Box class="right" align="center" gap="24px" height="100%" paddingRight="24px">
		<Divider isThin />

		<Box align="center" gap="8px" class="userControls">
			<Button kind="ghost" isIcon onclick={handleLogout}><SignOut width={24} color="var(--n-08)" /></Button>
			<Avatar.Root class="size-6">
				<Avatar.Fallback class="logoFont">
					{authStore.userProfile?.userName?.slice(0, 2).toUpperCase() || 'U'}
				</Avatar.Fallback>
			</Avatar.Root>
		</Box>
	</Box>
</div>

<style>
	.logoBox {
		position: relative;
		display: flex;
		align-items: center;
		padding-left: 24px;
		cursor: pointer;
	}

	.logoBox .logo {
		font-family: var(--logoFont);
		font-weight: 900;
		font-style: normal;
		font-size: 28px;
	}

	.TopBar {
		position: relative;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: space-between;
		z-index: 50;
		gap: 32px;
		background-color: var(--colorWhite);
		border: 1px solid var(--neutral-separatorSubtle);
		height: 64px;
		transition: 120ms ease-in;
		width: 100%;
		margin-left: auto;
		margin-right: auto;
		padding-left: 16px;
		padding-right: 16px;
	}

	.logo {
		display: flex;
		align-items: center;
		gap: 10px;
		color: var(--foreground);
		text-decoration: none;
	}
</style>
