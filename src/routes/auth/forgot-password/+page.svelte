<script lang="ts">
	import { Button } from '$lib/components/ui/button'
	import { Input } from '$lib/components/ui/input'
	import { Label } from '$lib/components/ui/label'
	import { goto } from '$app/navigation'
	import { createSupabaseClient } from '$lib/supabase/client'
	import { fade } from 'svelte/transition'

	let email = $state('')
	let isSubmitting = $state(false)
	let error = $state<string | null>(null)
	let success = $state(false)

	const handleSubmit = async (event: Event) => {
		event.preventDefault()
		isSubmitting = true
		error = null

		const supabase = createSupabaseClient()
		const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
			redirectTo: `${window.location.origin}/auth/reset-password`
		})

		isSubmitting = false

		if (resetError) {
			error = resetError.message
			return
		}

		success = true
	}

	const handleGoToLogin = () => {
		goto('/auth/login')
	}
</script>

<div class="auth-container" in:fade>
	<div class="auth-card">
		<div class="logo">
			<span class="logo-text">KEYLIME</span>
		</div>

		{#if !success}
			<h1 class="auth-title">Reset Password</h1>
			<p class="auth-subtitle">Enter your email to receive a password reset link.</p>

			<form class="auth-form" onsubmit={handleSubmit}>
				<div class="form-group">
					<Label for="email">Email</Label>
					<Input
						id="email"
						type="email"
						bind:value={email}
						placeholder="you@example.com"
						required
						disabled={isSubmitting}
					/>
				</div>

				{#if error}
					<div class="error-message">{error}</div>
				{/if}

				<Button type="submit" class="w-full" disabled={isSubmitting}>
					{isSubmitting ? 'Sending...' : 'Send Reset Link'}
				</Button>
			</form>

			<div class="auth-footer">
				<button class="link-button" onclick={handleGoToLogin}> Back to Log In </button>
			</div>
		{:else}
			<div class="success-message">
				<h2>Check Your Email</h2>
				<p>We've sent a password reset link to <strong>{email}</strong>.</p>
				<p>Click the link in the email to reset your password.</p>
				<Button onclick={handleGoToLogin} class="mt-4 w-full">Back to Log In</Button>
			</div>
		{/if}
	</div>
</div>

<style>
	.auth-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #f5f5f7;
		padding: 24px;
	}

	.auth-card {
		width: 100%;
		max-width: 420px;
		background: white;
		border-radius: 12px;
		padding: 48px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
	}

	.logo {
		text-align: center;
		margin-bottom: 32px;
	}

	.logo-text {
		font-weight: 700;
		font-size: 28px;
		letter-spacing: -0.5px;
		color: #1d1d1f;
	}

	.auth-title {
		font-size: 28px;
		font-weight: 700;
		margin: 0 0 8px 0;
		text-align: center;
		color: #1d1d1f;
	}

	.auth-subtitle {
		text-align: center;
		color: #86868b;
		margin: 0 0 32px 0;
		font-size: 14px;
		line-height: 1.5;
	}

	.auth-form {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.error-message {
		padding: 12px;
		background-color: #fff3f3;
		border: 1px solid #ffcccc;
		border-radius: 8px;
		color: #d32f2f;
		font-size: 14px;
	}

	.success-message {
		text-align: center;
	}

	.success-message h2 {
		font-size: 24px;
		font-weight: 700;
		margin: 0 0 16px 0;
		color: #1d1d1f;
	}

	.success-message p {
		color: #86868b;
		margin: 0 0 12px 0;
		line-height: 1.5;
	}

	.auth-footer {
		margin-top: 24px;
		text-align: center;
	}

	.link-button {
		background: none;
		border: none;
		color: #667eea;
		cursor: pointer;
		font-size: 14px;
		text-decoration: none;
		padding: 0;
	}

	.link-button:hover {
		text-decoration: underline;
	}
</style>
