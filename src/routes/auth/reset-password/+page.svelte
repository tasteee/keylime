<script lang="ts">
	import { Button } from '$lib/components/ui/button'
	import { Input } from '$lib/components/ui/input'
	import { Label } from '$lib/components/ui/label'
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'
	import { createSupabaseClient } from '$lib/supabase/client'
	import { fade } from 'svelte/transition'
	import { onMount } from 'svelte'

	let password = $state('')
	let confirmPassword = $state('')
	let isSubmitting = $state(false)
	let error = $state<string | null>(null)
	let success = $state(false)
	let hasValidToken = $state(false)

	onMount(() => {
		// Check if we have a valid token in the URL
		const token = $page.url.searchParams.get('token')
		hasValidToken = !!token
	})

	const handleSubmit = async (event: Event) => {
		event.preventDefault()
		error = null

		if (password !== confirmPassword) {
			error = 'Passwords do not match'
			return
		}

		if (password.length < 8) {
			error = 'Password must be at least 8 characters'
			return
		}

		isSubmitting = true

		const supabase = createSupabaseClient()
		const { error: updateError } = await supabase.auth.updateUser({
			password: password
		})

		isSubmitting = false

		if (updateError) {
			error = updateError.message
			return
		}

		success = true

		// Redirect to dashboard after 2 seconds
		setTimeout(() => {
			goto('/dashboard')
		}, 2000)
	}

	const handleGoToLogin = () => {
		goto('/auth/login')
	}
</script>

<div class="auth-container" in:fade>
	<div class="auth-card">
		<div class="logo">
			<span class="logo">KEYLIME</span>
		</div>

		{#if !hasValidToken}
			<div class="error-state">
				<h2>Invalid or Expired Link</h2>
				<p>This password reset link is invalid or has expired.</p>
				<Button onclick={() => goto('/auth/forgot-password')} class="mt-4 w-full">Request New Link</Button>
			</div>
		{:else if !success}
			<h1 class="auth-title">Reset Password</h1>
			<p class="auth-subtitle">Enter your new password below.</p>

			<form class="auth-form" onsubmit={handleSubmit}>
				<div class="form-group">
					<Label for="password">New Password</Label>
					<Input
						id="password"
						type="password"
						bind:value={password}
						placeholder="Enter new password"
						required
						disabled={isSubmitting}
					/>
				</div>

				<div class="form-group">
					<Label for="confirmPassword">Confirm Password</Label>
					<Input
						id="confirmPassword"
						type="password"
						bind:value={confirmPassword}
						placeholder="Confirm new password"
						required
						disabled={isSubmitting}
					/>
				</div>

				{#if error}
					<div class="error-message">{error}</div>
				{/if}

				<Button type="submit" class="w-full" disabled={isSubmitting}>
					{isSubmitting ? 'Resetting...' : 'Reset Password'}
				</Button>
			</form>

			<div class="auth-footer">
				<button class="link-button" onclick={handleGoToLogin}> Back to Log In </button>
			</div>
		{:else}
			<div class="success-message">
				<h2>Password Reset Successfully!</h2>
				<p>Your password has been updated. Redirecting to dashboard...</p>
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

	.success-message,
	.error-state {
		text-align: center;
	}

	.success-message h2,
	.error-state h2 {
		font-size: 24px;
		font-weight: 700;
		margin: 0 0 16px 0;
		color: #1d1d1f;
	}

	.success-message p,
	.error-state p {
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
