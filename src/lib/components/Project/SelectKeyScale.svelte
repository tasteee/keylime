<script lang="ts">
	import ValuePopoverButton from '$lib/components/ValuePopoverButton.svelte'
	import SelectKey from './SelectKey.svelte'
	import SelectScale from './SelectScale.svelte'
	import { useProjectEditor } from '$lib/modules/useProjectEditor'

	const projectEditor = useProjectEditor()
	const project = $derived(projectEditor.state.project)
	const keyScaleLabel = $derived(`${project.key} ${project.scale}`)
</script>

<ValuePopoverButton label="Key and scale" valueLabel={keyScaleLabel}>
	<z-row gap="md" alignsY="end">
		<SelectKey />
		<SelectScale />
	</z-row>
</ValuePopoverButton>
