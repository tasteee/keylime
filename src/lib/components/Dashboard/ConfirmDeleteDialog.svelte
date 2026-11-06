<script lang="ts">
	type ConfirmDeleteDialogPropsT = {
		isOpen: boolean
		projectTitle: string
		onConfirm: () => void
		onCancel: () => void
	}

	const props: ConfirmDeleteDialogPropsT = $props()

	const dialogDescription = $derived(`"${props.projectTitle}" will be deleted for good. This can't be undone.`)
</script>

<z-alert-dialog
	isOpen={props.isOpen}
	heading="Delete this project?"
	description={dialogDescription}
	confirmLabel="Delete project"
	cancelLabel="Keep it"
	tone="danger"
	onconfirm={props.onConfirm}
	oncancel={props.onCancel}
></z-alert-dialog>
