<script lang="ts">
	type PropsT = {
		symbol: string
	}

	const props: PropsT = $props()

	const symbolParts = $derived.by(() => {
		const match = props.symbol.match(/^([A-G][b#]?)(.*)$/)
		if (match) return { root: match[1], suffix: match[2] }
		return { root: props.symbol, suffix: '' }
	})

	const isRest = $derived(props.symbol === 'REST')
	const isRestClass = $derived(isRest ? 'isRest' : '')
</script>

<div class="ChordSymbolDisplay {isRestClass}">
	{symbolParts.root}<span class="variation">{symbolParts.suffix}</span>
</div>

<style>
	.ChordSymbolDisplay {
		color: #131313;
		font-weight: 700;
		letter-spacing: -0.01em;
		font-family: var(--font-display);
		font-size: 18px;
	}

	.ChordSymbolDisplay.isRest {
		letter-spacing: 0.5px;
		color: #71717b;
		font-weight: 400;
	}

	.variation {
		font-weight: 400;
		opacity: 0.75;
		margin-left: 2px;
	}
</style>
