<script lang="ts">
	import ChordCard from './ChordCard.svelte'
	import gridChordsStore from '$lib/stores/gridChords.svelte'
	import SelectKey from './SelectKey.svelte'
	import SelectOctave from './SelectOctave.svelte'
	import SelectScale from './SelectScale.svelte'
	import Box from './Box.svelte'
	import ShaDivider from './ShaDivider.svelte'
	import Icon from '@iconify/svelte'
	import main from '$lib/stores/main.svelte'

	const gridChords = $derived(gridChordsStore.gridChords)

	const keyScaleText = $derived.by(() => {
		const key = main.selectedKey || ''
		const scale = main.selectedScale || ''
		return `${key} ${scale}`
	})
</script>

<section class="ChordCardGrid">
	<div class="chordToolbar">
		<Box gap="16px" align="center">
			<Icon icon="mingcute:grid-fill" width="20px" height="20px" />

			<div class="titleSection">
				<span class="herPanelTitle">Chords</span>
				<span class="keyScaleText text-xs font-medium text-foreground/80 whitespace-nowrap uppercase">
					{keyScaleText}
				</span>
			</div>
		</Box>

		<ShaDivider margin="24px" />

		<Box gap="8px" align="center">
			<SelectKey />
			<SelectScale />
			<SelectOctave />
		</Box>

		<ShaDivider margin="24px" />
	</div>

	<div class="containerrr">
		{#each gridChords as chord}
			<ChordCard {chord} />
		{/each}
	</div>
</section>

<style>
	.ChordCardGrid {
		width: 100%;
		min-height: 0;
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.chordToolbar {
		display: flex;
		flex-direction: row;
		align-items: center;
		padding: 0px 24px;
		height: 54px;
		background-color: var(--color-panel-bg);
		border-bottom: 1px solid var(--n-03);
		/* border-top: 1px solid var(--n-03); */
	}

	.titleSection {
		display: flex;
		flex-direction: column;
	}

	.keyScaleText {
		position: relative;
		top: -5px;
	}

	.containerrr {
		align-content: start;
		/* border-radius: 5px; */
		display: grid;
		flex: 1;
		grid-template-columns: repeat(auto-fill, minmax(165px, 1fr));
		overflow: hidden;
		overflow-y: auto;
		width: 100%;
		border-right: none;
		border-bottom: none;
		padding: 12px;
		background: var(--n-02);
	}
</style>
