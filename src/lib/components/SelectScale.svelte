<script lang="ts">
	import * as Select from '$lib/components/ui/select/index.js'
	import mainStore from '../stores/main.svelte.js'

	const handleSelect = (value: string) => {
		mainStore.selectedScale = value
	}
</script>

<Select.Root type="single" onValueChange={handleSelect} value={mainStore.selectedScale}>
	<Select.Trigger class="h-8 hover:bg-muted/50 px-2 min-w-[100px] border-none bg-transparent shadow-none focus:ring-0">
		<span class="text-xs">
			<span class="herMenuTriggerLabel">Scale</span>
			<span>{mainStore.selectedScale}</span>
		</span>
	</Select.Trigger>
	<Select.Content>
		<Select.Item value="Major">Major</Select.Item>
		<Select.Item value="Minor">Minor</Select.Item>
		<Select.Item value="Harmonic Minor">Harmonic Minor</Select.Item>
	</Select.Content>
</Select.Root>
