<script lang="ts">
	import type { Snippet } from 'svelte'
	import { page } from '$app/stores'
	import { base } from '$app/paths'
	import Logo from './Logo.svelte'
	import UserMenu from './UserMenu.svelte'
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
		<Logo />

		{#if shouldShowNavigation}
			<z-nav-menu items={navigationItems} value={activeNavigationValue} onselect={handleNavigationSelect}></z-nav-menu>
		{/if}

		{#if hasChildren}
			<z-row gap="md" alignsY="center">
				{@render props.children?.()}
			</z-row>
		{/if}

		<z-spacer canGrow></z-spacer>

		<UserMenu onOpenSettings={handleOpenSettings} />
	</z-row>
	<z-separator></z-separator>
</z-column>

<DialogUserSettings isOpen={isSettingsDialogOpen} onClose={handleCloseSettings} />
