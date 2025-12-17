<script lang="ts">
	import { cn } from '$lib/utils'

	interface Props {
		sidebar?: import('svelte').Snippet
		topbar?: import('svelte').Snippet
		bottomPanel?: import('svelte').Snippet
		children?: import('svelte').Snippet
	}

	let { sidebar, topbar, bottomPanel, children }: Props = $props()
</script>

<div class="app-shell">
	{#if sidebar}
		<aside class="sidebar">
			{@render sidebar()}
		</aside>
	{/if}

	<main class="main-content">
		{#if topbar}
			<header class="topbar">
				{@render topbar()}
			</header>
		{/if}

		<div class="workspace">
			{@render children?.()}
		</div>

		{#if bottomPanel}
			<div class="bottom-panel">
				{@render bottomPanel()}
			</div>
		{/if}
	</main>
</div>

<style>
	.app-shell {
		display: flex;
		height: 100vh;
		width: 100vw;
		overflow: hidden;
		background-color: hsl(var(--background));
		color: hsl(var(--foreground));
	}

	.sidebar {
		width: 280px;
		flex-shrink: 0;
		border-right: 1px solid hsl(var(--border));
		background-color: hsl(var(--sidebar));
		display: flex;
		flex-direction: column;
	}

	.main-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.topbar {
		height: 60px;
		border-bottom: 1px solid hsl(var(--border));
		display: flex;
		align-items: center;
		padding: 0 1rem;
		background-color: hsl(var(--background));
	}

	.workspace {
		flex: 1;
		overflow: auto;
		padding: 1rem;
		position: relative;
	}

	.bottom-panel {
		height: 320px;
		border-top: 1px solid hsl(var(--border));
		background-color: hsl(var(--card));
		display: flex;
		flex-direction: column;
	}
</style>
