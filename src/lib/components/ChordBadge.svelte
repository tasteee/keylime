<script lang="ts">
	type ChordBadgePropsT = {
		item: ProgressionItemT
	}

	const props: ChordBadgePropsT = $props()

	const isRest = $derived(props.item.type === 'rest')
	const hasOctaveModifier = $derived(props.item.type === 'chord' && props.item.octaveOffset != 0)
	const hasInversionModifier = $derived(props.item.type === 'chord' && props.item.inversion != 0)
	const hasVoicingModifier = $derived(props.item.type === 'chord' && props.item.voicing !== 'closed')
	const isModified = $derived(hasOctaveModifier || hasInversionModifier || hasVoicingModifier)

	const badgeKind = $derived(isRest ? 'outline' : 'soft')
	const badgeTone = $derived(isModified ? 'primary' : 'neutral')
	const badgeLabel = $derived(isModified ? `${props.item.symbol}*` : props.item.symbol)
</script>

<z-badge kind={badgeKind} tone={badgeTone} size="sm" label={badgeLabel}></z-badge>
