<script lang="ts">
	type PropsT = {
		children?: import('svelte').Snippet
		class?: string
		isHoverable?: boolean
	}

	let { children, class: className = '', isHoverable = false }: PropsT = $props()
</script>

<div class="card {isHoverable ? 'isHoverable' : ''} {className}">
	{@render children?.()}
</div>

<style>
	.card {
		background: var(--color-surface);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-md);
		padding: 24px;
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease;
		border: 1px solid rgba(255, 255, 255, 0.4); /* Subtle frost border */
	}

	.isHoverable:hover {
		transform: translateY(-4px);
		box-shadow: var(--shadow-xl);
	}
</style>
