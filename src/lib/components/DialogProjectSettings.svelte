<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog'
	import { Button } from '$lib/components/ui/button'
	import { Label } from '$lib/components/ui/label'
	import Icon from '@iconify/svelte'
	import projectStore from '$lib/stores/project.svelte'

	type DialogProjectSettingsPropsT = {
		isOpen: boolean
		onOpenChange: (open: boolean) => void
	}

	let { isOpen = $bindable(false), onOpenChange }: DialogProjectSettingsPropsT = $props()

	let isSaving = $state(false)

	const handleTitleChange = (event: Event) => {
		const target = event.target as HTMLInputElement
		projectStore.title = target.value
		projectStore.markDirty()
	}

	const handleDescriptionChange = (event: Event) => {
		const target = event.target as HTMLTextAreaElement
		projectStore.description = target.value
		projectStore.markDirty()
	}

	const handlePublicToggle = () => {
		projectStore.isPublic = !projectStore.isPublic
		projectStore.markDirty()
	}

	const handleSave = async () => {
		isSaving = true
		await projectStore.save()
		isSaving = false
		onOpenChange(false)
	}

	const handleClose = () => {
		onOpenChange(false)
	}
</script>

<Dialog.Root open={isOpen} {onOpenChange}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title class="text-3xl">Project Settings</Dialog.Title>
		</Dialog.Header>

		<div class="space-y-4 pt-4 mb-4">
			<div class="settingGroup">
				<Label for="dialogProjectTitle" class="text-sm font-bold">Title</Label>
				<input
					id="dialogProjectTitle"
					type="text"
					class="herInput"
					value={projectStore.title}
					oninput={handleTitleChange}
					placeholder="Project title"
				/>
			</div>

			<div class="settingGroup">
				<Label for="dialogProjectDescription" class="text-sm font-bold">Description</Label>
				<textarea
					id="dialogProjectDescription"
					class="herInput herTextarea"
					value={projectStore.description}
					oninput={handleDescriptionChange}
					placeholder="Project description"
				></textarea>
			</div>

			<div class="settingGroup checkboxGroup">
				<Label for="dialogProjectPublic" class="text-sm font-bold gap-2 flex cursor-pointer items-center">
					<input id="dialogProjectPublic" type="checkbox" checked={projectStore.isPublic} onchange={handlePublicToggle} />
					Public Project
				</Label>
			</div>
		</div>

		<Dialog.Footer>
			<Button variant="outline" onclick={handleClose} class="flex-1">
				<Icon icon="mingcute:close-line" class="size-4" />
				Close
			</Button>
			<Button onclick={handleSave} class="flex-1" disabled={!projectStore.isDirty || isSaving}>
				<Icon icon="mingcute:save-line" class="size-4" />
				{isSaving ? 'Saving...' : 'Save'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<style>
	.settingGroup {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.checkboxGroup {
		flex-direction: row;
		align-items: center;
	}

	.herInput {
		padding: 8px 12px;
		border: 2px solid #d4d4d4;
		border-radius: 6px;
		font-size: 14px;
		font-weight: 500;
		background: white;
		transition: all 0.15s ease;
		outline: none;
		font-family: inherit;
	}

	.herInput:focus {
		border-color: #a3a3a3;
		box-shadow: 0 0 0 3px rgba(163, 163, 163, 0.1);
	}

	.herInput::placeholder {
		color: #a3a3a3;
	}

	.herTextarea {
		resize: vertical;
		min-height: 80px;
		max-height: 200px;
	}

	input[type='checkbox'] {
		width: 18px;
		height: 18px;
		cursor: pointer;
		accent-color: #ff6b9d;
	}
</style>
