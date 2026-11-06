<script lang="ts">
	import SelectControl from './SelectControl.svelte'
	import { useProjectEditor } from '$lib/modules/useProjectEditor'
	import { toFractionString } from '$lib/helpers/numbers'

	const projectEditor = useProjectEditor()
	const patternDurationBars = $derived(projectEditor.state.project.patternDurationBars)

	// The server caps a pattern at 16 bars.
	const presetBarCounts = [1, 2, 4, 8, 16]

	const formatBarLabel = (barCount: number): string => {
		const unit = barCount <= 1 ? 'bar' : 'bars'
		return `${toFractionString(barCount)} ${unit}`
	}

	// A duration set by clicking the timing header can fall between the presets.
	// It gets its own option so the select never shows a different length.
	const patternLengthOptions = $derived.by(() => {
		const hasCustomDuration = !presetBarCounts.includes(patternDurationBars)
		const barCounts = hasCustomDuration ? [...presetBarCounts, patternDurationBars].sort((a, b) => a - b) : presetBarCounts
		return barCounts.map((barCount) => ({ value: String(barCount), label: formatBarLabel(barCount) }))
	})

	const handleSelect = (value: string) => {
		const parsedValue = parseFloat(value)
		const isValidNumber = !isNaN(parsedValue)
		if (!isValidNumber) return
		projectEditor.updateProject({ patternDurationBars: parsedValue })
	}
</script>

<SelectControl label="Duration" value={String(patternDurationBars)} options={patternLengthOptions} onValueChange={handleSelect} />
