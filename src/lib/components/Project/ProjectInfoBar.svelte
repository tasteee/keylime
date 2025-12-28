<script lang="ts">
	import projectStore from '$lib/stores/project.svelte'
	import SelectBpm from './SelectBpm.svelte'
	import DialogProjectSettings from './DialogProjectSettings.svelte'
	import { Button } from '$lib/components/ui/button'
	import Box from '$lib/components/ui/box.svelte'
	import { FloppyDisk, Download, Gear } from 'phosphor-svelte'
	import to from 'await-to-ts'
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu'
	import { goto } from '$app/navigation'

	let isSettingsOpen = $state(false)
	let isSaving = $state(false)

	const dirtyIndicatorText = $derived(projectStore.isDirty ? '●' : '')

	const openSettings = () => {
		isSettingsOpen = true
	}

	const handleSettingsOpenChange = (open: boolean) => {
		isSettingsOpen = open
	}

	const handleSave = async () => {
		isSaving = true
		const [error] = await to(projectStore.save())
		if (error) console.error('Failed to save project:', error)
		isSaving = false
	}

	const handleSaveClone = async () => {
		isSaving = true
		const [error, result] = await to(projectStore.saveClone())
		if (error) {
			console.error('Failed to save clone:', error)
			isSaving = false
			return
		}
		isSaving = false
		if (result?.projectId) {
			goto(`/project/${result.projectId}`)
		}
	}
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
		<Button isIcon onclick={openSettings} aria-label="Project Settings">
			<Gear size={16} />
		</Button>

		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				<Button isIcon aria-label="Save Options">
					<FloppyDisk size={16} />
				</Button>
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end">
				<DropdownMenu.Item onclick={handleSave}>
					Save
					<FloppyDisk size={16} class="mr-2" />
				</DropdownMenu.Item>
				<DropdownMenu.Item onclick={handleSaveClone}>
					Clone & Save
					<FloppyDisk size={16} class="mr-2" />
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
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
