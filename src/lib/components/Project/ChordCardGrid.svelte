<script lang="ts">
	import { getContext } from 'svelte'
	import ChordCard from './ChordCard.svelte'

	type ProjectEditorContextT = {
		gridChords: ChordT[]
	}

	const context = getContext<ProjectEditorContextT>('projectEditor')
	const gridChords = $derived(context.gridChords)
</script>

<z-scroll class="chordCardScroll" inset="md">
	<z-grid minColumnWidth="10rem" gap="sm">
		{#each gridChords as chord (chord.id)}
			<ChordCard {chord} />
		{/each}
	</z-grid>
</z-scroll>

<style>
	/*
	 * z-scroll only scrolls once its viewport has a max height. Capping the
	 * viewport at the height of this flex item makes it scroll when the
	 * chords do not fit.
	 */
	.chordCardScroll {
		--z-scroll-max-height: 100%;
		flex: 1 1 0;
		min-height: 0;
		width: 100%;
	}
</style>
