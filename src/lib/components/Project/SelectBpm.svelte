<script lang="ts">
	import { InputNumberButton } from '$lib/components/ui/input-number-button/index.js'
	import projectStore from '$lib/stores/project.svelte'

	const handleBpmCommit = (newBpm: number) => {
		projectStore.bpm = newBpm
		projectStore.markDirty()
	}
</script>

<InputNumberButton
	bind:value={projectStore.bpm}
	min={20}
	max={300}
	step={1}
	inputWidth="48px"
	label="BPM"
	size="small"
	kind="solid"
	color="neutral"
	oncommit={handleBpmCommit}
/>
