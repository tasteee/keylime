<script>
	import CHORD_MODES_CONFIG from '../constants/chordModes.json'
	import * as Select from '$lib/components/ui/select/index.js'
  import main from '../stores/main.svelte.js'

	const handleSelect = (value) => {
		main.selectedChordMode = value
	}
</script>

<Select.Root type="single" onValueChange={handleSelect} value={main.selectedChordMode}>
	<Select.Trigger class="w-[180px]">
		<span>
			<span class="innerLabel">Chord Mode: </span>
			{main.selectedChordMode}
		</span>
	</Select.Trigger>
	<Select.Content>
		{#each CHORD_MODES_CONFIG as chordMode}
			<Select.Item value={chordMode.name}>{chordMode.name}</Select.Item>
		{/each}
	</Select.Content>
</Select.Root>

<style>
  .innerLabel {
    font-weight: 500;
  }
</style>
