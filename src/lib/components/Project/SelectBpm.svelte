<script lang="ts">
	import { InputNumberButton } from '$lib/components/ui/input-number-button/index.js'
	import { useProjectEditor } from '$lib/modules/useProjectEditor'

	const projectEditor = useProjectEditor()

	let value = $state(projectEditor.state.project.bpm)

	// Sync with project state
	$effect(() => {
		value = projectEditor.state.project.bpm
	})

	const handleBpmCommit = (newBpm: number) => {
		projectEditor.updateProject({ bpm: newBpm })
	}
</script>

<InputNumberButton
	bind:value
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
