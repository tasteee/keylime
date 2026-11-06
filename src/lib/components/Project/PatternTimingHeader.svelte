<script lang="ts">
	import { useProjectEditor } from '$lib/modules/useProjectEditor'
	import { toFractionString } from '$lib/helpers/numbers'

	const BAR_COUNT = 16
	const BEATS_PER_BAR = 4
	const CELLS_PER_BEAT = 4
	const CELLS_PER_BAR = BEATS_PER_BAR * CELLS_PER_BEAT
	const MAX_CELLS = BAR_COUNT * CELLS_PER_BAR

	type Props = {
		cellWidth?: number
	}

	let { cellWidth = 32 }: Props = $props()

	const projectEditor = useProjectEditor()
	const patternDurationBars = $derived(projectEditor.state.project.patternDurationBars)
	const beatWidth = $derived(cellWidth * CELLS_PER_BEAT)
	const barWidth = $derived(beatWidth * BEATS_PER_BAR)
	const headerWidth = $derived(barWidth * BAR_COUNT)
	const activeWidth = $derived(patternDurationBars * barWidth)

	// The cell the pointer is over, counted from 1. Clicking a cell ends
	// the pattern at the end of that cell: 1/16 of a bar up to 16 bars.
	let hoveredCellCount: number | null = $state(null)

	const hoverMarkerLeft = $derived((hoveredCellCount ?? 0) * cellWidth)
	const hoveredBars = $derived((hoveredCellCount ?? 0) / CELLS_PER_BAR)

	const formatBars = (bars: number): string => {
		const unit = bars <= 1 ? 'bar' : 'bars'
		return `${toFractionString(bars)} ${unit}`
	}

	const hoverLabel = $derived(`Set duration to ${formatBars(hoveredBars)}`)

	const getCellCountAtPointer = (event: MouseEvent): number => {
		const header = event.currentTarget as HTMLElement
		const pointerX = event.clientX - header.getBoundingClientRect().left
		const cellIndex = Math.floor(pointerX / cellWidth)
		const cellCount = cellIndex + 1
		return Math.min(MAX_CELLS, Math.max(1, cellCount))
	}

	const handlePointerMove = (event: MouseEvent) => {
		hoveredCellCount = getCellCountAtPointer(event)
	}

	const handlePointerLeave = () => {
		hoveredCellCount = null
	}

	const handleClick = (event: MouseEvent) => {
		const cellCount = getCellCountAtPointer(event)
		projectEditor.updateProject({ patternDurationBars: cellCount / CELLS_PER_BAR })
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="patternTimingHeader"
	style="width: {headerWidth}px"
	onmousemove={handlePointerMove}
	onmouseleave={handlePointerLeave}
	onclick={handleClick}
>
	{#each { length: BAR_COUNT } as _, barIndex}
		<div class="barMarker" style="width: {barWidth}px">
			{#each { length: BEATS_PER_BAR } as _, beatIndex}
				<div class="beatSlot">
					{#if beatIndex === 0}
						<span class="barLabel">{barIndex + 1}</span>
					{:else}
						<div class="beatTick"></div>
					{/if}
				</div>
			{/each}
		</div>
	{/each}

	<div class="inactiveRegion" style="left: {activeWidth}px"></div>

	{#if hoveredCellCount !== null}
		<div class="hoverMarker" style="left: {hoverMarkerLeft}px"></div>
		<div class="hoverLabel" style="left: {hoverMarkerLeft}px">{hoverLabel}</div>
	{/if}
</div>

<style>
	.patternTimingHeader {
		display: flex;
		height: 2rem;
		position: sticky;
		top: 0;
		z-index: 101;
		background: var(--card);
		border-bottom: 1px solid var(--border);
		cursor: pointer;
	}

	.barMarker {
		height: 100%;
		border-left: 1px solid var(--border);
		display: flex;
		font-size: var(--font-size-1);
		font-weight: var(--font-weight-semibold);
		color: var(--muted-foreground);
		user-select: none;
		box-sizing: border-box;
		position: relative;
		left: -1px;
	}

	.inactiveRegion {
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		background-color: var(--color-neutral-3);
		opacity: 0.5;
		pointer-events: none;
	}

	.hoverMarker {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 2px;
		margin-left: -1px;
		background-color: var(--foreground);
		pointer-events: none;
	}

	.hoverLabel {
		position: absolute;
		top: 0;
		height: 100%;
		display: flex;
		align-items: center;
		padding: 0 var(--spacing-2);
		margin-left: var(--spacing-1);
		background: var(--card);
		color: var(--foreground);
		font-size: var(--font-size-2);
		font-weight: var(--font-weight-bold);
		white-space: nowrap;
		pointer-events: none;
	}

	.beatSlot {
		flex: 1;
		height: 100%;
		position: relative;
		display: flex;
		align-items: center;
		left: -0.5px;
	}

	.barLabel {
		padding-left: var(--spacing-2);
	}

	.beatTick {
		position: absolute;
		left: 0;
		bottom: 0;
		width: 1px;
		height: 0.75rem;
		background-color: var(--border);
	}
</style>
