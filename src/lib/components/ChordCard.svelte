<script>
	import * as Item from '$lib/components/ui/item'
	import { Button } from '$lib/components/ui/button'
	import Icon from '@iconify/svelte'

	const props = $props()
</script>

<Item.Root variant="outline">
	<Item.Content>
		<Item.Title>{props.note}</Item.Title>
		<!-- <Item.Description>{props.description}</Item.Description> -->
	</Item.Content>
	<Item.Actions>
		<Button variant="outline" size="sm">
			<Icon icon="mingcute:add-line" class="size-3" />
		</Button>
	</Item.Actions>
</Item.Root>

<style>
</style>
