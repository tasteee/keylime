<script lang="ts">
	import type { Snippet } from 'svelte'

	type PageHeaderPropsT = {
		title: string
		subtitle?: string
		eyebrow?: string
		actions?: Snippet
	}

	const props: PageHeaderPropsT = $props()

	const hasEyebrow = $derived(Boolean(props.eyebrow))
	const hasSubtitle = $derived(Boolean(props.subtitle))
</script>

<z-row alignsX="between" alignsY="center" gap="md" doesWrap isFullWidth>
	<z-column gap="2xs">
		{#if hasEyebrow}
			<z-eyebrow label={props.eyebrow}></z-eyebrow>
		{/if}
		<z-heading size="sm">{props.title}</z-heading>
		{#if hasSubtitle}
			<z-text color="muted">{props.subtitle}</z-text>
		{/if}
	</z-column>

	{@render props.actions?.()}
</z-row>
