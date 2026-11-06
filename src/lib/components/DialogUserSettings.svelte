<script lang="ts">
	import { updateUserSettings } from '$lib/database/auth'
	import { themeStore } from '$lib/stores/theme.svelte'
	import { useActiveUser, useAuthUser } from '$lib/helpers/useActiveUser.svelte'

	type DialogUserSettingsPropsT = {
		isOpen: boolean
		onClose: () => void
	}

	const SUCCESS_CLOSE_DELAY_MS = 1200

	const props: DialogUserSettingsPropsT = $props()

	const activeUser = useActiveUser()
	const authUser = useAuthUser()

	let userName = $state('')
	let bio = $state('')
	let avatarUrl = $state('')
	let errorMessage = $state<string | null>(null)
	let successMessage = $state<string | null>(null)
	let isSubmitting = $state(false)

	const isDarkTheme = $derived(themeStore.theme === 'dark')

	const handleThemeChange = (event: CustomEvent) => {
		const isChecked: boolean = event.detail.checked
		themeStore.setTheme(isChecked ? 'dark' : 'light')
	}

	const email = $derived(authUser?.email ?? '')
	const saveButtonLabel = $derived(isSubmitting ? 'Saving…' : 'Save changes')
	const hasErrorMessage = $derived(errorMessage !== null)
	const hasSuccessMessage = $derived(successMessage !== null)

	const resetFormFromUser = () => {
		userName = activeUser?.userName ?? ''
		bio = activeUser?.bio ?? ''
		avatarUrl = activeUser?.avatarUrl ?? ''
		errorMessage = null
		successMessage = null
	}

	$effect(() => {
		if (props.isOpen) resetFormFromUser()
	})

	const handleUserNameInput = (event: CustomEvent) => {
		userName = event.detail.value
	}

	const handleBioInput = (event: CustomEvent) => {
		bio = event.detail.value
	}

	const handleAvatarUrlInput = (event: CustomEvent) => {
		avatarUrl = event.detail.value
	}

	const handleSave = async () => {
		errorMessage = null
		successMessage = null
		isSubmitting = true

		const updateResult = await updateUserSettings({ userName, bio, avatarUrl })
		isSubmitting = false

		if (!updateResult.success) {
			errorMessage = updateResult.error ?? 'Failed to update settings'
			return
		}

		successMessage = 'Settings updated.'
		setTimeout(props.onClose, SUCCESS_CLOSE_DELAY_MS)
	}
</script>

<z-dialog isOpen={props.isOpen} heading="User settings" description="Choose how you show up on Keylime." onclose={props.onClose}>
	<z-column gap="md" insetY="xs">
		{#if hasErrorMessage}
			<z-alert tone="danger">{errorMessage}</z-alert>
		{/if}

		{#if hasSuccessMessage}
			<z-alert tone="success">{successMessage}</z-alert>
		{/if}

		<z-switch size="sm" isChecked={isDarkTheme} onchange={handleThemeChange}>Dark theme</z-switch>

		<z-field label="Username" isRequired>
			<z-input value={userName} placeholder="username" isRequired oninput={handleUserNameInput}></z-input>
		</z-field>

		<z-field label="Email" description="Your email is private and can't be changed here.">
			<z-input type="email" value={email} isDisabled></z-input>
		</z-field>

		<z-field label="Bio">
			<z-input value={bio} placeholder="Tell us about yourself" oninput={handleBioInput}></z-input>
		</z-field>

		<z-field label="Avatar URL">
			<z-input type="url" value={avatarUrl} placeholder="https://…" oninput={handleAvatarUrlInput}></z-input>
		</z-field>
	</z-column>

	<z-row slot="footer" gap="sm" alignsX="end">
		<z-button kind="ghost" onclick={props.onClose}>Cancel</z-button>
		<z-button tone="primary" isLoading={isSubmitting} onclick={handleSave}>{saveButtonLabel}</z-button>
	</z-row>
</z-dialog>
