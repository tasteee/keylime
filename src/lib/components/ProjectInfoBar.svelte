<script lang="ts">
	import projectStore from '$lib/stores/project.svelte'
	import SelectBpm from './SelectBpm.svelte'
	import DialogProjectSettings from './DialogProjectSettings.svelte'
	import { Button } from '$lib/components/ui/button'
	import Box from './Box.svelte'

	let isSettingsOpen = $state(false)
	let isSaving = $state(false)

	const openSettings = () => {
		isSettingsOpen = true
	}

	const handleSettingsOpenChange = (open: boolean) => {
		isSettingsOpen = open
	}

	const handleSave = async () => {
		isSaving = true
		try {
			await projectStore.save()
		} catch (error) {
			console.error('Failed to save project:', error)
		} finally {
			isSaving = false
		}
	}

	const dirtyIndicatorText = $derived(projectStore.isDirty ? '●' : '')
</script>

<Box class="ProjectInfoBar" padding="0 12px" height="48px" align="center" justify="between">
	<Box gap="12px" align="center">
		<span class="herPanelTitle">Project</span>
		{#if dirtyIndicatorText}
			<span class="dirtyIndicator">{dirtyIndicatorText}</span>
		{/if}
		<span class="projectTitle">{projectStore.title}</span>
	</Box>

	<Box gap="8px">
		<SelectBpm />
		<Button onclick={openSettings}>Settings</Button>

		<Box gap="8px">
			<Button>Options</Button>
			<Button onclick={handleSave} disabled={isSaving}>
				{isSaving ? 'Saving...' : 'Save'}
			</Button>
		</Box>
	</Box>
</Box>

<DialogProjectSettings isOpen={isSettingsOpen} onOpenChange={handleSettingsOpenChange} />

<style>
	:global(.ProjectInfoBar) {
		background: var(--colorWhite);
		border-bottom: 1px solid var(--n-03);
		/* border-top: 1px solid var(--n-03); */
	}

	.dirtyIndicator {
		color: var(--a);
		font-size: 12px;
		line-height: 1;
		animation: pulse 2s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	.projectTitle {
		font-size: 14px;
		color: #525252;
	}
</style>
