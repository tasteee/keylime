<script lang="ts">
	import { Button } from '$lib/components/ui/button'
	import { Input } from '$lib/components/ui/input'
	import { Label } from '$lib/components/ui/label'
	import Box from '$lib/components/ui/box.svelte'
	import Divider from '$lib/components/ui/divider.svelte'
	import { login } from '$lib/database/auth'
	import { goto } from '$app/navigation'

	let email = $state('')
	let password = $state('')
	let isSubmitting = $state(false)
	let errorMessage = $state<string | null>(null)

	const handleSubmit = async (event: SubmitEvent) => {
		event.preventDefault()
		console.log('[login] Form submitted')
		errorMessage = null
		isSubmitting = true
		const result = await login({ email, password })
		console.log('[login] Sign in result:', result)
		const hasError = !result.success

		if (hasError) {
			errorMessage = result.error || 'Failed to sign in'
			isSubmitting = false
			return
		}

		console.log('[login] Sign in successful, redirecting to /dashboard')
		// Force a full page reload to ensure server-side session is synced
		window.location.href = '/dashboard'
	}
</script>

<div class="authPage">
	<div class="authCard">
		<Box class="authCardContainer" gap="24px" justify="stretch" isColumn>
			<div class="header">
				<h1 class="logo">KEYLIME</h1>
				<p class="subtitle">Sign in to your account</p>
			</div>

			<form class="form" onsubmit={handleSubmit}>
				<Box gap="16px" isColumn>
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
							autocomplete="username"
							required
							bind:value={email}
						/>
					</Box>
					<Box isColumn isFullWidth class="field">
						<Box justify="between" isFullWidth>
							<Label for="password">Password</Label>
							<a href="/auth/forgot-password" class="forgot-link">Forgot password?</a>
						</Box>

						<Input
							size="large"
							type="password"
							id="password"
							name="password"
							autocomplete="current-password"
							required
							bind:value={password}
						/>
					</Box>
				</Box>

				<div class="actions">
					<Button type="submit" isFullWidth={true} size="medium" color="brand" disabled={isSubmitting}>
						{isSubmitting ? 'Signing in...' : 'Sign In'}
					</Button>
				</div>
			</form>

			<Divider isHorizontal={true} margin="0px" />

			<div class="footer">
				<p class="text-sm text-muted-foreground">
					Don't have an account? <a href="/auth/signup" class="link">Sign up</a>
				</p>
			</div>
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
