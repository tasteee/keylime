<script lang="ts">
	import { FloppyDisk } from 'phosphor-svelte'
	import { useProjectEditor } from '$lib/modules/useProjectEditor'
	import { goToPath } from '$lib/modules/navigate'
	import { awaited } from '$lib/modules/the-awaited'

	const projectEditor = useProjectEditor()
	const isDirty = $derived(projectEditor.state.isDirty)

	let isSaving = $state(false)

	const saveButtonTone = $derived(isDirty ? 'primary' : 'neutral')
	const saveButtonKind = $derived(isDirty ? 'solid' : 'outline')

	const saveMenuItems = [
		{ value: 'save', label: 'Save', shortcut: '⌘S' },
		{ value: 'clone', label: 'Clone & save' }
	]

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
