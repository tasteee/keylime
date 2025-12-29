<script lang="ts">
	import { page } from '$app/stores'

	const status = $page.status
	const message = $page.error?.message || 'An error occurred'
</script>

<div class="errorContainer">
	<h1>{status}</h1>
	<p>{message}</p>
	<a href="/dashboard">Return to Dashboard</a>
</div>

<style>
	.errorContainer {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		padding: 2rem;
		text-align: center;
		gap: 1rem;
	}

	h1 {
		font-size: 4rem;
		font-weight: bold;
		margin: 0;
	}

	p {
		font-size: 1.25rem;
		margin: 0;
		opacity: 0.8;
	}

	a {
		margin-top: 1rem;
		padding: 0.75rem 1.5rem;
		background: var(--accent-color, #4a90e2);
		color: white;
		text-decoration: none;
		border-radius: 0.5rem;
		transition: opacity 0.2s;
	}

	a:hover {
		opacity: 0.9;
	}
</style>
