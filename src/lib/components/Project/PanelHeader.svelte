<script lang="ts">
	import type { Snippet } from 'svelte'

	type PanelHeaderPropsT = {
		label: string
		// Optional context beside the label, e.g. the key.
		detail?: string
		// Optional trailing content, pushed to the far edge.
		children?: Snippet
	}

	const props: PanelHeaderPropsT = $props()
	const hasDetail = $derived(Boolean(props.detail))
</script>

<div class="panelHeader">
	<z-row gap="sm" alignsY="center" class="panelHeaderTitle">
		<z-text size="xs" weight={600} color="muted" class="panelHeaderLabel">{props.label}</z-text>

		{#if hasDetail}
			<z-text size="xs" weight={600} color="strong">{props.detail}</z-text>
		{/if}
	</z-row>

	{#if props.children}
		<div class="panelHeaderTrailing">
			{@render props.children()}
		</div>
	{/if}
</div>

<style>
	.panelHeader {
		display: flex;
		flex-shrink: 0;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-4);
		padding: var(--spacing-1) var(--spacing-3);
		background: var(--card);
		border-bottom: 1px solid var(--border);
		user-select: none;
	}

	.panelHeaderTitle {
		flex-shrink: 0;
	}

	.panelHeaderLabel {
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.panelHeaderTrailing {
		display: flex;
		align-items: center;
		min-width: 0;
	}
</style>
