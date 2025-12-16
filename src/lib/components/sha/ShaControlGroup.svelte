<script lang="ts">
	import type { Snippet } from 'svelte'

	type PropsT = {
		children: Snippet
		label?: string
		description?: string

		layout?: 'vertical' | 'horizontal' // Stacked vs Side-by-side

		// Automation
		class?: string
		id?: string // For linking label to input
	}

	let { children, label, description, layout = 'vertical', class: className = '', id }: PropsT = $props()
</script>

<div class="control-group {layout === 'horizontal' ? 'isHorizontalLayout' : 'isVerticalLayout'} {className}">
	{#if label}
		<div class="header">
			<label class="label" for={id}>{label}</label>
			{#if description}
				<span class="description">{description}</span>
			{/if}
		</div>
	{/if}

	<div class="input-slot">
		{@render children()}
	</div>
</div>

<style>
	.control-group {
		display: flex;
		gap: 8px;
		width: 100%;
	}

	.isVerticalLayout {
		flex-direction: column;
	}

	.isHorizontalLayout {
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
	}

	.label {
		font-size: 13px;
		font-weight: 600;
		color: var(--color-text-secondary);
		user-select: none;
	}

	.description {
		font-size: 11px;
		color: var(--color-text-tertiary);
	}

	.input-slot {
		flex: 1;
		display: flex;
		align-items: center;
	}
</style>
