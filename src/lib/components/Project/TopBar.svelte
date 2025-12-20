<script lang="ts">
	import { Button } from '$lib/components/ui/button'
	import Icon from '@iconify/svelte'
	import TopBarShell from '../TopBarShell.svelte'
	import projectStore from '$lib/stores/project.svelte'
</script>

<TopBarShell>
	<nav class="nav">
		<Button
			kind={projectStore.activeView === 'chords' ? 'solid' : 'outline'}
			size="small"
			onclick={() => (projectStore.activeView = 'chords')}
		>
			<Icon icon="mingcute:grid-line" class="mr-2 size-4" />
			Chords
		</Button>
		<Button
			kind={projectStore.activeView === 'pattern' ? 'solid' : 'outline'}
			size="small"
			onclick={() => (projectStore.activeView = 'pattern')}
		>
			<Icon icon="mingcute:music-2-line" class="mr-2 size-4" />
			Pattern
		</Button>
	</nav>
</TopBarShell>

<style>
	.nav {
		display: flex;
		gap: 4px;
		padding: 4px;
		background-color: var(--n-01);
		border-radius: var(--radius-md);
		border: 1px solid var(--border-subtle);
	}
</style>
