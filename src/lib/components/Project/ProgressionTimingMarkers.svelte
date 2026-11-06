<script lang="ts">
	type ProgressionTimingMarkersPropsT = {
		pixelsPerBeat: number
		beatsPerBar: number
		maxMarkerBars: number
		gridStepBeats: number
	}

	const { pixelsPerBeat, beatsPerBar, maxMarkerBars, gridStepBeats }: ProgressionTimingMarkersPropsT = $props()

	// Grid lines inside one bar, after its first line.
	const gridLines = $derived.by(() => {
		const lines: { pixel: number; isBeat: boolean }[] = []
		const lineCount = Math.round(beatsPerBar / gridStepBeats)

		for (let lineIndex = 1; lineIndex < lineCount; lineIndex++) {
			const beatOffset = lineIndex * gridStepBeats
			const isBeat = Number.isInteger(beatOffset)
			lines.push({ pixel: beatOffset * pixelsPerBeat, isBeat })
		}

		return lines
	})

	const markers = $derived.by(() => {
		const markersList: { beat: number; pixel: number; label: string }[] = []

		const beatToPixel = (beat: number): number => {
			return beat * pixelsPerBeat
		}

		const maxBeat = maxMarkerBars * beatsPerBar

		for (let beat = 0; beat <= maxBeat; beat += beatsPerBar) {
			const barNumber = beat / beatsPerBar + 1
			markersList.push({
				beat: beat,
				pixel: beatToPixel(beat),
				label: `${barNumber} ${barNumber === 1 ? 'bar' : 'bars'}`
			})
		}

		return markersList
	})
</script>

{#each markers as marker}
	<div class="barMarker" style="left: {marker.pixel}px;">
		<div class="barMarkerLine"></div>
		<span class="barMarkerText">{marker.label}</span>
		{#each gridLines as line}
			<div class="beatLine" class:isSubdivision={!line.isBeat} style="left: {line.pixel}px;"></div>
		{/each}
	</div>
{/each}

<style>
	.barMarker {
		position: absolute;
		top: 0;
		z-index: 10;
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		pointer-events: none;
		height: 100%;
		width: 328px !important;
	}

	.barMarkerLine {
		width: 1px;
		height: 100%;
		background-color: var(--color-neutral-5);
		opacity: 0.5;
	}

	.beatLine {
		position: absolute;
		top: 0;
		width: 1px;
		height: 100%;
		background-color: var(--color-neutral-5);
		opacity: 0.2;
	}

	.beatLine.isSubdivision {
		opacity: 0.1;
	}

	.barMarkerText {
		font-size: var(--font-size-1);
		font-weight: var(--font-weight-semibold);
		color: var(--muted-foreground);
		margin-left: var(--spacing-2);
		margin-top: calc(var(--spacing-1) / 2 + 2px);
		white-space: nowrap;
		font-family: var(--font-mono);
	}
</style>
