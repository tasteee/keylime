<script lang="ts">
	import Badge from '$lib/components/ui/badge/badge.svelte'

	type ChordBadgePropsT = ProgressionChordT

	const props: ChordBadgePropsT = $props()

	const hasOctaveModifier = $derived(props.octaveOffset != 0)
	const hasInversionModifier = $derived(props.inversion != 0)
	const hasVoicingModifier = $derived(props.voicing !== 'closed')
	const isModified = $derived(hasOctaveModifier || hasInversionModifier || hasVoicingModifier)
	const className = $derived(`ChordBadge ${isModified ? 'isModified' : ''}`)
</script>

<Badge kind="solid" color="dark" size="small" class={className}>
	{props.symbol}
	{#if isModified}
		<span class="chordModifierAsterisk">*</span>
	{/if}
</Badge>

<style>
	:global .ChordBadge {
		position: relative;
	}

	:global .ChordBadge.isModified {
		color: var(--a-01) !important;
	}

	:global .chordModifierAsterisk {
		color: var(--a-05);
		font-weight: 500;
		font-size: 1.1em;
		font-size: 24px;
		position: absolute;
		right: -1px;
		top: -5px;
	}
</style>
