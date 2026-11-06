<script lang="ts">
	import type { Snippet } from 'svelte'

	type AffixFieldPropsT = {
		// Muted text before the control. Example: "Octave".
		prefix?: string
		// Muted text after the control. Example: "bpm".
		suffix?: string
		children: Snippet
	}

	const props: AffixFieldPropsT = $props()

	const hasPrefix = $derived(Boolean(props.prefix))
	const hasSuffix = $derived(Boolean(props.suffix))
</script>

<div class="affix-field">
	{#if hasPrefix}
		<span class="affix-field-affix">{props.prefix}</span>
	{/if}

	{@render props.children()}

	{#if hasSuffix}
		<span class="affix-field-affix">{props.suffix}</span>
	{/if}
</div>

<style>
	.affix-field {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-1);
		box-sizing: border-box;
		height: 2rem;
		padding-inline: var(--spacing-3);
		background: var(--card);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		color: var(--foreground);
		font-size: var(--font-size-2);
		transition: border-color var(--motion-fast) var(--ease-enter);
	}

	.affix-field:hover {
		border-color: var(--muted-foreground);
	}

	.affix-field:focus-within {
		border-color: var(--foreground);
	}

	.affix-field-affix {
		color: var(--muted-foreground);
		white-space: nowrap;
	}

	.affix-field :global(input),
	.affix-field :global(select) {
		min-width: 0;
		padding: 0;
		background: transparent;
		border: none;
		outline: none;
		color: inherit;
		font: inherit;
		font-variant-numeric: tabular-nums;
	}

	.affix-field :global(select) {
		cursor: pointer;
	}
</style>
