<script lang="ts">
	import { requestLoginLink } from '$lib/database/auth'
	import { page } from '$app/stores'
	import Logo from '$lib/components/shell/Logo.svelte'

	let email = $state('')
	let isSubmitting = $state(false)
	let didSend = $state(false)
	let devLink = $state<string | null>(null)
	let errorMessage = $state<string | null>(null)

	const hasExpiredLink = $derived($page.url.searchParams.get('expired') === '1')
	const hasErrorMessage = $derived(errorMessage !== null)
	const hasDevLink = $derived(devLink !== null)
	const submitLabel = $derived(isSubmitting ? 'Sending…' : 'Email me a sign-in link')

	const handleEmailInput = (event: CustomEvent) => {
		email = event.detail.value
	}

	const handleSubmit = async (event: SubmitEvent) => {
		event.preventDefault()
		errorMessage = null
		isSubmitting = true
		const result = await requestLoginLink(email)
		isSubmitting = false

		if (!result.success) {
			errorMessage = result.error || 'Failed to send the link'
			return
		}

		devLink = result.devLink ?? null
		didSend = true
	}

	const handleUseDifferentEmail = () => {
		didSend = false
	}
</script>

<z-center doesCenterBoth minHeight="100vh" inset="lg">
	<z-surface level="1" kind="soft" inset="xl" radius="xl" isBordered class="authCard">
		<z-column gap="lg">
			<z-column gap="sm" alignsX="center" class="authHeader">
				<Logo size="lg" />
				<z-heading size="xs" tag="h1">Welcome to Keylime</z-heading>
				<z-text color="muted" size="sm">Sign in or create an account with a link sent to your email.</z-text>
			</z-column>

			{#if didSend}
				<z-column gap="md">
					<z-alert tone="success" heading="Check your inbox">
						We sent a sign-in link to <strong>{email}</strong>. It works once, for 15 minutes.
					</z-alert>
					{#if hasDevLink}
						<z-link href={devLink ?? ''}>Dev link: sign in</z-link>
					{/if}
					<z-button kind="outline" isFullWidth onclick={handleUseDifferentEmail}>Use a different email</z-button>
				</z-column>
			{:else}
				<form onsubmit={handleSubmit}>
					<z-column gap="md">
						{#if hasExpiredLink}
							<z-alert tone="warning">That link expired or was already used. Request a new one.</z-alert>
						{/if}
						{#if hasErrorMessage}
							<z-alert tone="danger">{errorMessage}</z-alert>
						{/if}

						<z-field label="Email" size="lg">
							<z-input
								type="email"
								name="email"
								placeholder="name@example.com"
								autocomplete="email"
								value={email}
								isRequired
								oninput={handleEmailInput}
							></z-input>
						</z-field>

						<z-button type="submit" tone="primary" size="lg" isFullWidth isLoading={isSubmitting}>{submitLabel}</z-button>
					</z-column>
				</form>
			{/if}
		</z-column>
	</z-surface>
</z-center>

<style>
	.authCard {
		width: min(100%, 26rem);
	}

	.authHeader {
		text-align: center;
	}
</style>
