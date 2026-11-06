<script lang="ts">
	import { DownloadSimple } from 'phosphor-svelte'
	import { useProjectEditor } from '$lib/modules/useProjectEditor'
	import { calculateStartTimes } from '$lib/helpers/progression'
	import { exportPerformanceAsMidi, exportChordsAsMidi } from '$lib/helpers/midiExport'

	const projectEditor = useProjectEditor()

	const downloadMenuItems = [
		{ value: 'chords', label: 'Chords' },
		{ value: 'performance', label: 'Performance' }
	]

	const getProjectWithStartTimes = () => {
		const project = projectEditor.state.project
		const progressionChords = calculateStartTimes({ items: project.progressionChords })
		return { ...project, progressionChords }
	}

	const handleSelect = (event: CustomEvent) => {
		const selectedValue: string = event.detail.value
		if (selectedValue === 'chords') exportChordsAsMidi(getProjectWithStartTimes())
		if (selectedValue === 'performance') exportPerformanceAsMidi(getProjectWithStartTimes())
	}
</script>

<z-menu items={downloadMenuItems} align="end" onselect={handleSelect}>
	<z-button slot="trigger" kind="outline" size="sm" aria-label="Download">
		<DownloadSimple size={16} weight="bold" />
	</z-button>
</z-menu>
