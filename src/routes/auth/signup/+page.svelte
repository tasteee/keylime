<script lang="ts">
	import { Button } from '$lib/components/ui/button'
	import { Input } from '$lib/components/ui/input'
	import { Label } from '$lib/components/ui/label'
	import Box from '$lib/components/Box.svelte'
	import ShaDivider from '$lib/components/ShaDivider.svelte'
	import { authStore } from '$lib/stores/auth.svelte'
	import { goto } from '$app/navigation'

	let email = $state('')
	let password = $state('')
	let confirmPassword = $state('')
	let isSubmitting = $state(false)
	let errorMessage = $state<string | null>(null)

	const handleSubmit = async (event: SubmitEvent) => {
		event.preventDefault()
		errorMessage = null
		const doPasswordsMatch = password === confirmPassword
		const passwordLongEnough = password.length >= 6

		if (!doPasswordsMatch) {
			errorMessage = 'Passwords do not match'
			return
		}

		if (!passwordLongEnough) {
			errorMessage = 'Password must be at least 6 characters'
			return
		}

		isSubmitting = true
		const signUpResult = await authStore.signUp({ email, password })
		const hasSignUpError = !signUpResult.success

		if (hasSignUpError) {
			errorMessage = signUpResult.error || 'Failed to create account'
			isSubmitting = false
		}
	}
</script>

<div class="authPage">
	<div class="authCard">
		<Box gap="24px" isColumn>
			<div class="header">
				<h1 class="title">Create Account</h1>
				<p class="subtitle">Sign up to get started</p>
			</div>

			<form class="form" onsubmit={handleSubmit}>
				<Box gap="16px" isColumn>
					{#if errorMessage}
						<div class="error">
							{errorMessage}
						</div>
					{/if}
					<div class="field">
						<Label for="email">Email</Label>
						<Input type="email" id="email" name="email" placeholder="name@example.com" required bind:value={email} />
					</div>
					<div class="field">
						<Label for="password">Password</Label>
						<Input type="password" id="password" name="password" required bind:value={password} />
					</div>
					<div class="field">
						<Label for="confirmPassword">Confirm Password</Label>
						<Input type="password" id="confirmPassword" name="confirmPassword" required bind:value={confirmPassword} />
					</div>
				</Box>

				<div class="actions">
					<Button type="submit" isFullWidth={true} size="medium" color="brand" disabled={isSubmitting}>
						{isSubmitting ? 'Creating account...' : 'Sign Up'}
					</Button>
				</div>
			</form>

			<ShaDivider isHorizontal={true} margin="0px" />

			<div class="footer">
				<p class="text-sm text-muted-foreground">
					Already have an account? <a href="/auth/login" class="link">Sign in</a>
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
		border-radius: 8px;
		padding: 32px;
		box-shadow: 0 4px 12px var(--n-alpha-1);
	}

	.header {
		text-align: center;
	}

	.title {
		font-size: 24px;
		font-weight: 600;
		color: var(--n-09);
		margin-bottom: 8px;
	}

	.subtitle {
		font-size: 14px;
		color: var(--n-06);
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.error {
		padding: 12px;
		background-color: var(--red-alpha-1);
		border: 1px solid var(--red-alpha-3);
		border-radius: 6px;
		color: var(--red);
		font-size: 14px;
	}

	.actions {
		margin-top: 8px;
	}

	.footer {
		text-align: center;
	}

	.link {
		color: var(--a);
		font-weight: 500;
		text-decoration: none;
	}

	.link:hover {
		text-decoration: underline;
	}
</style>
