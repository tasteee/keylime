<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog'
	import { Button } from '$lib/components/ui/button'
	import { Label } from '$lib/components/ui/label'
	import Icon from '@iconify/svelte'
	import Input from '../ui/input/input.svelte'
	import { Textarea } from '../ui/textarea'
	import { Checkbox } from '../ui/checkbox'
	import type { useProjectEditor } from '$lib/modules/useProjectEditor'

	type DialogProjectSettingsPropsT = {
		isOpen: boolean
		onOpenChange: (open: boolean) => void
		projectEditor: ReturnType<typeof useProjectEditor>
	}

	let { isOpen = $bindable(false), onOpenChange, projectEditor }: DialogProjectSettingsPropsT = $props()

	let isSaving = $state(false)
	let localTitle = $state('')
	let localDescription = $state('')
	let localIsPublic = $state(false)

	const captureInitialState = () => {
		localTitle = projectEditor.state.project.title
		localDescription = projectEditor.state.project.description
		localIsPublic = projectEditor.state.project.isPublic
	}

	$effect(() => {
		if (isOpen) {
			captureInitialState()
		}
	})

	const handleTitleChange = (event: Event) => {
		const target = event.target as HTMLInputElement
		localTitle = target.value
	}

	const handleDescriptionChange = (event: Event) => {
		const target = event.target as HTMLTextAreaElement
		localDescription = target.value
	}

	const handleSave = async () => {
		console.log('project settings dialog handleSave')
		isSaving = true

		projectEditor.updateProject({
			title: localTitle,
			description: localDescription,
			isPublic: localIsPublic
		})

		const saveResult = await projectEditor.save()
		console.log('project settings dialog result:', saveResult)
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
				<Input
					id="dialogProjectTitle"
					type="text"
					size="medium"
					value={localTitle}
					oninput={handleTitleChange}
					placeholder="Project title"
				/>
			</div>

			<div class="settingGroup">
				<Label for="dialogProjectDescription" class="text-sm font-bold">Description</Label>
				<Textarea
					id="dialogProjectDescription"
					class="herInput herTextarea"
					value={localDescription}
					oninput={handleDescriptionChange}
					placeholder="Project description"
				></Textarea>
			</div>

			<div class="settingGroup checkboxGroup">
				<Label for="dialogProjectPublic" class="text-sm font-bold gap-2 flex cursor-pointer items-center">
					<Checkbox id="dialogProjectPublic" bind:isChecked={localIsPublic} />
					Public Project
				</Label>
			</div>
		</div>

		<Dialog.Footer>
			<Button size="large" isFullWidth kind="outline" onclick={handleClose} class="flex-1">
				<Icon icon="mingcute:close-line" class="size-4" />
				Close
			</Button>
			<Button size="large" isFullWidth color="brand" onclick={handleSave} class="flex-1" disabled={isSaving}>
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
		gap: 2px;
	}

	.checkboxGroup {
		flex-direction: row;
		align-items: center;
	}
</style>
