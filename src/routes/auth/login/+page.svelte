<script lang="ts">
	import { Button } from '$lib/components/ui/button'
	import { Input } from '$lib/components/ui/input'
	import { Label } from '$lib/components/ui/label'
	import Box from '$lib/components/ui/box.svelte'
	import { requestLoginLink } from '$lib/database/auth'
	import { page } from '$app/stores'

	let email = $state('')
	let isSubmitting = $state(false)
	let didSend = $state(false)
	let devLink = $state<string | null>(null)
	let errorMessage = $state<string | null>(null)

	const hasExpiredLink = $derived($page.url.searchParams.get('expired') === '1')

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
</script>

<div class="authPage">
	<div class="authCard">
		<Box class="authCardContainer" gap="24px" justify="stretch" isColumn>
			<div class="header">
				<h1 class="logo">KEYLIME</h1>
				<p class="subtitle">Sign in or create an account with a link sent to your email</p>
			</div>

			{#if didSend}
				<Box gap="16px" isColumn>
					<p class="subtitle">Check <strong>{email}</strong> for your sign-in link. It works once, for 15 minutes.</p>
					{#if devLink}
						<a class="link" href={devLink}>Dev link: sign in</a>
					{/if}
					<Button type="button" isFullWidth={true} size="medium" onclick={() => (didSend = false)}>Use a different email</Button>
				</Box>
			{:else}
				<form class="form" onsubmit={handleSubmit}>
					<Box gap="16px" isColumn>
						{#if hasExpiredLink}
							<Box class="error">That link expired or was already used. Request a new one.</Box>
						{/if}
						{#if errorMessage}
							<Box class="error">
								{errorMessage}
							</Box>
						{/if}
						<Box isColumn isFullWidth class="field">
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
						</Box>
					</Box>

					<div class="actions">
						<Button type="submit" isFullWidth={true} size="medium" color="brand" disabled={isSubmitting}>
							{isSubmitting ? 'Sending...' : 'Email me a sign-in link'}
						</Button>
					</div>
				</form>
			{/if}
		</Box>
	</div>
</div>

<style>
	.authPage {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		background-color: var(--n-00);
		padding: 20px;
		font-family: var(--font-sans);
	}

	.authCard {
		width: 100%;
		max-width: 400px;
		background-color: var(--colorWhite);
		border: 1px solid var(--n-03);
		border-radius: 12px;
		padding: 40px;
		box-shadow: 0 4px 24px var(--n-alpha-2);
	}

	.header {
		text-align: center;
		margin-bottom: 8px;
	}

	.title {
		font-family: var(--font-display);
		font-size: 24px;
		font-weight: 700;
		color: var(--n-10);
		margin-bottom: 8px;
	}

	.subtitle {
		color: var(--n-06);
		font-size: 14px;
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.forgot-link {
		font-size: 12px;
		color: var(--n-06);
		text-decoration: none;
		font-weight: 500;
	}

	.forgot-link:hover {
		color: var(--n-09);
		text-decoration: underline;
	}

	.error {
		background-color: var(--d-00);
		color: var(--d-07);
		padding: 12px;
		border-radius: 6px;
		font-size: 14px;
		border: 1px solid var(--d-02);
	}

	.actions {
		margin-top: 8px;
	}

	.footer {
		text-align: center;
	}

	.link {
		color: var(--primary-text);
		text-decoration: none;
		font-weight: 600;
	}

	.link:hover {
		text-decoration: underline;
	}
</style>
