<script lang="ts">
	type ChordSymbolDisplayPropsT = {
		symbol: string
	}

	const props: ChordSymbolDisplayPropsT = $props()

	const symbolParts = $derived.by(() => {
		const match = props.symbol.match(/^([A-G][b#]?)(.*)$/)
		if (match) return { root: match[1], suffix: match[2] }
		return { root: props.symbol, suffix: '' }
	})

	const isRest = $derived(props.symbol === 'REST')
	const rootColor = $derived(isRest ? 'muted' : 'strong')
</script>

<z-text size="lg" weight={700} color={rootColor} class="chordSymbol">
	{symbolParts.root}<z-inline color="muted" weight={400}>{symbolParts.suffix}</z-inline>
</z-text>

<style>
	.chordSymbol {
		letter-spacing: -0.01em;
	}
</style>
