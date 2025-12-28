<script lang="ts">
	import TopBarShell from '../TopBarShell.svelte'
	import projectStore from '$lib/stores/project.svelte'
	import * as ToggleTabs from '$lib/components/ui/ToggleTabs'

	const handleViewChange = (value: string) => {
		projectStore.activeView = value as 'chords' | 'pattern'
	}
</script>

<TopBarShell>
	<ToggleTabs.Root value={projectStore.activeView} size="small" onChange={handleViewChange}>
		<ToggleTabs.Option value="chords" iconName="mingcute:grid-line" iconClass="mr-2 size-4">Chords</ToggleTabs.Option>
		<ToggleTabs.Option value="pattern" iconName="mingcute:music-2-line" iconClass="mr-2 size-4">Pattern</ToggleTabs.Option>
	</ToggleTabs.Root>
</TopBarShell>
