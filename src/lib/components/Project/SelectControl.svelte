<script lang="ts">
	type SelectOptionT = {
		value: string
		label: string
	}

	type SelectControlPropsT = {
		label: string
		value: string
		options: SelectOptionT[]
		onValueChange: (value: string) => void
		size?: 'sm' | 'md' | 'lg'
		// 'start' puts the label beside the control, 'top' stacks it above.
		labelPlacement?: 'start' | 'top'
		isFullWidth?: boolean
	}

	const props: SelectControlPropsT = $props()

	const controlSize = $derived(props.size ?? 'sm')
	const isLabelOnTop = $derived(props.labelPlacement === 'top')
	const isInline = $derived(!props.isFullWidth)

	const handleChange = (event: CustomEvent) => {
		const nextValue: string = event.detail.value
		props.onValueChange(nextValue)
	}
</script>

{#if isLabelOnTop}
	<z-field label={props.label} size={controlSize}>
		<z-select value={props.value} options={props.options} size={controlSize} onchange={handleChange}></z-select>
	</z-field>
{:else}
	<z-row gap="xs" alignsY="center">
		<z-text size="xs" color="muted" weight={600} class="controlLabel">{props.label}</z-text>
		<z-select
			value={props.value}
			options={props.options}
			label={props.label}
			size={controlSize}
			isInline={isInline}
			onchange={handleChange}
		></z-select>
	</z-row>
{/if}

<style>
	.controlLabel {
		white-space: nowrap;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
</style>
