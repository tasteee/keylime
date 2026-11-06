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

<z-text size="sm" weight={700} color={rootColor} class="chordSymbol">
	{symbolParts.root}<z-inline weight={400} class="chordSuffix">{symbolParts.suffix}</z-inline>
</z-text>

<style>
	.chordSymbol {
		letter-spacing: -0.01em;
		white-space: nowrap;
	}

	/* The ink tone of the note's color. Rests have no hue,
	   so they fall back to the plain muted tone. */
	.chordSuffix {
		color: var(--chord-ink, var(--muted-foreground));
	}
</style>
