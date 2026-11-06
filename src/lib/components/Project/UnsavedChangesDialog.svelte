<script lang="ts">
	type UnsavedChangesDialogPropsT = {
		isOpen: boolean
		onConfirm: () => void
		onDiscard: () => void
		onCancel: () => void
	}

	const props: UnsavedChangesDialogPropsT = $props()

	// The dialog also reports closes that we caused ourselves.
	// Only a close while we still think it is open is a dismissal.
	const handleDialogClose = () => {
		if (!props.isOpen) return
		props.onCancel()
	}
</script>

<z-dialog
	isOpen={props.isOpen}
	heading="Unsaved changes"
	description="You have unsaved changes in your project. Do you want to save them before leaving?"
	onclose={handleDialogClose}
>
	<z-row slot="footer" gap="sm" alignsX="end" doesWrap>
		<z-button kind="ghost" onclick={props.onCancel}>Keep editing</z-button>
		<z-button kind="outline" tone="danger" onclick={props.onDiscard}>Discard & leave</z-button>
		<z-button tone="primary" onclick={props.onConfirm}>Save & leave</z-button>
	</z-row>
</z-dialog>
