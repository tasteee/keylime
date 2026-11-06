<script lang="ts">
	import { FloppyDisk, Gear, PencilSimple } from 'phosphor-svelte'
	import { useProjectEditor } from '$lib/modules/useProjectEditor'
	import { goToPath } from '$lib/modules/navigate'
	import { awaited } from '$lib/modules/the-awaited'
	import SelectBpm from './SelectBpm.svelte'
	import SelectOctave from './SelectOctave.svelte'
	import SelectKey from './SelectKey.svelte'
	import SelectScale from './SelectScale.svelte'
	import DialogProjectSettings from './DialogProjectSettings.svelte'

	const projectEditor = useProjectEditor()
	const project = $derived(projectEditor.state.project)
	const isDirty = $derived(projectEditor.state.isDirty)

	let isSettingsOpen = $state(false)
	let isSaving = $state(false)

	const saveButtonTone = $derived(isDirty ? 'primary' : 'neutral')
	const saveButtonKind = $derived(isDirty ? 'solid' : 'outline')

	const saveMenuItems = [
		{ value: 'save', label: 'Save', shortcut: '⌘S' },
		{ value: 'clone', label: 'Clone & save' }
	]

	const openSettings = () => {
		isSettingsOpen = true
	}

	const handleSettingsOpenChange = (open: boolean) => {
		isSettingsOpen = open
	}

	const handleSave = async () => {
		isSaving = true

		try {
			await projectEditor.save()
		} catch (error) {
			console.error('project bar save failed', error)
		} finally {
			isSaving = false
		}
	}

	const handleSaveClone = async () => {
		isSaving = true
		const saveCloneResult = await awaited(projectEditor.saveClone())
		isSaving = false

		if (saveCloneResult.error) {
			console.error('Failed to save clone:', saveCloneResult.error)
			return
		}

		if (saveCloneResult.data) goToPath(`/project/${saveCloneResult.data.newProjectId}`)
	}

	const handleSaveMenuSelect = async (event: CustomEvent) => {
		const selectedValue: string = event.detail.value
		if (selectedValue === 'save') await handleSave()
		if (selectedValue === 'clone') await handleSaveClone()
	}
</script>

<z-column>
	<z-row insetX="lg" insetY="sm" alignsX="between" alignsY="center" gap="lg" isFullWidth>
		<z-row gap="sm" alignsY="center" class="projectTitleRow">
			<z-eyebrow label="Project" tone="neutral"></z-eyebrow>
			{#if isDirty}
				<z-status-dot status="away" doesPulse label="Unsaved"></z-status-dot>
			{/if}
			<z-button kind="ghost" size="sm" onclick={openSettings} aria-label="Edit project settings">
				<PencilSimple size={14} />
				<span class="projectTitle">{project.title}</span>
			</z-button>
		</z-row>

		<z-row gap="md" alignsY="center">
			<SelectBpm />
			<SelectOctave />
			<SelectKey />
			<SelectScale />

			<z-separator isVertical></z-separator>

			<z-tooltip content="Project settings" placement="bottom">
				<z-button kind="outline" size="sm" onclick={openSettings} aria-label="Project settings">
					<Gear size={16} />
				</z-button>
			</z-tooltip>

			<z-menu items={saveMenuItems} align="end" onselect={handleSaveMenuSelect}>
				<z-button
					slot="trigger"
					kind={saveButtonKind}
					tone={saveButtonTone}
					size="sm"
					isLoading={isSaving}
					aria-label="Save options"
					ondblclick={handleSave}
				>
					<FloppyDisk size={16} />
					Save
				</z-button>
			</z-menu>
		</z-row>
	</z-row>
	<z-separator></z-separator>
</z-column>

<DialogProjectSettings isOpen={isSettingsOpen} onOpenChange={handleSettingsOpenChange} {projectEditor} />

<style>
	.projectTitleRow {
		min-width: 0;
	}

	.projectTitle {
		max-width: 16rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
