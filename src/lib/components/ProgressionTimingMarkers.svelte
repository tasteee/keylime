<script lang="ts">
	type ProgressionTimingMarkersPropsT = {
		pixelsPerBeat: number
		beatsPerBar: number
		maxMarkerBars: number
	}

	const { pixelsPerBeat, beatsPerBar, maxMarkerBars }: ProgressionTimingMarkersPropsT = $props()

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
		<!-- Render 3 beat lines within this bar (the 4th is the first line of next bar) -->
		{#each [1, 2, 3] as beatOffset}
			<div class="beatLine" style="left: {beatOffset * pixelsPerBeat}px;"></div>
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
		width: 2px;
		height: 100%;
		background-color: var(--color-ink);
		opacity: 0.5;
	}

	.beatLine {
		position: absolute;
		top: 0;
		width: 1px;
		height: 100%;
		background-color: var(--color-ink);
		opacity: 0.2;
	}

	.barMarkerText {
		font-size: 11px;
		font-weight: 600;
		color: var(--color-ink);
		margin-left: 8px;
		margin-top: 4px;
		white-space: nowrap;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-family: var(--font-mono);
	}
</style>
