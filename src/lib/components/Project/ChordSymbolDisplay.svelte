<script lang="ts">
	type ChordSymbolDisplayPropsT = {
		symbol: string
		size?: 'sm' | 'lg'
	}

	const props: ChordSymbolDisplayPropsT = $props()

	const symbolParts = $derived.by(() => {
		const match = props.symbol.match(/^([A-G][b#]?)([^(]*)(.*)$/)
		if (match) return { root: match[1], suffix: match[2], alteration: match[3] }
		return { root: props.symbol, suffix: '', alteration: '' }
	})

	const canWrap = $derived(props.size === 'lg')
	const size = $derived(props.size ?? 'sm')
	const isRest = $derived(props.symbol === 'REST')
	const rootColor = $derived(isRest ? 'muted' : 'strong')
</script>

<z-text {size} weight={700} color={rootColor} class="chordSymbol" class:canWrap>
	<z-inline class="chordRoot">{symbolParts.root}</z-inline><z-inline weight={400} class="chordSuffix">{symbolParts.suffix}</z-inline>{#if symbolParts.alteration}<wbr /><z-inline weight={400} class="chordSuffix chordAlteration">{symbolParts.alteration}</z-inline>{/if}
</z-text>

<style>
	.chordSymbol {
		letter-spacing: -0.01em;
		white-space: nowrap;
	}

	.chordSymbol.canWrap {
		min-width: 0;
		white-space: normal;
		overflow-wrap: normal;
	}

	.chordAlteration {
		display: inline-block;
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
