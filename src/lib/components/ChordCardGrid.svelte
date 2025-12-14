<script lang="ts">
	import ChordCard from './ChordCard.svelte'
	import gridChordsStore from '$lib/stores/gridChords.svelte'

	const gridChords = $derived(gridChordsStore.gridChords)
</script>

<section class="ChordCardGrid">
	{#each gridChords as chord}
		<ChordCard {chord} />
	{/each}
</section>

<style>
	.ChordCardGrid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 16px;
		padding: 24px;
		width: 100%;
		flex: 1;
		overflow-y: auto;
		align-content: start;
	}
</style>
