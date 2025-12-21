<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog'
	import { Button } from '$lib/components/ui/button'

	type ConfirmDeleteDialogPropsT = {
		isOpen: boolean
		onOpenChange?: (open: boolean) => void
		onConfirm: () => void
		projectTitle: string
	}

	const props: ConfirmDeleteDialogPropsT = $props()

	const handleCancel = () => {
		if (props.onOpenChange) {
			props.onOpenChange(false)
		}
	}

	const handleConfirm = () => {
		props.onConfirm()
		if (props.onOpenChange) {
			props.onOpenChange(false)
		}
	}
</script>

<Dialog.Root open={props.isOpen} onOpenChange={props.onOpenChange}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Delete Project</Dialog.Title>
			<Dialog.Description>
				Are you sure you want to delete "{props.projectTitle}"? This action cannot be undone.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button kind="outline" onclick={handleCancel}>Cancel</Button>
			<Button color="red" onclick={handleConfirm}>Delete</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
