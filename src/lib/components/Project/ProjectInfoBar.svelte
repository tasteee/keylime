<script lang="ts">
	import { useProjectEditor } from '$lib/modules/useProjectEditor'
	import SelectBpm from './SelectBpm.svelte'
	import SelectOctave from './SelectOctave.svelte'
	import DialogProjectSettings from './DialogProjectSettings.svelte'
	import { Button } from '$lib/components/ui/button'
	import Box from '$lib/components/ui/box.svelte'
	import Divider from '../ui/divider.svelte'
	import { FloppyDisk, Download, Gear } from 'phosphor-svelte'
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu'
	import { goto } from '$app/navigation'
	import { awaited } from '$lib/modules/the-awaited'

	const projectEditor = useProjectEditor()
	const project = $derived(projectEditor.state.project)
	const isDirty = $derived(projectEditor.state.isDirty)

	let isSettingsOpen = $state(false)
	let isSaving = $state(false)

	const dirtyIndicatorText = $derived(isDirty ? '●' : '')

	const openSettings = () => {
		isSettingsOpen = true
	}

	const handleSettingsOpenChange = (open: boolean) => {
		isSettingsOpen = open
	}

	const handleSave = async () => {
		console.log('project bar save icon action clicked')
		isSaving = true
		const saveResult = await projectEditor.save()
		console.log('project bar save success', saveResult)
		isSaving = false
	}

	const handleSaveClone = async () => {
		isSaving = true
		const saveCloneResult = await awaited(projectEditor.saveClone())

		if (saveCloneResult.error) {
			console.error('Failed to save clone:', saveCloneResult.error)
			isSaving = false
			return
		}

		isSaving = false

		if (saveCloneResult.data) {
			goto(`/project/${saveCloneResult.data.newProjectId}`)
		}
	}
</script>

<Box class="ProjectInfoBar" padding="0 12px" height="48px" align="center" justify="between">
	<Box gap="12px" align="center">
		<span class="herPanelTitle">Project</span>
		{#if dirtyIndicatorText}
			<span class="dirtyIndicator">{dirtyIndicatorText}</span>
		{/if}
		<span class="projectTitle">{project.title}</span>
	</Box>

	<Box gap="8px" align="center">
		<SelectBpm />
		<SelectOctave />

		<Divider margin="24px" />

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
