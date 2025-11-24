<script lang="ts">
	import ChordCard from './ChordCard.svelte'
	import scaleChords from '$lib/constants/scaleChords.json'
	import mainStore from '$lib/stores/main.svelte'
	import { getScaleChords } from '$lib/helpers/chords'

	const scale = $derived(mainStore.selectedKey + ' ' + mainStore.selectedScale)
	const inScaleChordNames = $derived(getScaleChords(scale))

	$effect(() => {
		console.log(mainStore.selectedKey, mainStore.selectedScale)
		console.log('inScaleChordNames:', inScaleChordNames)
	})
</script>

<section
	class="ChordCardGrid px-4 py-4 gap-4 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 grid w-full flex-1 grid-cols-2 overflow-y-auto"
>
	{#each inScaleChordNames as chordName}
		<ChordCard {chordName} />
	{/each}
</section>
