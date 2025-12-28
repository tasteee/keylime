<script lang="ts">
	import TopBarShell from '../TopBarShell.svelte'
	import * as NavigationMenu from '$lib/components/ui/navigation-menu'
	import { navigationMenuTriggerStyle } from '$lib/components/ui/navigation-menu/navigation-menu-trigger.svelte'
</script>

<TopBarShell>
	<NavigationMenu.Root>
		<NavigationMenu.List>
			<NavigationMenu.Item>
				<NavigationMenu.Link href="/dashboard" class={navigationMenuTriggerStyle()}>Home</NavigationMenu.Link>
			</NavigationMenu.Item>
			<NavigationMenu.Item>
				<NavigationMenu.Link href="/projects" class={navigationMenuTriggerStyle()}>Projects</NavigationMenu.Link>
			</NavigationMenu.Item>
			<NavigationMenu.Item>
				<NavigationMenu.Link href="/users" class={navigationMenuTriggerStyle()}>Users</NavigationMenu.Link>
			</NavigationMenu.Item>
		</NavigationMenu.List>
	</NavigationMenu.Root>
</TopBarShell>

<style>
</style>
