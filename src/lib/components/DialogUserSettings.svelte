<script lang="ts">
	import { Dialog } from 'bits-ui'
	import { Button } from '$lib/components/ui/button'
	import { Input } from '$lib/components/ui/input'
	import { Label } from '$lib/components/ui/label'
	import Box from './ui/box.svelte'
	import { updateUserSettings } from '$lib/database/auth'
	import { useActiveUser, useAuthUser } from '$lib/helpers/useActiveUser.svelte'
	import { X } from 'phosphor-svelte'

	type DialogUserSettingsPropsT = {
		isOpen: boolean
		onOpenChange: (open: boolean) => void
	}

	let props: DialogUserSettingsPropsT = $props()

	const activeUser = useActiveUser()
	const authUser = useAuthUser()

	let userName = $state(activeUser?.userName || '')
	let email = $state(authUser?.email || '')
	let bio = $state(activeUser?.bio || '')
	let avatarUrl = $state(activeUser?.avatarUrl || '')
	let newPassword = $state('')
	let confirmPassword = $state('')
	let errorMessage = $state<string | null>(null)
	let successMessage = $state<string | null>(null)
	let isSubmitting = $state(false)

	$effect(() => {
		const isDialogOpen = props.isOpen
		if (!isDialogOpen) return
		userName = activeUser?.userName || ''
		email = authUser?.email || ''
		bio = activeUser?.bio || ''
		avatarUrl = activeUser?.avatarUrl || ''
		newPassword = ''
		confirmPassword = ''
		errorMessage = null
		successMessage = null
	})

	const handleSubmit = async (event: SubmitEvent) => {
		event.preventDefault()
		errorMessage = null
		successMessage = null

		const isPasswordBeingChanged = newPassword.length > 0 || confirmPassword.length > 0
		if (isPasswordBeingChanged) {
			const doPasswordsMatch = newPassword === confirmPassword
			if (!doPasswordsMatch) {
				errorMessage = 'Passwords do not match'
				return
			}

			const isPasswordLongEnough = newPassword.length >= 6
			if (!isPasswordLongEnough) {
				errorMessage = 'Password must be at least 6 characters'
				return
			}
		}

		isSubmitting = true

		const updateResult = await updateUserSettings({
			userName,
			email,
			bio,
			avatarUrl,
			newPassword: isPasswordBeingChanged ? newPassword : undefined
		})

		isSubmitting = false

		const hasUpdateError = !updateResult.success
		if (hasUpdateError) {
			errorMessage = updateResult.error || 'Failed to update settings'
			return
		}

		successMessage = 'Settings updated successfully!'
		newPassword = ''
		confirmPassword = ''

		setTimeout(() => {
			props.onOpenChange(false)
		}, 1500)
	}
</script>

<Dialog.Root open={props.isOpen} onOpenChange={props.onOpenChange}>
	<Dialog.Portal>
		<Dialog.Overlay class="dialogOverlay" />
		<Dialog.Content class="dialogContent">
			<Box gap="24px" isColumn justify="stretch">
				<Box justify="space-between" align="center">
					<Dialog.Title class="dialogTitle">User Settings</Dialog.Title>
					<Dialog.Close class="dialogClose">
						<X size={24} weight="bold" />
					</Dialog.Close>
				</Box>

				<form class="settingsForm" onsubmit={handleSubmit}>
					<Box gap="16px" isColumn justify="stretch">
						{#if errorMessage}
							<div class="errorMessage">
								{errorMessage}
							</div>
						{/if}

						{#if successMessage}
							<div class="successMessage">
								{successMessage}
							</div>
						{/if}

						<div class="field">
							<Label for="userName">Username</Label>
							<Input
								size="large"
								type="text"
								id="userName"
								name="userName"
								placeholder="username"
								required
								bind:value={userName}
							/>
						</div>

						<div class="field">
							<Label for="email">Email</Label>
							<Input
								size="large"
								type="email"
								id="email"
								name="email"
								placeholder="name@example.com"
								required
								bind:value={email}
							/>
						</div>

						<div class="field">
							<Label for="bio">Bio</Label>
							<Input size="large" type="text" id="bio" name="bio" placeholder="Tell us about yourself" bind:value={bio} />
						</div>

						<div class="field">
							<Label for="avatarUrl">Avatar URL</Label>
							<Input
								size="large"
								type="url"
								id="avatarUrl"
								name="avatarUrl"
								placeholder="https://..."
								bind:value={avatarUrl}
							/>
						</div>

						<div class="divider"></div>

						<div class="field">
							<Label for="newPassword">New Password (optional)</Label>
							<Input
								size="large"
								type="password"
								id="newPassword"
								name="newPassword"
								placeholder="Leave blank to keep current"
								bind:value={newPassword}
							/>
						</div>

						<div class="field">
							<Label for="confirmPassword">Confirm New Password</Label>
							<Input
								size="large"
								type="password"
								id="confirmPassword"
								name="confirmPassword"
								placeholder="Confirm new password"
								bind:value={confirmPassword}
							/>
						</div>
					</Box>

					<Box gap="12px" class="dialogActions">
						<Button size="large" isFullWidth type="button" kind="ghost" onclick={() => props.onOpenChange(false)}
							>Cancel</Button
						>
						<Button size="large" isFullWidth type="submit" color="brand" disabled={isSubmitting}>
							{isSubmitting ? 'Saving...' : 'Save Changes'}
						</Button>
					</Box>
				</form>
			</Box>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

<style>
	:global(.dialogOverlay) {
		position: fixed;
		inset: 0;
		background-color: rgba(0, 0, 0, 0.5);
		z-index: 50;
		animation: fadeIn 0.2s ease-out;
	}

	:global(.dialogContent) {
		position: fixed;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		background-color: var(--colorWhite);
		border: 1px solid var(--n-03);
		border-radius: 12px;
		padding: 32px;
		width: 90vw;
		max-width: 500px;
		/* make it MAX 600px tall, never to exceed that */
		max-height: calc(min(80vh, 600px));
		overflow-y: auto;
		z-index: 51;
		animation: slideIn 0.2s ease-out;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
	}

	/* hide scrollbar background */

	:global .dialogContent::-webkit-scrollbar-track {
		background: transparent;
	}

	:global(.dialogTitle) {
		font-size: 24px;
		font-weight: 700;
		color: var(--n-10);
		margin: 0;
	}

	:global(.dialogClose) {
		display: flex;
		align-items: center;
		justify-content: center;
		background: transparent;
		border: none;
		cursor: pointer;
		color: var(--n-07);
		transition: color 0.2s;
		padding: 4px;
	}

	:global(.dialogClose:hover) {
		color: var(--n-10);
	}

	.settingsForm {
		display: flex;
		flex-direction: column;
		gap: 24px;
		align-items: stretch;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.divider {
		height: 1px;
		background-color: var(--n-03);
		margin: 8px 0;
	}

	.errorMessage {
		padding: 12px 16px;
		background-color: #fee;
		border: 1px solid #fcc;
		border-radius: 8px;
		color: #c33;
		font-size: 14px;
	}

	.successMessage {
		padding: 12px 16px;
		background-color: #efe;
		border: 1px solid #cfc;
		border-radius: 8px;
		color: #3c3;
		font-size: 14px;
	}

	:global(.dialogActions) {
		display: flex;
		justify-content: flex-end;
		margin-top: 8px;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translate(-50%, -48%);
		}
		to {
			opacity: 1;
			transform: translate(-50%, -50%);
		}
	}
</style>
