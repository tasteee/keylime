<script lang="ts">
	import { FloppyDisk } from 'phosphor-svelte'
	import type { useProjectEditor } from '$lib/modules/useProjectEditor'

	type DialogProjectSettingsPropsT = {
		isOpen: boolean
		onOpenChange: (open: boolean) => void
		projectEditor: ReturnType<typeof useProjectEditor>
	}

	const props: DialogProjectSettingsPropsT = $props()

	let isSaving = $state(false)
	let localTitle = $state('')
	let localDescription = $state('')
	let localIsPublic = $state(false)

	const saveButtonLabel = $derived(isSaving ? 'Saving…' : 'Save')

	const captureInitialState = () => {
		localTitle = props.projectEditor.state.project.title
		localDescription = props.projectEditor.state.project.description
		localIsPublic = props.projectEditor.state.project.isPublic
	}

	$effect(() => {
		if (props.isOpen) captureInitialState()
	})

	const handleTitleInput = (event: CustomEvent) => {
		localTitle = event.detail.value
	}

	const handleDescriptionInput = (event: CustomEvent) => {
		localDescription = event.detail.value
	}

	const handlePublicChange = (event: CustomEvent) => {
		localIsPublic = event.detail.checked
	}

	const handleDialogClose = () => {
		if (!props.isOpen) return
		props.onOpenChange(false)
	}

	const handleClose = () => {
		props.onOpenChange(false)
	}

	const handleSave = async () => {
		isSaving = true

		props.projectEditor.updateProject({
			title: localTitle,
			description: localDescription,
			isPublic: localIsPublic
		})

		await props.projectEditor.save()
		isSaving = false
		props.onOpenChange(false)
	}
</script>

<z-dialog isOpen={props.isOpen} heading="Project settings" onclose={handleDialogClose}>
	<z-column gap="md" insetY="xs">
		<z-field label="Title">
			<z-input value={localTitle} placeholder="Project title" oninput={handleTitleInput}></z-input>
		</z-field>

		<z-field label="Description">
			<z-textarea value={localDescription} placeholder="Project description" rows={4} oninput={handleDescriptionInput}></z-textarea>
		</z-field>

		<z-checkbox
			description="Anyone can find, play, and clone a public project."
			isChecked={localIsPublic}
			onchange={handlePublicChange}
		>
			Public project
		</z-checkbox>
	</z-column>

	<z-row slot="footer" gap="sm" alignsX="end">
		<z-button kind="ghost" onclick={handleClose}>Close</z-button>
		<z-button tone="primary" isLoading={isSaving} onclick={handleSave}>
			<FloppyDisk size={16} />
			{saveButtonLabel}
		</z-button>
	</z-row>
</z-dialog>
