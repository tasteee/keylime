<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog'
	import { Button } from '$lib/components/ui/button'

	type UnsavedChangesDialogPropsT = {
		isOpen: boolean
		onOpenChange?: (open: boolean) => void
		onConfirm: () => void
		onDiscard: () => void
		onCancel: () => void
	}

	let { isOpen = $bindable(false), onOpenChange, onConfirm, onDiscard, onCancel }: UnsavedChangesDialogPropsT = $props()
</script>

<Dialog.Root bind:open={isOpen} {onOpenChange}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Unsaved Changes</Dialog.Title>
			<Dialog.Description>
				You have unsaved changes in your project. Do you want to save them before leaving?
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button kind="outline" onclick={onCancel}>Cancel</Button>
			<Button color="red" onclick={onDiscard}>Discard</Button>
			<Button onclick={onConfirm}>Save & Leave</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
