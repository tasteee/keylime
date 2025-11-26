<script lang="ts">
	import ChordCard from './ChordCard.svelte'
	import gridChordsStore from '$lib/stores/gridChords.svelte'

	const gridChords = $derived(gridChordsStore.gridChords)
</script>

<section
	class="ChordCardGrid px-4 py-4 gap-x-4 gap-y-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 grid w-full flex-1 grid-cols-2 overflow-y-auto"
>
	{#each gridChords as chord}
		<ChordCard {chord} />
	{/each}
</section>
