<script lang="ts">
	import SelectKey from '$lib/components/Project/SelectKey.svelte'
	import SelectOctave from '$lib/components/Project/SelectOctave.svelte'
	import SelectScale from '$lib/components/Project/SelectScale.svelte'
	import SelectKeymap from '$lib/components/Keyboard/SelectKeymap.svelte'
	import { Button } from '$lib/components/ui/button'
	import Icon from '@iconify/svelte'
	import Divider from './ui/divider.svelte'
	import { Orange, OrangeSlice, Plus, SignOut } from 'phosphor-svelte'
	import { goto, invalidateAll } from '$app/navigation'
	import { authStore } from '$lib/stores/auth.svelte'
	import * as Avatar from '$lib/components/ui/avatar'
	import Box from './ui/box.svelte'

	let props = $props()

	const goToDashboard = () => {
		goto('/dashboard')
	}

	const handleLogout = async () => {
		console.log('handleLogout called')
		try {
			const result = await authStore.signOut()
			console.log('signOut result:', result)
			if (result.success) {
				console.log('Redirecting to /')
				window.location.href = '/'
			}
		} catch (error) {
			console.error('Error during logout:', error)
		}
	}
</script>

<div class="TopBar">
	<Box class="left" align="center" gap="24px" height="100%">
		<a onclick={goToDashboard} href="#foo" class="logoBox">
			<OrangeSlice class="logoIcon logoIconBottom" size={32} weight="fill" color="var(--a-05)" />
			<OrangeSlice class="logoIcon" size={32} weight="fill" color="var(--n-03)" />
			<span class="logo">KEYLIME</span>
		</a>

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
	}

	.logoBox .logo {
		font-family: var(--logoFont);
		font-weight: 900;
		font-style: normal;
		font-size: 28px;
	}

	:global .logoBox .logoIcon.logoIconBottom {
		left: 1px;
		opacity: 0;
		transform: rotate(105deg) scale(1);
	}

	:global .logoBox .logoIcon {
		position: absolute;
		left: 0px;
		top: -3px;
		transform: rotate(102deg) scale(0.8);
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
