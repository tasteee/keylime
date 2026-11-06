<script lang="ts">
	import { SquaresFour, MusicNotes } from 'phosphor-svelte'
	import AppTopBar from '$lib/components/shell/AppTopBar.svelte'
	import { useProjectEditor } from '$lib/modules/useProjectEditor'

	const projectEditor = useProjectEditor()
	const activeView = $derived(projectEditor.state.activeView)

	const handleViewPress = (view: 'chords' | 'pattern') => {
		projectEditor.state.activeView = view
	}
</script>

<AppTopBar hasNavigation={false}>
	<z-toggle-button-group size="sm" kind="outline" aria-label="Editor view">
		<z-toggle-button-group-item value="chords" isPressed={activeView === 'chords'} onpress={() => handleViewPress('chords')}>
			<SquaresFour size={16} />
			Chords
		</z-toggle-button-group-item>
		<z-toggle-button-group-item value="pattern" isPressed={activeView === 'pattern'} onpress={() => handleViewPress('pattern')}>
			<MusicNotes size={16} />
			Pattern
		</z-toggle-button-group-item>
	</z-toggle-button-group>
</AppTopBar>
