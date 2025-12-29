<script lang="ts">
	import ContextFrame from '$lib/components/Project/ContextFrame.svelte'

	type PropsT = {
		children: () => any

		data: {
			project: ProjectT
		}
	}

	const props: PropsT = $props()
</script>

<ContextFrame project={props.data.project}>
	{@render props.children()}
</ContextFrame>
