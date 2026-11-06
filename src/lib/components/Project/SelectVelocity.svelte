<script lang="ts">
	import output from '$lib/stores/output.svelte'

	const velocityRange = $derived([output.minVelocity, output.maxVelocity])
	const velocityLabel = $derived(`${output.minVelocity}–${output.maxVelocity}`)

	const handleVelocityChange = (event: CustomEvent) => {
		const nextRange: number[] = event.detail.value
		const minValue = nextRange[0]
		const maxValue = nextRange[1]
		if (minValue !== undefined) output.minVelocity = minValue
		if (maxValue !== undefined) output.maxVelocity = maxValue
	}

	$effect(() => {
		// Persist to localStorage. output.svelte.ts reads it back first.
		localStorage.setItem('output.minVelocity', String(output.minVelocity))
		localStorage.setItem('output.maxVelocity', String(output.maxVelocity))
	})
</script>

<z-row gap="xs" alignsY="center">
	<z-text size="xs" color="muted" weight={600} class="controlLabel">Velocity</z-text>
	<z-popover placement="top-start">
		<z-button slot="trigger" kind="outline" size="sm">{velocityLabel}</z-button>
		<z-column gap="sm" class="velocityPanel">
			<z-range
				label="Velocity range"
				min={1}
				max={127}
				step={1}
				value={velocityRange}
				doesShowValue
				oninput={handleVelocityChange}
			></z-range>
		</z-column>
	</z-popover>
</z-row>

<style>
	.controlLabel {
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.velocityPanel {
		width: 16rem;
	}
</style>
