<script lang="ts">
	type ChordSymbolDisplayPropsT = {
		symbol: string
		size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
	}

	const props: ChordSymbolDisplayPropsT = $props()

	const symbolParts = $derived.by(() => {
		const match = props.symbol.match(/^([A-G][b#]?)(.*)$/)
		if (match) return { root: match[1], suffix: match[2] }
		return { root: props.symbol, suffix: '' }
	})

	const isRest = $derived(props.symbol === 'REST')
	const rootColor = $derived(isRest ? 'muted' : 'strong')
	const textSize = $derived(props.size ?? 'sm')
</script>

<z-text size={textSize} weight={700} color={rootColor} class="chordSymbol">
	<z-inline class="chordRoot">{symbolParts.root}</z-inline><z-inline weight={400} class="chordSuffix">{symbolParts.suffix}</z-inline>
</z-text>

<style>
	.chordSymbol {
		letter-spacing: -0.01em;
		white-space: nowrap;
	}

	.chordRoot {
		color: var(--chord-root, inherit);
	}

	/* The suffix tone of the note's color. Rests have no hue,
	   so they fall back to the plain muted tone. */
	.chordSuffix {
		color: var(--chord-suffix, var(--muted-foreground));
	}
</style>
