<script lang="ts">
	type PanelHeaderPropsT = {
		label: string
	}

	const props: PanelHeaderPropsT = $props()
</script>

<div class="panelHeader">
	<z-text size="xs" weight={600} color="muted" class="panelHeaderLabel">{props.label}</z-text>
</div>

<style>
	.panelHeader {
		display: flex;
		flex-shrink: 0;
		align-items: center;
		padding: var(--spacing-1) var(--spacing-3);
		background: var(--card);
		border-bottom: 1px solid var(--border);
		user-select: none;
	}

	.panelHeaderLabel {
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}
</style>
