<script lang="ts">
	import SelectControl from './SelectControl.svelte'
	import { useProjectEditor } from '$lib/modules/useProjectEditor'

	const projectEditor = useProjectEditor()
	const patternDurationBars = $derived(projectEditor.state.project.patternDurationBars)

	const patternLengthOptions = [1, 2, 4, 8, 16, 32].map((barCount) => ({
		value: String(barCount),
		label: barCount === 1 ? '1 bar' : `${barCount} bars`
	}))

	const handleSelect = (value: string) => {
		const parsedValue = parseInt(value, 10)
		const isValidNumber = !isNaN(parsedValue)
		if (!isValidNumber) return
		projectEditor.updateProject({ patternDurationBars: parsedValue })
	}
</script>

<SelectControl label="Duration" value={String(patternDurationBars)} options={patternLengthOptions} onValueChange={handleSelect} />
