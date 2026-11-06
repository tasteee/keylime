<script lang="ts">
	import { logout } from '$lib/database/auth'
	import { useActiveUser } from '$lib/helpers/useActiveUser.svelte'

	type UserMenuPropsT = {
		onOpenSettings: () => void
	}

	const props: UserMenuPropsT = $props()

	const activeUser = useActiveUser()

	const userName = $derived(activeUser?.userName ?? 'User')
	const avatarUrl = $derived(activeUser?.avatarUrl ?? undefined)

	const menuItems = [
		{ value: 'settings', label: 'Settings' },
		{ isSeparator: true },
		{ value: 'logout', label: 'Log out', isDanger: true }
	]

	const handleMenuSelect = async (event: CustomEvent) => {
		const selectedValue: string = event.detail.value
		if (selectedValue === 'settings') props.onOpenSettings()
		if (selectedValue === 'logout') await logout()
	}
</script>

<z-menu items={menuItems} align="end" onselect={handleMenuSelect}>
	<z-button slot="trigger" kind="plain" size="sm" aria-label="Account menu">
		<z-avatar name={userName} src={avatarUrl} size="sm"></z-avatar>
	</z-button>
</z-menu>
