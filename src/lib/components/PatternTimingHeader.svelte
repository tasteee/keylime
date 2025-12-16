<script lang="ts">
	import mainStore from '$lib/stores/main.svelte'

	const BAR_COUNT = 16
	const BEATS_PER_BAR = 4
	const BEAT_WIDTH = 128 // 32px * 4 cells
	const BAR_WIDTH = BEAT_WIDTH * BEATS_PER_BAR

	let hoveredBarIndex: number | null = $state(null)

	const handleBarClick = (index: number) => {
		mainStore.patternLengthBars = index + 1
	}
</script>

<div class="patternTimingHeader">
	{#each { length: BAR_COUNT } as _, i}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="barMarker"
			class:inactive={i >= mainStore.patternLengthBars}
			style="width: {BAR_WIDTH}px"
			onmouseenter={() => (hoveredBarIndex = i)}
			onmouseleave={() => (hoveredBarIndex = null)}
			onclick={() => handleBarClick(i)}
		>
			{#if hoveredBarIndex === i}
				<div class="setDurationOverlay">
					<span class="setDurationText"><span>Set Duration to</span> {i + 1} {i === 0 ? 'Bar' : 'Bars'}</span>
				</div>
			{/if}

			{#each { length: BEATS_PER_BAR } as _, beatIndex}
				<div class="beatSlot">
					{#if beatIndex === 0}
						<span class="barLabel">{i + 1}</span>
					{:else}
						<div class="beatTick"></div>
					{/if}
				</div>
			{/each}
		</div>
	{/each}
</div>

<style>
	.patternTimingHeader {
		display: flex;
		height: 32px;
		position: sticky;
		top: 0;
		z-index: 101;
		background: var(--muted);
		border-bottom: 1px solid var(--border);
		width: fit-content;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
	}

	.barMarker {
		height: 100%;
		border-left: 1px solid var(--border);
		display: flex;
		font-size: 10px;
		font-weight: 600;
		color: var(--muted-foreground);
		user-select: none;
		box-sizing: border-box;
		position: relative;
		left: -1px;
		transition: background-color 0.1s;
	}

	.barMarker.inactive {
		background-color: #c3c3c3;
		opacity: 0.5;
	}

	.barMarker:hover {
		cursor: pointer;
		background-color: var(--secondary);
		opacity: 1;
	}

	.setDurationOverlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0.9;
		z-index: 10;
		border-right: 1px solid var(--border);
	}

	.setDurationText {
		font-size: 12px;
		font-weight: bold;
		color: var(--grayscale10);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.setDurationText span {
		font-weight: 500;
		margin-right: 2px;
	}

	.beatSlot {
		flex: 1;
		height: 100%;
		position: relative;
		display: flex;
		align-items: center;
		position: relative;
		left: -0.5px;
	}

	.barLabel {
		padding-left: 6px;
	}

	.beatTick {
		position: absolute;
		left: 0;
		bottom: 0;
		width: 1px;
		height: 12px;
		background-color: var(--border);
	}
</style>
