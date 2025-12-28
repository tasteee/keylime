<script lang="ts">
	import TopBarShell from '../TopBarShell.svelte'
	import { useProjectEditor } from '$lib/modules/useProjectEditor'
	import * as ToggleTabs from '$lib/components/ui/ToggleTabs'

	const projectEditor = useProjectEditor()
	const activeView = $derived(projectEditor.state.activeView)

	const handleViewChange = (value: string) => {
		projectEditor.state.activeView = value as 'chords' | 'pattern'
	}
</script>

<TopBarShell>
	<ToggleTabs.Root value={activeView} size="small" onChange={handleViewChange}>
		<ToggleTabs.Option value="chords" iconName="mingcute:grid-line" iconClass="mr-2 size-4">Chords</ToggleTabs.Option>
		<ToggleTabs.Option value="pattern" iconName="mingcute:music-2-line" iconClass="mr-2 size-4">Pattern</ToggleTabs.Option>
	</ToggleTabs.Root>
</TopBarShell>
