<script lang="ts">
	import type { Snippet } from 'svelte'
	import { page } from '$app/stores'
	import { base } from '$app/paths'
	import Logo from './Logo.svelte'
	import UserMenu from './UserMenu.svelte'
	import SelectOutput from '$lib/components/Project/SelectOutput.svelte'
	import DialogUserSettings from '$lib/components/DialogUserSettings.svelte'
	import { goToPath } from '$lib/modules/navigate'

	type AppTopBarPropsT = {
		hasNavigation?: boolean
		children?: Snippet
	}

	const props: AppTopBarPropsT = $props()

	const navigationItems = [
		{ value: '/dashboard', label: 'Home' },
		{ value: '/projects', label: 'Projects' },
		{ value: '/users', label: 'Users' }
	]

	let isSettingsDialogOpen = $state(false)

	const currentPath = $derived($page.url.pathname.replace(base, '') || '/')
	const activeNavigationValue = $derived(
		navigationItems.find((item) => currentPath.startsWith(item.value))?.value ?? ''
	)
	const shouldShowNavigation = $derived(props.hasNavigation ?? true)

	const hasChildren = $derived(Boolean(props.children))

	const handleOpenSettings = () => {
		isSettingsDialogOpen = true
	}

	const handleCloseSettings = () => {
		isSettingsDialogOpen = false
	}

	const handleNavigationSelect = (event: CustomEvent) => {
		const nextPath: string = event.detail.value
		goToPath(nextPath)
	}
</script>

<z-column>
	<z-row insetX="lg" insetY="sm" gap="xl" alignsY="center" isFullWidth>
		<div class="topBarStart">
			<Logo />

			{#if shouldShowNavigation}
				<z-nav-menu items={navigationItems} value={activeNavigationValue} onselect={handleNavigationSelect}></z-nav-menu>
			{/if}
		</div>

		<div class="topBarCenter">
			{#if hasChildren}
				{@render props.children?.()}
			{/if}
		</div>

		<div class="topBarEnd">
			<SelectOutput />
			<UserMenu onOpenSettings={handleOpenSettings} />
		</div>
	</z-row>
	<z-separator></z-separator>
</z-column>

<DialogUserSettings isOpen={isSettingsDialogOpen} onClose={handleCloseSettings} />

<style>
	.topBarStart,
	.topBarCenter,
	.topBarEnd {
		flex: 1 1 0;
		display: flex;
		align-items: center;
		gap: var(--spacing-6);
		min-width: 0;
	}

	.topBarCenter {
		justify-content: center;
	}

	.topBarEnd {
		justify-content: flex-end;
	}
</style>
