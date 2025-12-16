<script lang="ts">
	import ChordCard from './ChordCard.svelte'
	import gridChordsStore from '$lib/stores/gridChords.svelte'
	import SelectKey from './SelectKey.svelte'
	import SelectOctave from './SelectOctave.svelte'
	import SelectScale from './SelectScale.svelte'
	import Box from './Box.svelte'

	const gridChords = $derived(gridChordsStore.gridChords)
</script>

<section class="ChordCardGrid">
	<Box align="center" justify="between" width="100%" marginBottom="8px">
		<div class="herPanelTitleBox">
			<span class="herPanelTitle">Chords</span>
		</div>
		<Box gap="8px" align="center">
			<SelectKey />
			<SelectScale />
			<SelectOctave />
		</Box>
	</Box>
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
	}

	.containerrr {
		align-content: start;
		border-radius: 12px;
		display: grid;
		flex: 1;
		grid-template-columns: repeat(auto-fill, minmax(165px, 1fr));
		border: 1px solid #747474;
		overflow: hidden;
		overflow-y: auto;
		width: 100%;
		border-right: none;
		border-bottom: none;
		padding-bottom: 1px;
		padding-right: 1px;
		/* background: #f6f6f6; */
	}
</style>
