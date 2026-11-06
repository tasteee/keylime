<script lang="ts">
	import SelectControl from './SelectControl.svelte'

	type SelectInversionPropsT = {
		value: number
		onValueChange: (value: string | undefined) => void
	}

	const props: SelectInversionPropsT = $props()

	const inversionOptions = [
		{ value: '0', label: 'Root position' },
		{ value: '1', label: '1st inversion' },
		{ value: '2', label: '2nd inversion' },
		{ value: '3', label: '3rd inversion' }
	]
</script>

<SelectControl
	label="Inversion"
	labelPlacement="top"
	isFullWidth
	value={String(props.value)}
	options={inversionOptions}
	onValueChange={props.onValueChange}
/>
