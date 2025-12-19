<script lang="ts">
	import { Separator } from '$lib/components/ui/separator'
	import { cn } from '$lib/utils'

	let { class: className } = $props()
</script>

<Separator orientation="vertical" class={cn('h-5 mx-1', className)} />
